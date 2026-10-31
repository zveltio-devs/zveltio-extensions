// The store actions over an in-memory data API that answers like the
// engine's: decimals may come back as strings, a filter applies one operator
// per field, `expect` guards an update, and a collection the caller may not
// read refuses with 403. The engine's own data API and its checks are tested
// in the engine; this proves what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { storeActions as a } from './actions';

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  ec_products: { status: 'active', currency: 'RON', tax_rate: 19, stock_qty: 0, track_stock: true, allow_backorder: false, review_count: 0 },
  ec_product_variants: { is_active: true, stock_qty: 0 },
  ec_coupons: { is_active: true, used_count: 0, type: 'percent' },
  ec_order_series: { next_number: 1 },
  ec_orders: { status: 'pending' },
  ec_product_reviews: { status: 'pending' },
};

// Decimals as the driver sends NUMERIC: strings.
const out = (r: Row) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v]));

function fakeHost(unreadable: string[] = []) {
  const tables: Record<string, Row[]> = {};
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const match = (r: Row, filter: Row = {}) => Object.entries(filter).every(([k, v]) => r[k] === v);
  const guard = (c: string) => {
    if (unreadable.includes(c)) throw Object.assign(new Error('Forbidden'), { status: 403 });
  };
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => {
        guard(c);
        const r = rows(c).find((x) => x.id === id);
        return r ? out(r) : null;
      },
      list: async (c: string, q: { filter?: Row; limit?: number; page?: number } = {}) => {
        guard(c);
        const lim = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * lim;
        return { records: rows(c).filter((r) => match(r, q.filter)).slice(from, from + lim).map(out) };
      },
      insert: async (c: string, data: Row) => {
        const row = { id: `id-${++seq}`, ...DEFAULTS[c], ...data };
        rows(c).push(row);
        return out(row);
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = rows(c).find((r) => r.id === id)!;
        for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
          if (!vs.map(String).includes(String(row[k]))) throw new ActionRefusal(409, 'precondition_failed', k);
        }
        return out(Object.assign(row, data));
      },
      delete: async () => {},
    },
  };
  return { host: host as never, rows, seed: (c: string, data: Row) => host.collections.insert(c, data) as Promise<Row> };
}

const refusal = async (p: Promise<unknown>, code: string) => {
  const err = await p.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(ActionRefusal);
  expect((err as { code: string }).code).toBe(code);
};

const buyer = { customer_email: 'ana@example.com', customer_name: 'Ana' };

describe('checkout', () => {
  it('numbers the order, prices it from the shop, applies coupon and shipping, takes stock', async () => {
    const { host, rows, seed } = fakeHost();
    const p = await seed('ec_products', { name: 'Mug', sku: 'MUG', price: 10, tax_rate: 10, stock_qty: 5 });
    const v = await seed('ec_product_variants', { product_id: p.id, name: 'Red', sku: 'MUG-R', price: 12, stock_qty: 1 });
    await seed('ec_coupons', { code: 'TEN', value: 10 });
    const zone = await seed('ec_shipping_zones', { name: 'RO', is_active: true });
    const rate = await seed('ec_shipping_rates', { zone_id: zone.id, type: 'flat', price: 15, is_active: true });
    await seed('ec_abandoned_carts', { session_id: 's1', recovered_at: null });
    const o1 = (await a.checkout(
      { ...buyer, coupon_code: 'TEN', shipping_rate_id: rate.id, session_id: 's1', lines: [{ product_id: p.id, quantity: 2 }, { product_id: p.id, variant_id: v.id, quantity: 1 }] },
      host,
    )) as Row;
    const o2 = (await a.checkout({ ...buyer, lines: [{ product_id: p.id, quantity: 1 }] }, host)) as Row;
    expect([o1.order_number, o2.order_number, o1.currency]).toEqual(['ORD-000001', 'ORD-000002', 'RON']);
    // 2×10 + 12 = 32; 10% off = 3.2; tax 10% of 32 = 3.2; +15 shipping.
    expect([o1.subtotal, o1.discount, o1.tax_amount, o1.shipping_cost, o1.total, o1.shipping_zone_id]).toEqual(['32', '3.2', '3.2', '15', '47', zone.id]);
    expect(rows('ec_order_items').map((i) => [i.sku, i.unit_price, i.total])).toEqual([
      ['MUG', 10, 20],
      ['MUG-R', 12, 12],
      ['MUG', 10, 10],
    ]);
    expect([rows('ec_products')[0].stock_qty, rows('ec_product_variants')[0].stock_qty]).toEqual([2, 0]);
    expect(rows('ec_coupons')[0].used_count).toBe(1);
    expect(rows('ec_abandoned_carts')[0].recovered_at).toBeTruthy();
  });

  it('refuses a shortfall, an inactive product or variant, and a coupon that does not apply', async () => {
    const { host, rows, seed } = fakeHost();
    const p = await seed('ec_products', { name: 'Mug', price: 10, stock_qty: 1 });
    await refusal(a.checkout({ ...buyer, lines: [{ product_id: p.id, quantity: 2 }] }, host), 'insufficient_stock');
    const draft = await seed('ec_products', { name: 'Draft', status: 'draft' });
    await refusal(a.checkout({ ...buyer, lines: [{ product_id: draft.id, quantity: 1 }] }, host), 'product_not_found');
    const off = await seed('ec_product_variants', { product_id: p.id, name: 'Off', is_active: false });
    await refusal(a.checkout({ ...buyer, lines: [{ product_id: p.id, variant_id: off.id, quantity: 1 }] }, host), 'variant_not_found');
    await seed('ec_coupons', { code: 'ONCE', value: 5, max_uses: 1, used_count: 1 });
    await seed('ec_coupons', { code: 'BIG', value: 5, min_order_amount: 100 });
    await seed('ec_coupons', { code: 'LATER', value: 5, valid_from: new Date(Date.now() + 86_400_000).toISOString() });
    const eur = await seed('ec_products', { name: 'Euro', price: 1, currency: 'EUR', stock_qty: 5 });
    await refusal(a.checkout({ ...buyer, lines: [{ product_id: p.id, quantity: 1 }, { product_id: eur.id, quantity: 1 }] }, host), 'mixed_currencies');
    for (const code of ['ONCE', 'BIG', 'LATER', 'NOPE']) {
      await refusal(a.checkout({ ...buyer, coupon_code: code, lines: [{ product_id: p.id, quantity: 1 }] }, host), 'coupon_invalid');
    }
    // A product sold past zero only when it allows backorders or does not track stock.
    const back = await seed('ec_products', { name: 'Back', price: 1, allow_backorder: true });
    await a.checkout({ ...buyer, lines: [{ product_id: back.id, quantity: 3 }] }, host);
    expect(rows('ec_products').find((r) => r.id === back.id)?.stock_qty).toBe(-3);
  });

  it('ships free above the rate threshold', async () => {
    const { host, seed } = fakeHost();
    const p = await seed('ec_products', { name: 'Mug', price: 60, tax_rate: 0, stock_qty: 5 });
    const zone = await seed('ec_shipping_zones', { is_active: true });
    const rate = await seed('ec_shipping_rates', { zone_id: zone.id, type: 'free_above', price: 9, free_above_amount: 100, is_active: true });
    const small = (await a.checkout({ ...buyer, shipping_rate_id: rate.id, lines: [{ product_id: p.id, quantity: 1 }] }, host)) as Row;
    const big = (await a.checkout({ ...buyer, shipping_rate_id: rate.id, lines: [{ product_id: p.id, quantity: 2 }] }, host)) as Row;
    expect([small.shipping_cost, big.shipping_cost]).toEqual(['9', '0']);
  });
});

