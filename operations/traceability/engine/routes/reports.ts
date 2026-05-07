import { Hono } from 'hono';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

function toCSV(rows: any[], columns: string[]): string {
  const header = columns.join(',');
  const lines = rows.map(r =>
    columns.map(c => {
      const v = r[c] ?? '';
      return typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n'))
        ? `"${v.replace(/"/g, '""')}"`
        : String(v);
    }).join(',')
  );
  return [header, ...lines].join('\r\n');
}

function acceptsCsv(c: any): boolean {
  return c.req.header('Accept')?.includes('text/csv') || c.req.query('format') === 'csv';
}

export function reportsRouter(ctx: ExtensionContext): Hono {
  const { db } = ctx;
  const app = new Hono();

  // GET /reports/ansvsa-traceability — registru trasabilitate conform Ord. 111/2008
  app.get('/ansvsa-traceability', async (c) => {
    const { from, to } = c.req.query();
    if (!from || !to) return c.json({ error: 'Parametrii from și to sunt obligatorii / from and to parameters required' }, 400);

    const rows = await sql`
      SELECT
        l.lot_number as "Număr lot intern",
        i.code as "Cod produs",
        i.name as "Denumire produs",
        i.type as "Tip",
        l.lot_type as "Tip lot",
        s.name as "Furnizor",
        s.cui as "CUI furnizor",
        l.supplier_lot_ref as "Lot furnizor",
        l.quantity_initial as "Cantitate recepționată",
        l.quantity_remaining as "Cantitate rămasă",
        l.unit as "UM",
        l.reception_date as "Data recepție",
        l.best_before_date as "Data valabilitate",
        l.production_date as "Data producție",
        l.invoice_ref as "Referință factură",
        l.status as "Status",
        loc.warehouse as "Depozit",
        loc.row as "Rând",
        loc.shelf as "Raft"
      FROM trace_lots l
      INNER JOIN trace_items i ON i.id = l.item_id
      LEFT JOIN trace_suppliers s ON s.id = l.supplier_id
      LEFT JOIN trace_locations loc ON loc.id = l.location_id
      WHERE l.reception_date BETWEEN ${from} AND ${to}
        OR l.created_at::date BETWEEN ${from} AND ${to}
      ORDER BY COALESCE(l.reception_date, l.created_at::date), l.lot_number
    `.execute(db);

    if (acceptsCsv(c)) {
      const cols = rows.rows.length > 0 ? Object.keys(rows.rows[0] as object) : [];
      return new Response(toCSV(rows.rows as any[], cols), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="trasabilitate-ansvsa-${from}-${to}.csv"`,
        },
      });
    }
    return c.json({ data: rows.rows, meta: { from, to, count: rows.rows.length } });
  });

  // GET /reports/reception-log — jurnal recepții
  app.get('/reception-log', async (c) => {
    const { from, to } = c.req.query();

    const rows = await sql`
      SELECT
        m.performed_at as "Data/Ora",
        l.lot_number as "Număr lot",
        i.name as "Produs",
        i.code as "Cod",
        m.quantity as "Cantitate",
        m.unit as "UM",
        s.name as "Furnizor",
        l.invoice_ref as "Factură",
        loc.warehouse as "Depozit",
        m.reference_number as "Referință"
      FROM trace_movements m
      INNER JOIN trace_lots l ON l.id = m.lot_id
      INNER JOIN trace_items i ON i.id = l.item_id
      LEFT JOIN trace_suppliers s ON s.id = l.supplier_id
      LEFT JOIN trace_locations loc ON loc.id = m.to_location_id
      WHERE m.type = 'reception'
        AND (${from ? sql`m.performed_at::date >= ${from}` : sql`TRUE`})
        AND (${to ? sql`m.performed_at::date <= ${to}` : sql`TRUE`})
      ORDER BY m.performed_at DESC
    `.execute(db);

    if (acceptsCsv(c)) {
      const cols = rows.rows.length > 0 ? Object.keys(rows.rows[0] as object) : [];
      return new Response(toCSV(rows.rows as any[], cols), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="receptii-${from ?? 'all'}-${to ?? 'all'}.csv"`,
        },
      });
    }
    return c.json({ data: rows.rows });
  });

  // GET /reports/consumption-log — jurnal consumuri
  app.get('/consumption-log', async (c) => {
    const { from, to } = c.req.query();

    const rows = await sql`
      SELECT
        c.scanned_at as "Data/Ora",
        l.lot_number as "Lot consumat",
        i.name as "Materie primă",
        c.quantity_used as "Cantitate",
        c.unit as "UM",
        po.order_number as "Ordin producție",
        ol.lot_number as "Lot finit",
        oi.name as "Produs finit"
      FROM trace_lot_consumptions c
      INNER JOIN trace_lots l ON l.id = c.lot_id
      INNER JOIN trace_items i ON i.id = l.item_id
      INNER JOIN trace_production_orders po ON po.id = c.production_order_id
      LEFT JOIN trace_lots ol ON ol.id = po.output_lot_id
      LEFT JOIN trace_items oi ON oi.id = ol.item_id
      WHERE (${from ? sql`c.scanned_at::date >= ${from}` : sql`TRUE`})
        AND (${to ? sql`c.scanned_at::date <= ${to}` : sql`TRUE`})
      ORDER BY c.scanned_at DESC
    `.execute(db);

    if (acceptsCsv(c)) {
      const cols = rows.rows.length > 0 ? Object.keys(rows.rows[0] as object) : [];
      return new Response(toCSV(rows.rows as any[], cols), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="consumuri-${from ?? 'all'}-${to ?? 'all'}.csv"`,
        },
      });
    }
    return c.json({ data: rows.rows });
  });

  // GET /reports/stock-snapshot — current stock all available lots
  app.get('/stock-snapshot', async (c) => {
    const rows = await sql`
      SELECT
        i.code as "Cod",
        i.name as "Produs",
        i.type as "Tip",
        i.category as "Categorie",
        l.lot_number as "Număr lot",
        l.quantity_remaining as "Cantitate disponibilă",
        l.unit as "UM",
        l.best_before_date as "Valabil până",
        l.reception_date as "Data recepție",
        s.name as "Furnizor",
        loc.warehouse as "Depozit",
        loc.row as "Rând",
        loc.shelf as "Raft"
      FROM trace_lots l
      INNER JOIN trace_items i ON i.id = l.item_id
      LEFT JOIN trace_suppliers s ON s.id = l.supplier_id
      LEFT JOIN trace_locations loc ON loc.id = l.location_id
      WHERE l.status = 'available'
      ORDER BY i.name, l.best_before_date NULLS LAST
    `.execute(db);

    if (acceptsCsv(c)) {
      const cols = rows.rows.length > 0 ? Object.keys(rows.rows[0] as object) : [];
      return new Response(toCSV(rows.rows as any[], cols), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="stoc-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    return c.json({ data: rows.rows, meta: { generated_at: new Date().toISOString(), count: rows.rows.length } });
  });

  // GET /reports/haccp-log — registru CCP pentru control ANSVSA
  app.get('/haccp-log', async (c) => {
    const { from, to } = c.req.query();

    const rows = await sql`
      SELECT
        po.order_number as "Ordin producție",
        po.completed_at as "Data/Ora finalizare",
        l.lot_number as "Lot finit",
        i.name as "Produs",
        po.actual_quantity as "Cantitate produsă",
        po.unit as "UM",
        po.haccp_checks as "Verificări CCP"
      FROM trace_production_orders po
      LEFT JOIN trace_lots l ON l.id = po.output_lot_id
      LEFT JOIN trace_items i ON i.id = l.item_id
      WHERE po.status = 'completed'
        AND (${from ? sql`po.completed_at::date >= ${from}` : sql`TRUE`})
        AND (${to ? sql`po.completed_at::date <= ${to}` : sql`TRUE`})
      ORDER BY po.completed_at DESC
    `.execute(db);

    return c.json({ data: rows.rows });
  });

  return app;
}
