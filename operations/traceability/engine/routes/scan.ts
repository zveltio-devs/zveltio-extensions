import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { StockService } from '../services/StockService.js';
import { QRService } from '../services/QRService.js';

const consumeSchema = z.object({
  lot_id: z.string().uuid(),
  quantity_used: z.number().positive(),
  production_order_id: z.string().uuid(),
});

export function scanRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;
  const stockService = new StockService(db);
  const app = new Hono();

  // GET /scan/lot/:id — operator scans QR → returns lot info (must be fast < 100ms)
  app.get('/lot/:id', async (c) => {
    const id = c.req.param('id');

    const row = await sql`
      SELECT l.id, l.lot_number, l.status,
             l.quantity_initial, l.quantity_remaining, l.unit,
             l.best_before_date, l.supplier_lot_ref,
             i.name as item_name, i.type as item_type,
             i.allergens, i.storage_conditions,
             s.name as supplier_name,
             loc.warehouse, loc.row, loc.shelf
      FROM trace_lots l
      INNER JOIN trace_items i ON i.id = l.item_id
      LEFT JOIN trace_suppliers s ON s.id = l.supplier_id
      LEFT JOIN trace_locations loc ON loc.id = l.location_id
      WHERE l.id = ${id}
    `.execute(db);

    if (!row.rows.length) {
      return c.json({ error: 'Lot negăsit / Lot not found' }, 404);
    }

    const lot = row.rows[0] as any;

    if (lot.status !== 'available') {
      return c.json({ error: `Lot indisponibil (status: ${lot.status}) / Lot unavailable (status: ${lot.status})` }, 400);
    }

    return c.json(lot);
  });

  // POST /scan/consume — operator confirms consumption after scan
  app.post('/consume', zValidator('json', consumeSchema), async (c) => {
    const user = c.get('user') as any;
    const { lot_id, quantity_used, production_order_id } = c.req.valid('json');

    await stockService.consumeFromLot({
      lotId: lot_id,
      quantityUsed: quantity_used,
      productionOrderId: production_order_id,
      scannedBy: user.id,
    });

    return c.json({
      success: true,
      message: `${quantity_used} înregistrat cu succes / ${quantity_used} recorded successfully`,
    });
  });

  // POST /scan/parse-gs1 — parse GS1-128 barcode from supplier label
  app.post('/parse-gs1', zValidator('json', z.object({ raw: z.string() })), async (c) => {
    const { raw } = c.req.valid('json');
    const parsed = QRService.parseGS1Barcode(raw);
    return c.json({ data: parsed });
  });

  return app;
}
