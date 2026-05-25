import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { sql } from 'kysely';
import { inventoryRoutes } from './routes.js';

/**
 * Inventory extension — canonical owner of `zvd_products`, `zvd_product_variants`,
 * `zvd_warehouses`, `zvd_stock_levels`, `zvd_stock_movements`.
 *
 * Services:
 *   inventory.products.lookup(id|sku)       → product row | null
 *   inventory.products.list({ active?, q? })→ product[]
 *   inventory.products.findBySku(sku)       → product | null
 *   inventory.stock.level(productId, wh?)   → number (sum across warehouses if wh omitted)
 *   inventory.stock.move({ productId, warehouseId, qty, type, reference })
 *
 * Events:
 *   product.created    { id, product }
 *   product.updated    { id, product }
 *   product.deleted    { id }
 *   stock.moved        { productId, warehouseId, qty, type, reference, balance }
 *   stock.depleted     { productId, warehouseId }   (emitted when level reaches 0)
 */
const extension: ZveltioExtension = {
  name: 'operations/inventory',
  category: 'operations',
  // S3-01: sub-app mounted at /ext/operations/inventory by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', inventoryRoutes(ctx));

    ctx.services.register('inventory.products.lookup', async (idOrSku: string) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSku);
      const r = await sql<any>`
        SELECT * FROM zvd_products
        WHERE ${isUuid ? sql`id = ${idOrSku}::uuid` : sql`sku = ${idOrSku}`}
        LIMIT 1
      `.execute(ctx.db);
      return r.rows[0] ?? null;
    });

    ctx.services.register('inventory.products.findBySku', async (sku: string) => {
      const r = await sql<any>`SELECT * FROM zvd_products WHERE sku = ${sku} LIMIT 1`.execute(ctx.db);
      return r.rows[0] ?? null;
    });

    ctx.services.register('inventory.products.list', async (opts: { active?: boolean; q?: string } = {}) => {
      let q = sql<any>`SELECT * FROM zvd_products WHERE 1=1`;
      if (opts.active !== undefined) q = sql<any>`${q} AND is_active = ${opts.active}`;
      if (opts.q) {
        const like = `%${opts.q}%`;
        q = sql<any>`${q} AND (name ILIKE ${like} OR sku ILIKE ${like})`;
      }
      q = sql<any>`${q} ORDER BY name`;
      const r = await q.execute(ctx.db);
      return r.rows;
    });

    ctx.services.register('inventory.stock.level', async (productId: string, warehouseId?: string) => {
      const r = await sql<any>`
        SELECT COALESCE(SUM(quantity), 0)::int AS qty
        FROM zvd_stock_levels
        WHERE product_id = ${productId}::uuid
          ${warehouseId ? sql`AND warehouse_id = ${warehouseId}::uuid` : sql``}
      `.execute(ctx.db);
      return Number(r.rows[0]?.qty ?? 0);
    });

    ctx.services.register('inventory.stock.move', async (input: {
      productId: string;
      warehouseId: string;
      qty: number;
      type: 'in' | 'out' | 'adjust' | 'transfer';
      reference?: string;
      reason?: string;
    }) => {
      // Insert movement, recompute level. ctx.db restrictions allow zvd_*.
      await sql`
        INSERT INTO zvd_stock_movements (product_id, warehouse_id, quantity, movement_type, reference, reason)
        VALUES (${input.productId}::uuid, ${input.warehouseId}::uuid, ${input.qty},
                ${input.type}, ${input.reference ?? null}, ${input.reason ?? null})
      `.execute(ctx.db);
      const delta = input.type === 'out' ? -Math.abs(input.qty) : Math.abs(input.qty);
      await sql`
        INSERT INTO zvd_stock_levels (product_id, warehouse_id, quantity)
        VALUES (${input.productId}::uuid, ${input.warehouseId}::uuid, ${delta})
        ON CONFLICT (product_id, warehouse_id)
        DO UPDATE SET quantity = zvd_stock_levels.quantity + ${delta}
      `.execute(ctx.db);
      const balanceRow = await sql<any>`
        SELECT quantity FROM zvd_stock_levels WHERE product_id = ${input.productId}::uuid AND warehouse_id = ${input.warehouseId}::uuid
      `.execute(ctx.db);
      const balance = Number(balanceRow.rows[0]?.quantity ?? 0);
      ctx.events.emit('stock.moved', { ...input, balance });
      if (balance <= 0) {
        ctx.events.emit('stock.depleted', { productId: input.productId, warehouseId: input.warehouseId });
      }
      return { balance };
    });
  },
};

export default extension;
