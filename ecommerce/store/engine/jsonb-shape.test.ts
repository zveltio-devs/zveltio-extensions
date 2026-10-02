// Regression: four writes bound JSON.stringify(x) into a jsonb column with no
// cast (cart items, variant attributes, order addresses) and one into TEXT[]
// (shipping-zone countries/regions). Under Bun.SQL — the engine's driver — the
// jsonb ones stored string scalars. Meaningful on EXT_HARNESS_DRIVER=bun (CI
// runs *jsonb-shape* that way); the TEXT[] case fails on both drivers.
import { beforeAll, describe, expect, it } from 'bun:test';
import { sql } from 'kysely';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

const post = (app: any, path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

async function typeOf(db: any, table: string, col: string, id: string): Promise<string> {
  const r = await sql<{ t: string }>`
    SELECT jsonb_typeof(${sql.ref(col)}) AS t FROM ${sql.table(table)} WHERE id = ${id}
  `.execute(db);
  return r.rows[0]!.t;
}

d('ecommerce/store stores JSON as JSON', () => {
  let app: any;
  let ctx: any;
  let product: any;

  beforeAll(async () => {
    ({ app, ctx } = await mountForTest(new URL('.', import.meta.url).pathname));
    const stamp = Date.now();
    const res = await post(app, '/admin/products', {
      name: 'Shape Product',
      slug: `shape-${stamp}`,
      sku: `SKU-SHAPE-${stamp}`,
      price: 10,
      stock_qty: 5,
      status: 'active',
    });
    expect(res.status).toBe(201);
    product = (await res.json()).data;
  });

  it('variant attributes are an object', async () => {
    const res = await post(app, `/admin/products/${product.id}/variants`, {
      sku: `V-${Date.now()}`,
      name: 'Red',
      attributes: { color: 'red' },
    });
    expect(res.status).toBe(201);
    const id = (await res.json()).data.id;
    expect(await typeOf(ctx.db, 'zvd_ec_product_variants', 'attributes', id)).toBe('object');
  });

  it('abandoned-cart items are an array', async () => {
    const res = await post(app, '/public/carts', {
      session_id: `s-${Date.now()}`,
      items: [{ product_id: product.id, quantity: 1 }],
      subtotal: 10,
    });
    expect(res.status).toBeLessThan(300);
    const id = (await res.json()).data.id;
    expect(await typeOf(ctx.db, 'zvd_ec_abandoned_carts', 'items', id)).toBe('array');
  });

  it('order addresses are objects', async () => {
    const res = await post(app, '/orders', {
      customer_email: 'shape@example.com',
      customer_name: 'Shape',
      billing_address: { city: 'Iasi' },
      shipping_address: { city: 'Cluj' },
      lines: [{ product_id: product.id, quantity: 1 }],
    });
    expect(res.status).toBe(201);
    const id = (await res.json()).data.id;
    expect(await typeOf(ctx.db, 'zvd_ec_orders', 'billing_address', id)).toBe('object');
    expect(await typeOf(ctx.db, 'zvd_ec_orders', 'shipping_address', id)).toBe('object');
  });

  it('a shipping zone keeps its countries and regions', async () => {
    const res = await post(app, '/admin/shipping-zones', {
      name: `Zone ${Date.now()}`,
      countries: ['RO', 'MD'],
      regions: ['IS'],
    });
    expect(res.status).toBe(201);
    const id = (await res.json()).data.id;
    const r = await sql<{ countries: string[]; regions: string[] }>`
      SELECT countries, regions FROM zvd_ec_shipping_zones WHERE id = ${id}
    `.execute(ctx.db);
    expect(r.rows[0]).toEqual({ countries: ['RO', 'MD'], regions: ['IS'] });
  });
});
