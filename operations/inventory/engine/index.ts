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
      join(import.meta.dir, 'migrations/003_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/004_movement_cost_and_transfers.sql'),
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


    /**
     * Hold stock for something not yet dispatched.
     *
     * `zvd_stock_levels.reserved_qty` has been in the schema from the start and
     * nothing ever wrote to it — it was displayed and never set, like the CRM
     * contact-organization link. So the gap between "promised to a customer"
     * and "left the warehouse" had nowhere to live, and the only two states
     * were in stock or gone.
     *
     * A reservation does NOT change `quantity`. The goods are still on the
     * shelf and still count for a stock take; they are merely spoken for. What
     * changes is what is available to promise to somebody else, which is
     * quantity minus reservations.
     *
     * Deliberately not enforced here: reserving more than is available is
     * allowed and reported. Backorders are a normal way to run a business, and
     * a warehouse service is the wrong place to decide whether this company
     * permits them.
     */
    ctx.services.register('inventory.stock.reserve', async (input: {
      productId: string;
      warehouseId: string;
      qty: number;
      reference?: string;
    }) => {
      await sql`
        INSERT INTO zvd_stock_levels (product_id, warehouse_id, quantity, reserved_qty)
        VALUES (${input.productId}::uuid, ${input.warehouseId}::uuid, 0, ${Math.abs(input.qty)})
        ON CONFLICT (product_id, warehouse_id)
        DO UPDATE SET reserved_qty = zvd_stock_levels.reserved_qty + ${Math.abs(input.qty)},
                      updated_at = NOW()
      `.execute(ctx.db);
      const r = await sql<any>`
        SELECT quantity, reserved_qty FROM zvd_stock_levels
        WHERE product_id = ${input.productId}::uuid AND warehouse_id = ${input.warehouseId}::uuid
      `.execute(ctx.db);
      const row = r.rows[0] ?? { quantity: 0, reserved_qty: 0 };
      const available = Number(row.quantity) - Number(row.reserved_qty);
      ctx.events.emit('stock.reserved', { ...input, available });
      return { quantity: Number(row.quantity), reserved: Number(row.reserved_qty), available };
    });

    /**
     * Give a reservation back.
     *
     * Called when an order is cancelled, and when it ships — dispatch turns a
     * reservation into an actual movement, so releasing and moving happen
     * together rather than the reservation lingering as a second claim on goods
     * that have already gone.
     *
     * Clamped at zero: releasing more than is held is a bookkeeping mistake
     * somewhere else, and a negative reservation would quietly inflate what the
     * warehouse thinks it can promise.
     */
    ctx.services.register('inventory.stock.release', async (input: {
      productId: string;
      warehouseId: string;
      qty: number;
      reference?: string;
    }) => {
      await sql`
        UPDATE zvd_stock_levels
           SET reserved_qty = GREATEST(reserved_qty - ${Math.abs(input.qty)}, 0), updated_at = NOW()
         WHERE product_id = ${input.productId}::uuid AND warehouse_id = ${input.warehouseId}::uuid
      `.execute(ctx.db);
      const r = await sql<any>`
        SELECT quantity, reserved_qty FROM zvd_stock_levels
        WHERE product_id = ${input.productId}::uuid AND warehouse_id = ${input.warehouseId}::uuid
      `.execute(ctx.db);
      const row = r.rows[0] ?? { quantity: 0, reserved_qty: 0 };
      return {
        quantity: Number(row.quantity),
        reserved: Number(row.reserved_qty),
        available: Number(row.quantity) - Number(row.reserved_qty),
      };
    });

    ctx.services.register('inventory.stock.move', async (input: {
      productId: string;
      warehouseId: string;
      qty: number;
      type: 'in' | 'out' | 'adjust' | 'transfer';
      reference?: string;
      reason?: string;
      /**
       * Who caused this. `created_by` is NOT NULL, and a service called from
       * another extension has no request user of its own — so without this the
       * insert failed the constraint on every cross-extension move, which is
       * the only kind this service exists for.
       */
      userId?: string;
    }) => {
      // Insert movement, recompute level. ctx.db restrictions allow zvd_*.
      // Column names, not concepts: the table has `type` and `note`, and this
      // wrote `movement_type` and `reason`. Every call would have failed —
      // which nothing ever noticed, because nothing ever called it. This is the
      // service other extensions are meant to move stock through, and it was
      // published broken.
      await sql`
        INSERT INTO zvd_stock_movements (product_id, warehouse_id, quantity, type, reference, note, created_by)
        VALUES (${input.productId}::uuid, ${input.warehouseId}::uuid, ${input.qty},
                ${input.type}, ${input.reference ?? null}, ${input.reason ?? null},
                ${input.userId ?? 'system'})
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
