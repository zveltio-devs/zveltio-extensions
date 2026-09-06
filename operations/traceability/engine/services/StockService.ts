import { sql } from 'kysely';

/**
 * Takes `quantity` off a lot, atomically, or explains why it could not.
 *
 * ONE statement decides everything: whether the lot exists, whether it is
 * available, whether there is enough, and the new remainder. The row is locked
 * by the UPDATE itself, and under READ COMMITTED a concurrent writer that blocks
 * on that lock re-evaluates the WHERE clause against the committed row — so the
 * second caller's `quantity_remaining >= quantity` is checked against what the
 * first one left, not against what it read.
 *
 * ## Why this is a shared function and not three
 *
 * The same read-then-write existed in THREE places: `consumeFromLot` below,
 * `POST /dispatches/:id/confirm`, and `POST /dispatches` — each doing
 * `SELECT quantity_remaining` → compare in JavaScript → `UPDATE … SET
 * quantity_remaining = <computed>`. Being inside `db.transaction()` did not help
 * the two dispatch routes: their UPDATE matched on `id` alone, so a blocked
 * writer re-evaluated a condition that was still true and wrote a number
 * computed before the other write landed.
 *
 * Measured on Postgres 18 before the change — a lot holding 10 kg, two
 * concurrent takes of 6 kg:
 *
 *     both ACCEPTED, both wrote quantity_remaining = 4
 *     movements: 2, totalling -12 kg from a lot that held 10
 *
 * In a traceability register that is not bookkeeping. `quantity_remaining` is
 * what a recall reads to decide how much of a lot is still on site, and the
 * movement rows are the audit trail an inspection asks for.
 *
 * ## And all three overwrote a recall
 *
 * Each wrote `status = newQty === 0 ? 'exhausted' : 'available'` from a status it
 * had read earlier, so a recall committed in between was silently undone:
 *
 *     operator reads status = available, 10 kg -> proceeds
 *     RECALL marks the lot 'recalled'
 *     operator writes quantity_remaining = 7, status = 'available'
 *
 * On the dispatch routes that is worse than on the scanner: the lot is not only
 * back on the floor, it has been sent to a customer.
 *
 * `status` here moves to `exhausted` only when the remainder reaches zero and is
 * otherwise left exactly as it is, so nothing in this path can undo a recall.
 */
export async function claimLotQuantity(
  // biome-ignore lint/suspicious/noExplicitAny: ctx.db is the engine's proxy type
  db: any,
  lotId: string,
  quantity: number,
): Promise<{ unit: string; quantity_remaining: string }> {
  const claimed = await sql<{ unit: string; quantity_remaining: string }>`
    UPDATE trace_lots
       SET quantity_remaining = quantity_remaining - ${quantity},
           status = CASE
                      WHEN quantity_remaining - ${quantity} <= 0 THEN 'exhausted'
                      ELSE status
                    END
     WHERE id = ${lotId}
       AND status = 'available'
       AND quantity_remaining >= ${quantity}
     RETURNING unit, quantity_remaining
  `.execute(db);

  if (claimed.rows.length) return claimed.rows[0]!;

  // Nothing was taken. Say which of the three reasons, because the person
  // reading it is standing at a scanner with a pallet in front of them.
  const lotResult = await sql<{ quantity_remaining: string; unit: string; status: string }>`
    SELECT quantity_remaining, unit, status FROM trace_lots WHERE id = ${lotId}
  `.execute(db);

  const lot = lotResult.rows[0];
  if (!lot) throw new LotUnavailableError('Lot negăsit / Lot not found');
  if (lot.status !== 'available') {
    throw new LotUnavailableError(
      `Lot indisponibil (status: ${lot.status}) / Lot unavailable (status: ${lot.status})`,
    );
  }
  throw new LotUnavailableError(
    `Stoc insuficient. Disponibil: ${lot.quantity_remaining} ${lot.unit} / ` +
      `Insufficient stock. Available: ${lot.quantity_remaining} ${lot.unit}`,
  );
}

/**
 * A refusal a route should answer 400 to, not 500.
 *
 * The distinction matters because the two dispatch routes used to return 400
 * from an explicit `if`, and folding their check into `claimLotQuantity` would
 * otherwise have turned every one of those into a 500 — a legitimate "not enough
 * stock" reported to the operator as a server fault.
 */
export class LotUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LotUnavailableError';
  }
}

export class StockService {
  constructor(private db: any) {}

