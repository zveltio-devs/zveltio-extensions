// Creating a storefront product with inventory installed also creates the
// canonical inventory product and links the two — inside the request's
// transaction, which is where the engine runs it.
//
// The canonical insert ran inside a SAVEPOINT the extension opened itself.
// `ctx.db` refuses a raw `SAVEPOINT` from an extension (engine #858), the
// surrounding `catch {}` took the refusal for "inventory unavailable", and every
// product was created storefront-only, unlinked, without a word. The insert now
// runs in a nested `transaction()`, whose savepoint is the engine's.
import { afterAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;
const SKU = `canon-${Date.now()}`;
const INVENTORY = join(import.meta.dir, '..', '..', '..', 'operations', 'inventory', 'engine');

describe.skipIf(!DB_URL)('store: a new product is linked to inventory', () => {
  let ctx: any;

  afterAll(async () => {
    if (!ctx) return;
    await ctx.db.deleteFrom('zvd_ec_products').where('sku', '=', SKU).execute();
    await ctx.db.deleteFrom('zvd_products').where('sku', '=', SKU).execute();
  });

  it('creates the canonical product and links the storefront one to it', async () => {
    // Inventory's migrations create `zvd_products`.
    await mountForTest(INVENTORY);
    const mounted = await mountForTest(import.meta.dir, { transaction: true });
    ctx = mounted.ctx;
    // No product with this SKU yet, as inventory's own lookup would answer.
    ctx.services.register('operations/inventory.products.findBySku', async () => null);

    const res = await mounted.app.request('/admin/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Canonical', slug: SKU, sku: SKU, price: 10 }),
    });
    expect(res.status).toBe(201);
    const { data } = (await res.json()) as { data: { canonical_product_id: string | null } };

    const canonical = await ctx.db
      .selectFrom('zvd_products')
      .select('id')
      .where('sku', '=', SKU)
      .executeTakeFirst();
    expect(canonical?.id).toBeDefined();
    expect(data.canonical_product_id).toBe(canonical.id);
  });
});
