import { type Context, Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { FETCHES, RUNS } from './migrators.js';

// The import: a fetch's rows into a collection, every row through the data API
// as the caller (`ctx.internals.createRecord`), as data/import does (owner
// decision 2026-11-03, B1). A row lands only where the caller may create one,
// with the target's validation, column rules, hooks and webhooks. Nothing here
// decides who may import what.

type Row = Record<string, unknown>;

/**
 * Thrown, not returned: the engine's tenant middleware rolls the request's
 * transaction back on a handler error and still sends this response, so no row
 * of a refused import is kept.
 */
function refuse(status: number, body: Row, c: Context): never {
  throw new HTTPException(status as 400, { res: c.json(body, status as 400) });
}

const isPlainObject = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v);

export function migratorRoutes(ctx: ExtensionContext): Hono {
  const { internals } = ctx;
  const app = new Hono();

  /**
   * POST /fetches/:id/import `{ target_collection, mapping? }` — all or nothing.
   * `mapping` is `{ "<source field>": "<target field>" }`; without it each
   * source field goes to the field the fetch inferred for it (`columns`). A
   * source field mapped to "" or left out is skipped. A row the data API refuses
   * with 422 is reported and the rest are still checked (up to 100); any other
   * refusal stops there. Either way nothing is kept.
   */
  app.post('/fetches/:id/import', async (c) => {
    const body = (await c.req.json().catch(() => null)) as Row | null;
    const target = typeof body?.target_collection === 'string' ? body.target_collection.replace(/^zvd_/, '') : '';
    if (!/^[a-z_][a-z0-9_]*$/.test(target)) return c.json({ error: 'target_collection must be a collection name' }, 400);
    if (body?.mapping !== undefined && !isPlainObject(body.mapping)) {
      return c.json({ error: 'mapping must be an object of source field to target field' }, 400);
    }

    const found = await internals.readRecord(c, FETCHES, c.req.param('id'));
    if (found.status !== 200) return c.json(found.body as Row, found.status as 404);
    const f = found.body as Row;
    if (f.status !== 'ready') return c.json({ error: `The fetch is ${String(f.status)}, not ready` }, 409);

    const columns = (f.columns as { source_field: string; column: string }[] | null) ?? [];
    const known = new Set(columns.map((col) => col.source_field));
    const unknown = Object.keys((body?.mapping as Row | undefined) ?? {}).filter((s) => !known.has(s));
    if (unknown.length) return c.json({ error: `mapping names fields the fetch does not have: ${unknown.join(', ')}` }, 400);

    // Once per fetch: a repeated request (a retry, a second click) would import every row again.
    // ponytail: two requests at the same instant both pass; a lock needs a fetch write the route may not make (writtenBy).
    const done = await internals.listRecords(c, RUNS, { limit: 1, count: 'none', filter: { fetch_id: { eq: f.id } } });
    if (done.status !== 200) return c.json(done.body as Row, done.status as 403);
    if (((done.body as { records?: Row[] }).records ?? []).length) {
      return c.json({ error: 'This fetch is already imported' }, 409);
    }
    const mapping: Record<string, string> = body?.mapping
      ? Object.fromEntries(Object.entries(body.mapping).filter(([, t]) => typeof t === 'string' && t))
      : Object.fromEntries(columns.map((col) => [col.source_field, col.column]));
    const targets = Object.values(mapping);
    if (new Set(targets).size !== targets.length) return c.json({ error: 'mapping names a target field twice' }, 400);
    const skipped = columns.map((col) => col.source_field).filter((s) => !Object.hasOwn(mapping, s));

    const ids: string[] = [];
    const errors: { row: number; status: number; error: unknown }[] = [];
    for (const [i, raw] of ((f.rows as Row[] | null) ?? []).entries()) {
      const row: Row = {};
      for (const [from, to] of Object.entries(mapping)) {
        if (raw[from] !== undefined && raw[from] !== null) row[to] = raw[from];
      }
      if (Object.keys(row).length === 0) continue;
      const answer = await internals.createRecord(c, target, row);
      if (answer.status >= 200 && answer.status < 300) {
        ids.push(String((answer.body as Row).id));
        continue;
      }
      errors.push({ row: i + 1, status: answer.status, error: answer.body });
      if (answer.status !== 422) refuse(answer.status, { error: 'Import refused', errors }, c);
      if (errors.length >= 100) break;
    }
    if (errors.length) refuse(422, { error: 'Import has invalid rows; nothing was imported', errors }, c);

    const run = await internals.createRecord(c, RUNS, {
      fetch_id: f.id,
      source: f.source,
      source_object: f.object,
      target_collection: target,
      imported_rows: ids.length,
      skipped_fields: skipped,
      record_ids: ids,
    });
    if (run.status !== 201) refuse(run.status, { error: 'Could not record the import', detail: run.body }, c);
    return c.json({ run: run.body, imported_rows: ids.length, skipped_fields: skipped }, 201);
  });

  return app;
}