describe('saveCart', () => {
  it('keeps one cart per session and its recovery token', async () => {
    const { host, rows } = fakeHost();
    const c1 = (await a.saveCart({ session_id: 's1', items: [{ sku: 'A' }], subtotal: 5 }, host)) as Row;
    const c2 = (await a.saveCart({ session_id: 's1', customer_email: 'ana@example.com', items: [{ sku: 'B' }], subtotal: 7 }, host)) as Row;
    expect(c2).toEqual(c1);
    expect(rows('ec_abandoned_carts')).toHaveLength(1);
    expect(rows('ec_abandoned_carts')[0]).toMatchObject({ subtotal: 7, customer_email: 'ana@example.com' });
    expect(String(c1.recovery_token)).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('reviews', () => {
  it('verifies a purchase the caller can see, and recounts the rating on moderation', async () => {
    const { host, rows, seed } = fakeHost();
    const p = await seed('ec_products', { name: 'Mug', price: 10, stock_qty: 5 });
    const o = (await a.checkout({ ...buyer, lines: [{ product_id: p.id, quantity: 1 }] }, host)) as Row;
    const r1 = (await a.submitReview({ product_id: p.id, customer_name: 'Ana', customer_email: 'ANA@example.com', rating: 5, order_id: o.id }, host)) as Row;
    const r2 = (await a.submitReview({ product_id: p.id, customer_name: 'Bo', customer_email: 'bo@example.com', rating: 2, order_id: o.id }, host)) as Row;
    expect([r1.is_verified_purchase, r2.is_verified_purchase, r2.order_id]).toEqual([true, false, null]);
    await a.moderateReview({ id: r1.id, status: 'approved' }, host);
    await a.moderateReview({ id: r2.id, status: 'approved' }, host);
    expect([rows('ec_products')[0].avg_rating, rows('ec_products')[0].review_count]).toEqual([3.5, 2]);
    await a.moderateReview({ id: r1.id, status: 'rejected' }, host);
    expect([rows('ec_products')[0].avg_rating, rows('ec_products')[0].review_count]).toEqual([2, 1]);
  });

  it('writes an unverified review for a caller who cannot read orders', async () => {
    const { host, seed } = fakeHost(['ec_orders']);
    const p = await seed('ec_products', { name: 'Mug' });
    const r = (await a.submitReview({ product_id: p.id, customer_name: 'Ana', customer_email: 'ana@example.com', rating: 4, order_id: 'x' }, host)) as Row;
    expect(r.is_verified_purchase).toBe(false);
    await refusal(a.submitReview({ product_id: 'nope', customer_name: 'Ana', customer_email: 'a@b.c', rating: 4 }, host), 'product_not_found');
  });
});
