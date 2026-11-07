// The migrator jobs as the engine runs them: the PACKED `engine/jobs.js`, in the
// engine's own Deno runner (`runInDeno`, ADR 0022), with no permissions — every
// collection call and every request a message the test answers. Each request is
// also checked against the job's manifest `egress`.
import { beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;
type Row = Record<string, Any>;

const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');
const manifest = JSON.parse(readFileSync(join(import.meta.dir, '../manifest.json'), 'utf8'));
const code = new Uint8Array(readFileSync(join(import.meta.dir, 'jobs.js')));

let runInDeno: (r: Any) => Promise<void>;
let deno = '';

beforeAll(async () => {
  process.env.ZVELTIO_EXT_TRANSPORT = 'process';
  ({ runInDeno } = await import(join(ENGINE, 'lib/extensions/job-runner.ts')));
  deno = await (await import(join(ENGINE, 'lib/extensions/deno.ts'))).ensureDeno();
}, 120_000);

const b64 = (s: string | Uint8Array) => Buffer.from(s).toString('base64');

interface Answer {
  status?: number;
  body?: string | Uint8Array;
  type?: string;
}
type Route = (req: { url: URL; method: string; headers: Headers; body: string }) => Answer | Promise<Answer>;

/** An in-memory data API and scripted providers, as one job's host. */
function world(routes: Record<string, Route>) {
  const store: Record<string, Map<string, Row>> = {};
  const table = (c: string) => (store[c] ??= new Map());
  const seen: { method: string; url: string; headers: Headers; body: string }[] = [];
  const put = (c: string, row: Row) => {
    const r = { id: crypto.randomUUID(), tenant_id: 't1', ...row };
    table(c).set(r.id, r);
    return r;
  };
  const matches = (r: Row, filter: Row = {}) =>
    Object.entries(filter).every(([k, v]) =>
      v && typeof v === 'object' && Array.isArray(v.in) ? v.in.includes(r[k]) : r[k] === v,
    );
  async function run(job: string, input: unknown) {
    const def = manifest.jobs.find((j: Row) => j.name === job);
    const call = async (name: string, a: Any[]) => {
      switch (name) {
        case 'collections.read':
          return table(a[0]).get(a[1]) ?? null;
        case 'collections.list':
          return { records: [...table(a[0]).values()].filter((r) => matches(r, a[1]?.filter)) };
        case 'collections.insert':
          return put(a[0], a[1]);
        case 'collections.update': {
          const row = table(a[0]).get(a[1]);
          for (const [f, vs] of Object.entries((a[3]?.expect ?? {}) as Record<string, Any[]>)) {
            if (!vs.map(String).includes(String(row?.[f]))) {
              throw Object.assign(new Error('precondition failed'), { status: 409, code: 'precondition_failed' });
            }
          }
          const next = { ...row, ...a[2] };
          table(a[0]).set(a[1], next);
          return next;
        }
        case 'fetch': {
          const req = a[0] as { url: string; method: string; headers: [string, string][]; body: string | null };
          const url = new URL(req.url);
          expect(def.egress).toContain(url.host);
          const headers = new Headers(req.headers);
          const body = req.body ? Buffer.from(req.body, 'base64').toString('utf8') : '';
          seen.push({ method: req.method, url: req.url, headers, body });
          const route = routes[`${req.method} ${url.origin}${url.pathname}`];
          if (!route) throw new Error(`no provider stub for ${req.method} ${req.url}`);
          const ans = await route({ url, method: req.method, headers, body });
          return {
            url: req.url,
            redirected: false,
            status: ans.status ?? 200,
            statusText: '',
            headers: [['content-type', ans.type ?? 'text/plain']],
            body: b64(ans.body ?? ''),
          };
        }
      }
      throw new Error(`unexpected host call ${name}`);
    };
    await runInDeno({
      extName: manifest.name,
      deno,
      code,
      job,
      input,
      timezone: 'UTC',
      memoryMb: def.memoryMb ?? 128,
      timeoutSeconds: 30,
      call,
    });
  }
  return { table, put, run, seen };
}

const json = (body: unknown, status = 200): Answer => ({ status, type: 'application/json', body: JSON.stringify(body) });
const NOTION_QUERY = 'POST https://api.notion.com/v1/databases/db1/query';

describe('fetch', () => {
  it('reads every page with the stored token, flattens the rows and infers their fields', async () => {
    const page = (id: string, title: string, n: number) => ({
      id,
      properties: {
        Name: { type: 'title', title: [{ plain_text: title }] },
        'Deal Size': { type: 'number', number: n },
        Preț: { type: 'formula', formula: { number: n * 2 } },
      },
    });
    const w = world({
      [NOTION_QUERY]: ({ body }) =>
        JSON.parse(body).start_cursor
          ? json({ results: [page('p2', 'Beta', 2)], has_more: false })
          : json({ results: [page('p1', 'Alpha', 1)], has_more: true, next_cursor: 'c2' }),
    });
    const conn = w.put('migrator_connections', { source: 'notion', token: 'secret_x' });
    const f = w.put('migrator_fetches', { connection_id: conn.id, source: 'notion', object: 'db1', row_limit: 10, status: 'pending' });
    await w.run('fetch', { id: f.id });
    expect(w.seen.map((s) => s.headers.get('authorization'))).toEqual(['Bearer secret_x', 'Bearer secret_x']);
    expect(w.table('migrator_fetches').get(f.id)).toMatchObject({
      status: 'ready',
      total_rows: 2,
      rows: [
        { notion_id: 'p1', Name: 'Alpha', 'Deal Size': 1, Preț: '{"number":2}' },
        { notion_id: 'p2', Name: 'Beta', 'Deal Size': 2, Preț: '{"number":4}' },
      ],
      columns: [
        { source_field: 'notion_id', column: 'notion_id', type: 'text' },
        { source_field: 'Name', column: 'name', type: 'text' },
        { source_field: 'Deal Size', column: 'deal_size', type: 'decimal' },
        { source_field: 'Preț', column: 'pret', type: 'text' },
      ],
      error: null,
    });
  });

  it('records a refusal from the source as failed', async () => {
    const w = world({ [NOTION_QUERY]: () => json({ message: 'unauthorized' }, 401) });
    const conn = w.put('migrator_connections', { source: 'notion', token: 'bad' });
    const f = w.put('migrator_fetches', { connection_id: conn.id, source: 'notion', object: 'db1', row_limit: 10, status: 'pending' });
    await w.run('fetch', { id: f.id });
    const row = w.table('migrator_fetches').get(f.id)!;
    expect(row.status).toBe('failed');
    expect(row.error).toContain('api.notion.com responded 401');
  });

  it('leaves a ready fetch alone', async () => {
    const w = world({});
    const conn = w.put('migrator_connections', { source: 'notion', token: 't' });
    const f = w.put('migrator_fetches', { connection_id: conn.id, source: 'notion', object: 'db1', row_limit: 10, status: 'ready' });
    await w.run('fetch', { id: f.id });
    expect(w.seen).toEqual([]);
    expect(w.table('migrator_fetches').get(f.id)!.status).toBe('ready');
  });
});

describe('fetch, again', () => {
  it('a transient error is noted and thrown for the retry, which resumes the claimed fetch', async () => {
    let calls = 0;
    const w = world({
      [NOTION_QUERY]: () => (++calls === 1 ? json({ message: 'busy' }, 503) : json({ results: [], has_more: false })),
    });
    const conn = w.put('migrator_connections', { source: 'notion', token: 't' });
    const f = w.put('migrator_fetches', { connection_id: conn.id, source: 'notion', object: 'db1', row_limit: 10, status: 'pending' });
    await expect(w.run('fetch', { id: f.id })).rejects.toBeDefined();
    expect(w.table('migrator_fetches').get(f.id)).toMatchObject({ status: 'fetching' });
    expect(w.table('migrator_fetches').get(f.id)!.error).toContain('Retrying: api.notion.com responded 503');
    await w.run('fetch', { id: f.id });
    expect(w.table('migrator_fetches').get(f.id)).toMatchObject({ status: 'ready', total_rows: 0, error: null });
  });

  it('asks HubSpot for every property by name, custom ones included', async () => {
    const w = world({
      'GET https://api.hubapi.com/crm/v3/properties/deals': () => json({ results: [{ name: 'dealname' }, { name: 'custom_score' }] }),
      'GET https://api.hubapi.com/crm/v3/objects/deals': ({ url }) => {
        expect(url.searchParams.get('properties')).toBe('dealname,custom_score');
        return json({ results: [{ id: '1', properties: { dealname: 'Big', custom_score: '7', meta: { a: 1 } } }] });
      },
    });
    const conn = w.put('migrator_connections', { source: 'hubspot', token: 'pat' });
    const f = w.put('migrator_fetches', { connection_id: conn.id, source: 'hubspot', object: 'deals', row_limit: 10, status: 'pending' });
    await w.run('fetch', { id: f.id });
    expect(w.table('migrator_fetches').get(f.id)!.rows).toEqual([
      { hubspot_id: '1', dealname: 'Big', custom_score: '7', meta: '{"a":1}' },
    ]);
  });
});

describe('discover', () => {
  it("writes the source's objects onto the connection", async () => {
    const w = world({
      'GET https://api.airtable.com/v0/meta/bases': ({ url }) =>
        url.searchParams.get('offset')
          ? json({ bases: [{ id: 'app2', name: 'Ops' }] })
          : json({ bases: [{ id: 'app1', name: 'CRM' }], offset: 'p2' }),
      'GET https://api.airtable.com/v0/meta/bases/app2/tables': () => json({ tables: [{ id: 'tbl2', name: 'Jobs' }] }),
      'GET https://api.airtable.com/v0/meta/bases/app1/tables': () => json({ tables: [{ id: 'tbl1', name: 'Leads' }] }),
    });
    const conn = w.put('migrator_connections', { source: 'airtable', token: 'pat' });
    await w.run('discover', { id: conn.id });
    expect(w.table('migrator_connections').get(conn.id)).toMatchObject({
      objects: [
        { id: 'app1/tbl1', label: 'CRM → Leads' },
        { id: 'app2/tbl2', label: 'Ops → Jobs' },
      ],
      objects_error: null,
    });
  });

  it('records a refusal as the connection error', async () => {
    const w = world({ 'GET https://api.airtable.com/v0/meta/bases': () => json({}, 403) });
    // A 403 is final: recorded, not thrown.
    const conn = w.put('migrator_connections', { source: 'airtable', token: 'pat' });
    await w.run('discover', { id: conn.id });
    expect(w.table('migrator_connections').get(conn.id)!.objects_error).toContain('responded 403');
  });
});
