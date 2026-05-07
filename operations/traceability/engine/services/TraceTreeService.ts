import { sql } from 'kysely';

export interface TreeNode {
  lot_id: string;
  lot_number?: string;
  lot_type?: string;
  status?: string;
  quantity_initial?: number;
  quantity_remaining?: number;
  unit?: string;
  best_before_date?: string;
  supplier_lot_ref?: string;
  reception_date?: string;
  item_name?: string;
  allergens?: unknown[];
  supplier_name?: string;
  inputs?: TreeNode[];
  circular?: boolean;
}

export interface AffectedLot {
  output_lot_id: string;
  order_number: string;
  lot_number: string;
  status: string;
  quantity_remaining: number;
  unit: string;
  item_name: string;
}

export interface AffectedCustomer {
  lot_id: string;
  id: string;
  quantity: number;
  unit: string;
  customer_id?: string;
  reference_number?: string;
  performed_at: string;
}

export interface DownstreamResult {
  origin_lot_id: string;
  affected_lots: AffectedLot[];
  affected_customers: AffectedCustomer[];
  total_lots_affected: number;
  total_customers_affected: number;
}

export class TraceTreeService {
  constructor(private db: any) {}

  async traceUpstream(lotId: string): Promise<TreeNode> {
    const visited = new Set<string>();

    const buildTree = async (id: string): Promise<TreeNode> => {
      if (visited.has(id)) return { lot_id: id, circular: true };
      visited.add(id);

      const lotResult = await sql`
        SELECT l.id, l.lot_number, l.lot_type, l.status,
               l.quantity_initial, l.quantity_remaining, l.unit,
               l.best_before_date, l.supplier_lot_ref, l.reception_date,
               i.name as item_name, i.allergens,
               s.name as supplier_name
        FROM trace_lots l
        INNER JOIN trace_items i ON i.id = l.item_id
        LEFT JOIN trace_suppliers s ON s.id = l.supplier_id
        WHERE l.id = ${id}
      `.execute(this.db);

      if (!lotResult.rows.length) return { lot_id: id };
      const lot = lotResult.rows[0] as any;

      const parentConsumptions = await sql`
        SELECT c.lot_id, c.quantity_used, c.unit
        FROM trace_production_orders po
        INNER JOIN trace_lot_consumptions c ON c.production_order_id = po.id
        WHERE po.output_lot_id = ${id}
      `.execute(this.db);

      const inputs = await Promise.all(
        (parentConsumptions.rows as any[]).map(c => buildTree(c.lot_id))
      );

      return {
        lot_id: lot.id,
        lot_number: lot.lot_number,
        lot_type: lot.lot_type,
        status: lot.status,
        quantity_initial: lot.quantity_initial,
        quantity_remaining: lot.quantity_remaining,
        unit: lot.unit,
        best_before_date: lot.best_before_date,
        supplier_lot_ref: lot.supplier_lot_ref,
        reception_date: lot.reception_date,
        item_name: lot.item_name,
        allergens: lot.allergens,
        supplier_name: lot.supplier_name,
        inputs,
      };
    };

    return buildTree(lotId);
  }

  async traceDownstream(lotId: string): Promise<DownstreamResult> {
    const visited = new Set<string>();
    const affectedLots: AffectedLot[] = [];
    const affectedCustomers: AffectedCustomer[] = [];
    const queue = [lotId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const orders = await sql`
        SELECT po.output_lot_id, po.order_number,
               l.lot_number, l.status, l.quantity_remaining, l.unit,
               i.name as item_name
        FROM trace_lot_consumptions c
        INNER JOIN trace_production_orders po ON po.id = c.production_order_id
        INNER JOIN trace_lots l ON l.id = po.output_lot_id
        INNER JOIN trace_items i ON i.id = l.item_id
        WHERE c.lot_id = ${current}
      `.execute(this.db);

      for (const order of orders.rows as any[]) {
        affectedLots.push(order);
        queue.push(order.output_lot_id);
      }

      const dispatches = await sql`
        SELECT id, quantity, unit, customer_id, reference_number, performed_at
        FROM trace_movements
        WHERE lot_id = ${current} AND type = 'dispatch'
      `.execute(this.db);

      affectedCustomers.push(
        ...(dispatches.rows as any[]).map(d => ({ lot_id: current, ...d }))
      );
    }

    return {
      origin_lot_id: lotId,
      affected_lots: affectedLots,
      affected_customers: affectedCustomers,
      total_lots_affected: affectedLots.length,
      total_customers_affected: new Set(affectedCustomers.map(c => c.customer_id).filter(Boolean)).size,
    };
  }

  async getLotTimeline(lotId: string) {
    const rows = await sql`
      SELECT m.id, m.type, m.quantity, m.unit,
             m.reference_type, m.reference_number,
             m.notes, m.performed_at,
             fl.warehouse as from_warehouse,
             tl.warehouse as to_warehouse
      FROM trace_movements m
      LEFT JOIN trace_locations fl ON fl.id = m.from_location_id
      LEFT JOIN trace_locations tl ON tl.id = m.to_location_id
      WHERE m.lot_id = ${lotId}
      ORDER BY m.performed_at ASC
    `.execute(this.db);
    return rows.rows;
  }
}
