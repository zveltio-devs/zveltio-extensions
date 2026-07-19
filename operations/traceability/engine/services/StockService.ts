import { sql } from 'kysely';

export class StockService {
  constructor(private db: any) {}

  async consumeFromLot(params: {
    lotId: string;
    quantityUsed: number;
    productionOrderId: string;
    scannedBy: string;
  }): Promise<void> {
    const lotResult = await sql`
      SELECT id, quantity_remaining, unit, status
      FROM trace_lots
      WHERE id = ${params.lotId}
    `.execute(this.db);

    if (!lotResult.rows.length) {
      throw new Error('Lot negăsit / Lot not found');
    }

    const lot = lotResult.rows[0] as any;

    if (lot.status !== 'available') {
      throw new Error(`Lot indisponibil (status: ${lot.status}) / Lot unavailable (status: ${lot.status})`);
    }

    const remaining = parseFloat(lot.quantity_remaining);
    if (remaining < params.quantityUsed) {
      throw new Error(
        `Stoc insuficient. Disponibil: ${remaining} ${lot.unit} / Insufficient stock. Available: ${remaining} ${lot.unit}`
      );
    }

    const newQty = remaining - params.quantityUsed;

    await sql`
      UPDATE trace_lots
      SET quantity_remaining = ${newQty},
          status = ${newQty === 0 ? 'exhausted' : 'available'}
      WHERE id = ${params.lotId}
    `.execute(this.db);

    await sql`
      INSERT INTO trace_lot_consumptions (production_order_id, lot_id, quantity_used, unit, scanned_by, scanned_at)
      VALUES (${params.productionOrderId}, ${params.lotId}, ${params.quantityUsed}, ${lot.unit}, ${params.scannedBy}, now())
    `.execute(this.db);

    await sql`
      INSERT INTO trace_movements (lot_id, type, quantity, unit, reference_type, reference_id, performed_by, performed_at)
      VALUES (${params.lotId}, 'consumption', ${-params.quantityUsed}, ${lot.unit}, 'production_order', ${params.productionOrderId}, ${params.scannedBy}, now())
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
