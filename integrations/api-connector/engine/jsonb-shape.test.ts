// Regression, two defects on the same rows:
//  - every jsonb write bound JSON.stringify(x) with no cast or a single
//    ::jsonb; under Bun.SQL — the engine's driver — each landed as a string
//    scalar (meaningful on EXT_HARNESS_DRIVER=bun; CI runs *jsonb-shape* so);
//  - `execute` never sent an endpoint's own default headers: the connection's
//    column of the same name overwrote it in the row (fails on either driver).
import { beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { sql } from 'kysely';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

const send = (app: any, method: string, path: string, body: unknown) =>
  app.request(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

async function typeOf(db: any, table: string, col: string, id: string): Promise<string> {
  const r = await sql<{ t: string }>`
    SELECT jsonb_typeof(${sql.ref(col)}) AS t FROM ${sql.table(table)} WHERE id = ${id}
  `.execute(db);
  return r.rows[0]!.t;
}

d('api-connector stores JSON as JSON and sends endpoint headers', () => {
  let app: any;
  let ctx: any;
  const sent: { url: string; headers: Record<string, string> }[] = [];

  beforeAll(async () => {
    const mounted = await mountForTest(import.meta.dir);
    ctx = mounted.ctx;
    // Same extension, mounted again with an outbound stub: `execute` calls a
    // real URL through ctx.internals.safeFetch, destructured at register time.
    const mod = await import(join(import.meta.dir, 'index.js'));
    app = new mounted.app.constructor();
    await mod.default.register(app, {
      ...ctx,
      internals: {
        ...ctx.internals,
        assertPublicUrl: async () => undefined,
        safeFetch: async (url: string, init: RequestInit) => {
          sent.push({ url, headers: init.headers as Record<string, string> });
          return new Response('<html>not json</html>', { status: 200 });
        },
      },
    });
  });

  it('connection, endpoint and execute log', async () => {
    const conn = await send(app, 'POST', '/connections', {
      name: `shape-${Date.now()}`,
      base_url: 'https://api.example.com',
      auth_type: 'none',
      default_headers: { 'X-Conn': 'c' },
    });
    expect(conn.status).toBe(201);
    const connId = (await conn.json()).data.id;
    for (const col of ['auth_config', 'headers', 'default_headers']) {
      expect(await typeOf(ctx.db, 'zvd_api_connections', col, connId)).toBe('object');
    }
    expect((await send(app, 'PATCH', `/connections/${connId}`, { default_headers: { 'X-Conn': 'c2' } })).status).toBe(200);
    expect(await typeOf(ctx.db, 'zvd_api_connections', 'default_headers', connId)).toBe('object');

    const ep = await send(app, 'POST', `/connections/${connId}/endpoints`, {
      name: 'ep',
      method: 'POST',
      path: '/things',
      default_headers: { 'X-Endpoint': 'e' },
      response_mapping: { id: 'data.id' },
    });
    expect(ep.status).toBe(201);
    const epId = (await ep.json()).data.id;
    expect(await typeOf(ctx.db, 'zvd_api_endpoints', 'default_headers', epId)).toBe('object');
    expect(await typeOf(ctx.db, 'zvd_api_endpoints', 'response_mapping', epId)).toBe('object');

    const run = await send(app, 'POST', `/endpoints/${epId}/execute`, { body: { a: 1 } });
    expect(run.status).toBeLessThan(500);
    expect(sent.at(-1)!.headers['X-Endpoint']).toBe('e');
    expect(sent.at(-1)!.headers['X-Conn']).toBe('c2');
    const log = await sql<{ req: string; res: string; body: unknown }>`
      SELECT jsonb_typeof(request_body) AS req, jsonb_typeof(response_body) AS res, response_body AS body
        FROM zvd_api_logs WHERE endpoint_id = ${epId}
    `.execute(ctx.db);
    expect(log.rows[0]).toMatchObject({ req: 'object', res: 'string', body: '<html>not json</html>' });
  });
});
