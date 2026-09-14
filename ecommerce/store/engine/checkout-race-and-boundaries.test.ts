// Three defects found while reviewing this extension for the campaign:
//
//  1. `/admin/*` and `/public/*` dynamic routes interpolate `:id` straight into
//     `WHERE id = $1` against a `uuid` column. A malformed id is not refused by
//     a validator — Postgres refuses the STATEMENT with 22P02, a raw 500, not
//     a 404. Same class already found and fixed in hr/employees and crm.
//  2. `POST /orders` reads each line's stock with a plain `db` SELECT, decides
//     "insufficient stock" in JavaScript, then — inside the checkout
//     transaction — decrements `stock_qty` unconditionally. Two concurrent
//     checkouts for the last unit both read the same starting quantity, both
//     pass the check, and both decrement: the product oversells and
//     `stock_qty` goes negative. Same read-decide-write-no-lock shape as
//     operations/traceability's lot consumption and finance/invoicing's
//     payments.
//  3. The RBAC gate (`permissionGate(ctx, 'store')` on `/admin/*`) had no test
//     proving it was wired at all.
//
// Every test here was checked the campaign's way: put the old code back,
// watch the named test go red, restore, watch it go green again.
import { describe, expect, it, beforeAll } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;
const d = DB_URL ? describe : describe.skip;

d('ecommerce/store: malformed ids answer 404, not 500', () => {
  let app: any;

  beforeAll(async () => {
    ({ app } = await mountForTest(new URL('.', import.meta.url).pathname));
  });

  it('GET /admin/orders/:id with a non-uuid id is 404', async () => {
    const res = await app.request('/admin/orders/not-a-uuid');
    expect(res.status).toBe(404);
  });

  it('PATCH /admin/products/:id with a non-uuid id is 404', async () => {
    const res = await app.request('/admin/products/not-a-uuid', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    });
    expect(res.status).toBe(404);
  });

  it('DELETE /admin/products/:id with a non-uuid id is 404', async () => {
    const res = await app.request('/admin/products/not-a-uuid', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });

  it('PATCH /admin/categories/:id with a non-uuid id is 404', async () => {
    const res = await app.request('/admin/categories/not-a-uuid', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    });
    expect(res.status).toBe(404);
  });

  it('PATCH /admin/coupons/:id with a non-uuid id is 404', async () => {
    const res = await app.request('/admin/coupons/not-a-uuid', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    });
    expect(res.status).toBe(404);
  });

  it('PATCH /admin/reviews/:id with a non-uuid id is 404', async () => {
    const res = await app.request('/admin/reviews/not-a-uuid', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    expect(res.status).toBe(404);
  });

  it('PATCH /admin/variants/:id with a non-uuid id is 404', async () => {
    const res = await app.request('/admin/variants/not-a-uuid', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    });
    expect(res.status).toBe(404);
  });

  it('GET /admin/products/:id/variants with a non-uuid product id is 404', async () => {
    const res = await app.request('/admin/products/not-a-uuid/variants');
    expect(res.status).toBe(404);
  });

  it('POST /admin/shipping-zones/:id/rates with a non-uuid zone id is 404', async () => {
    const res = await app.request('/admin/shipping-zones/not-a-uuid/rates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    });
    expect(res.status).toBe(404);
  });

  // Public, unauthenticated — the higher-severity half of this class: anyone
  // can fuzz this path with no account at all.
  it('POST /public/products/:id/reviews with a non-uuid product id is 404', async () => {
    const res = await app.request('/public/products/not-a-uuid/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customer_name: 'A', customer_email: 'a@example.com', rating: 5 }),
    });
    expect(res.status).toBe(404);
  });

  // The positive control: a well-formed but absent id still answers 404 the
  // way it always did — not swallowed by an over-eager guard.
  it('a well-formed but absent id is still 404', async () => {
    const res = await app.request('/admin/orders/00000000-0000-4000-8000-000000000000');
    expect(res.status).toBe(404);
  });
});