  /**
   * Takes `quantityUsed` off a lot, and records why.
   *
   * ## What was wrong: a read, a check in JavaScript, and an ABSOLUTE write
   *
   * The old shape was `SELECT quantity_remaining` → compare in JS → `UPDATE …
   * SET quantity_remaining = <computed>`. Nothing held a lock between the read
   * and the write, and the write assigned a number computed from a value that
   * may already be stale.
   *
   * Two operators scanning the same pallet at the same moment is not an edge
   * case here — it is what the floor scanner PWA exists for. Measured on
   * Postgres 18, a lot holding 10 kg and two concurrent consumptions of 6 kg:
   *
   *     operator A: ACCEPTED, wrote quantity_remaining = 4
   *     operator B: ACCEPTED, wrote quantity_remaining = 4
   *     lot now says      : 4.000 kg, status available
   *     movements recorded: 2, totalling -12.000 kg
   *     physically taken  : 12 kg from a lot that held 10
   *
   * In a traceability system that number is not bookkeeping. `quantity_remaining`
   * is what a recall reads to decide how much of a lot is still on site, so an
   * over-draw tells a recall there is stock to quarantine that has already gone
   * into product — and the movement rows, which are the audit trail an inspection
   * asks for, sum to more than the lot ever held.
   *
   * ## And it overwrote a recall
   *
   * The same UPDATE also wrote `status = newQty === 0 ? 'exhausted' : 'available'`
   * — unconditionally. The status check happens against the row READ earlier, so
   * a recall landing in between was simply overwritten. Measured:
   *
   *     operator reads status = available, 10 kg -> proceeds
   *     RECALL marks the lot 'recalled'
   *     operator writes quantity_remaining = 7, status = 'available'
   *     lot ends as: 7.000 kg, status 'available'
   *
   * A recalled lot back on the floor, marked available, because someone scanned
   * it. That is the failure this extension exists to prevent.
   *
   * ## The fix: one conditional UPDATE decides everything
   *
   * The read, the availability check, the sufficiency check and the decrement are
   * a single statement. The row is locked by the UPDATE itself, and under READ
   * COMMITTED a concurrent writer that blocks on that lock re-evaluates the WHERE
   * clause against the committed row — so the second operator's
   * `quantity_remaining >= used` is checked against the value the first one left,
   * not the one it read.
   *
   * `status` is no longer assigned from a stale read. It moves to `exhausted`
   * only when the remainder reaches zero, and is otherwise left exactly as it is,
   * so nothing here can undo a recall.
   *
   * Zero rows back means the lot is gone, not available, or short. Which of the
   * three is a second, read-only query — worth one extra round trip to tell an
   * operator holding a scanner "this lot was recalled" instead of "no".
   */
  async consumeFromLot(params: {
    lotId: string;
    quantityUsed: number;
    productionOrderId: string;
    scannedBy: string;
  }): Promise<void> {
    const { unit } = await claimLotQuantity(this.db, params.lotId, params.quantityUsed);

    await sql`
      INSERT INTO trace_lot_consumptions (production_order_id, lot_id, quantity_used, unit, scanned_by, scanned_at)
      VALUES (${params.productionOrderId}, ${params.lotId}, ${params.quantityUsed}, ${unit}, ${params.scannedBy}, now())
    `.execute(this.db);

    await sql`
      INSERT INTO trace_movements (lot_id, type, quantity, unit, reference_type, reference_id, performed_by, performed_at)
      VALUES (${params.lotId}, 'consumption', ${-params.quantityUsed}, ${unit}, 'production_order', ${params.productionOrderId}, ${params.scannedBy}, now())
    `.execute(this.db);
  }

  async getExpiringLots(daysAhead: number = 7) {
    const rows = await sql`
      SELECT l.id, l.lot_number, l.quantity_remaining, l.unit, l.best_before_date,
             i.name as item_name,
             loc.warehouse, loc.row, loc.shelf
      FROM trace_lots l
      INNER JOIN trace_items i ON i.id = l.item_id
      LEFT JOIN trace_locations loc ON loc.id = l.location_id
      WHERE l.status = 'available'
        AND l.best_before_date <= CURRENT_DATE + ${daysAhead}::int
      ORDER BY l.best_before_date ASC
    `.execute(this.db);
    return rows.rows;
  }

  async getLowStockItems() {
    const rows = await sql`
      SELECT i.id, i.code, i.name, i.default_unit, i.min_stock_alert,
             COALESCE(SUM(l.quantity_remaining), 0) as total_remaining
      FROM trace_items i
      LEFT JOIN trace_lots l ON l.item_id = i.id AND l.status = 'available'
      WHERE i.is_active = true AND i.min_stock_alert IS NOT NULL
      GROUP BY i.id
      HAVING COALESCE(SUM(l.quantity_remaining), 0) <= i.min_stock_alert
      ORDER BY (COALESCE(SUM(l.quantity_remaining), 0) - i.min_stock_alert) ASC
    `.execute(this.db);
    return rows.rows;
  }
}
