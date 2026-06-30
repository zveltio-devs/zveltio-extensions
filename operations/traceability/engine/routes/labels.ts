import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { LabelService } from '../services/LabelService.js';
import { QRService } from '../services/QRService.js';

// Top-level helper: keeps `db: any` parameter; callers pass reqDb(c).
async function fetchLotDetails(db: any, lotId: string) {
  const row = await sql`
    SELECT l.id, l.lot_number, l.quantity_remaining, l.unit, l.best_before_date,
           i.name as item_name, i.allergens, i.storage_conditions,
           s.name as supplier_name, l.supplier_lot_ref,
           loc.warehouse, loc.row, loc.shelf
    FROM trace_lots l
    INNER JOIN trace_items i ON i.id = l.item_id
    LEFT JOIN trace_suppliers s ON s.id = l.supplier_id
    LEFT JOIN trace_locations loc ON loc.id = l.location_id
    WHERE l.id = ${lotId}
  `.execute(db);
  return row.rows[0] as any;
}

export function labelsRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

  const app = new Hono();

  // GET /labels/:lot_id — single PDF label
  app.get('/:lot_id', async (c) => {
    const lot = await fetchLotDetails(reqDb(c), c.req.param('lot_id'));
    if (!lot) return c.json({ error: 'Lot negăsit / Lot not found' }, 404);

    const pdf = await LabelService.generateLabel(lot);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="eticheta-${lot.lot_number}.pdf"`,
      },
    });
  });

  // POST /labels/batch — multiple PDF labels in one file
  app.post('/batch', zValidator('json', z.object({ lot_ids: z.array(z.string().uuid()).min(1).max(50) })), async (c) => {
    const { lot_ids } = c.req.valid('json');

    const lots = await Promise.all(lot_ids.map(id => fetchLotDetails(reqDb(c), id)));
    const validLots = lots.filter(Boolean);

    if (!validLots.length) return c.json({ error: 'Niciun lot valid / No valid lots' }, 404);

    const pdf = await LabelService.generateBatchLabels(validLots);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="etichete-batch.pdf"',
      },
    });
  });

  // GET /labels/:lot_id/qr-png — QR PNG for preview
  app.get('/:lot_id/qr-png', async (c) => {
    const exists = await sql`SELECT id FROM trace_lots WHERE id = ${c.req.param('lot_id')}`.execute(reqDb(c));
    if (!exists.rows.length) return c.json({ error: 'Lot negăsit / Lot not found' }, 404);

    const buffer = await QRService.generateQRBuffer(c.req.param('lot_id'));
    return new Response(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'image/png' },
    });
  });

  // GET /labels/:lot_id/qr-dataurl — QR as base64 data URL (for browser preview)
  app.get('/:lot_id/qr-dataurl', async (c) => {
    const exists = await sql`SELECT id FROM trace_lots WHERE id = ${c.req.param('lot_id')}`.execute(reqDb(c));
    if (!exists.rows.length) return c.json({ error: 'Lot negăsit / Lot not found' }, 404);

    const dataUrl = await QRService.generateQRDataURL(c.req.param('lot_id'));
    return c.json({ data: dataUrl });
  });

  return app;
}