d('ecommerce/store: checkout does not oversell under concurrency', () => {
  let app: any;

  beforeAll(async () => {
    ({ app } = await mountForTest(new URL('.', import.meta.url).pathname));
    // Warm the harness pool before any concurrency assertion — it is created
    // lazily with max: 4, so on a cold pool the first request commits before
    // the others overlap and the race never happens. Measured elsewhere in
    // this campaign (finance/invoicing): a concurrency test stayed green with
    // the fix reverted until this warm-up was added.
    await Promise.all([0, 1, 2, 3].map(() => app.request('/admin/products')));
  });

  it('two concurrent orders for the last unit: exactly one succeeds, stock never goes negative', async () => {
    const created = await app.request('/admin/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Race Product',
        slug: `race-product-${Date.now()}`,
        sku: `SKU-RACE-${Date.now()}`,
        price: 50,
        stock_qty: 1,
        track_stock: true,
        allow_backorder: false,
        status: 'active',
      }),
    });
    expect(created.status).toBe(201);
    const product = (await created.json()).data;

    const buy = () =>
      app.request('/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer_email: 'buyer@example.com',
          customer_name: 'Buyer',
          lines: [{ product_id: product.id, quantity: 1 }],
        }),
      });

    const [ra, rb] = await Promise.all([buy(), buy()]);
    const statuses = [ra.status, rb.status].sort();
    // Exactly one checkout succeeds; the other is refused, not silently
    // accepted against stock that is no longer there.
    expect(statuses.filter((s) => s === 201).length).toBe(1);
    expect(statuses.filter((s) => s === 400).length).toBe(1);

    const after = await app.request(`/admin/products?q=${product.sku}`);
    const rows = (await after.json()).data;
    const row = rows.find((r: any) => r.id === product.id);
    // Before the fix: both requests read stock_qty=1, both passed the check,
    // both decremented — stock_qty landed at -1 and two orders were created
    // for one unit of stock.
    expect(row.stock_qty).toBe(0);
  }, 30_000);

  // The positive control: two DIFFERENT single-unit products bought at once
  // both succeed. A fix that serialises checkout globally would pass the test
  // above for the wrong reason.
  it('two concurrent orders for two different products both succeed', async () => {
    const mk = async (n: number) => {
      const res = await app.request('/admin/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: `Control Product ${n}`,
          slug: `control-product-${n}-${Date.now()}`,
          sku: `SKU-CTRL-${n}-${Date.now()}`,
          price: 20,
          stock_qty: 1,
          track_stock: true,
          allow_backorder: false,
          status: 'active',
        }),
      });
      return (await res.json()).data;
    };
    const [p1, p2] = await Promise.all([mk(1), mk(2)]);

    const buy = (productId: string) =>
      app.request('/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer_email: 'buyer2@example.com',
          customer_name: 'Buyer',
          lines: [{ product_id: productId, quantity: 1 }],
        }),
      });

    const [ra, rb] = await Promise.all([buy(p1.id), buy(p2.id)]);
    expect(ra.status).toBe(201);
    expect(rb.status).toBe(201);
  }, 30_000);
});

d('ecommerce/store: the admin RBAC gate is wired and exercised', () => {
  it('anonymous is refused', async () => {
    const { app } = await mountForTest(new URL('.', import.meta.url).pathname, { authed: false, admin: false });
    const res = await app.request('/admin/categories');
    expect(res.status).toBe(401);
  });

  it('an authenticated non-admin is refused', async () => {
    const { app } = await mountForTest(new URL('.', import.meta.url).pathname, { authed: true, admin: false });
    const res = await app.request('/admin/categories');
    expect(res.status).toBe(403);
  });

  it('an admin reaches the route', async () => {
    const { app } = await mountForTest(new URL('.', import.meta.url).pathname, { authed: true, admin: true });
    const res = await app.request('/admin/categories');
    expect(res.status).toBe(200);
  });

  it('the public storefront needs no session at all', async () => {
    const { app } = await mountForTest(new URL('.', import.meta.url).pathname, { authed: false, admin: false });
    const res = await app.request('/public/categories');
    expect(res.status).toBe(200);
  });
});
