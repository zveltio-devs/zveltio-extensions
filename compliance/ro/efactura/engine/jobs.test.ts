// The ANAF jobs as the engine runs them: the PACKED `engine/jobs.js`, in the
// engine's own Deno runner (`runInDeno`, ADR 0022), with no permissions — every
// collection call and every request a message the test answers. The answers
// stand in for the data API and for ANAF; each request is also checked against
// the job's manifest `egress`, which is all the engine would let it reach.
import { beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;
type Row = Record<string, Any>;

const ENGINE = join(import.meta.dir, '../../../../../zveltio/packages/engine/src');
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

/** An in-memory data API and a scripted ANAF, as one job's host. */
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
          if (!route) throw new Error(`no ANAF stub for ${req.method} ${req.url}`);
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
      timezone: 'Europe/Bucharest',
      memoryMb: def.memoryMb ?? 128,
      timeoutSeconds: 30,
      call,
    });
  }
  return { table, put, run, seen };
}

const IDP = 'https://logincert.anaf.ro/anaf-oauth2/v1';
const API = 'https://api.anaf.ro/test/FCTEL/rest';
const tokens = (n: string) => () => ({
  type: 'application/json',
  body: JSON.stringify({ access_token: `access-${n}`, refresh_token: `refresh-${n}`, expires_in: 3600 }),
});
const hello: Route = ({ headers }) =>
  headers.get('authorization')?.startsWith('Bearer access-') ? { body: 'hello zveltio' } : { status: 401 };
const later = () => new Date(Date.now() + 3600_000).toISOString();
const settingsRow = (extra: Row = {}) => ({
  scope: 'tenant',
  environment: 'test',
  seller_cif: 'RO18547290',
  client_id: 'cid',
  client_secret: 'csecret',
  callback_url: 'https://erp.example.ro/ext/compliance/ro/efactura/oauth/callback',
  access_token: 'access-0',
  refresh_token: 'refresh-0',
  token_expires_at: later(),
  ...extra,
});

describe('connect', () => {
  it('trades the code for tokens with the stored client and callback, then checks hello', async () => {
    const w = world({ [`POST ${IDP}/token`]: tokens('1'), 'GET https://api.anaf.ro/TestOauth/jaxrs/hello': hello });
    const s = w.put('efactura_settings', settingsRow({ access_token: null, refresh_token: null, last_error: 'old' }));
    await w.run('connect', { settings_id: s.id, code: 'the-code' });
    const form = new URLSearchParams(w.seen[0]!.body);
    expect(Object.fromEntries(form)).toMatchObject({
      grant_type: 'authorization_code',
      code: 'the-code',
      client_id: 'cid',
      client_secret: 'csecret',
      redirect_uri: s.callback_url,
    });
    const after = w.table('efactura_settings').get(s.id)!;
    expect(after.access_token).toBe('access-1');
    expect(after.refresh_token).toBe('refresh-1');
    expect(Date.parse(after.token_expires_at)).toBeGreaterThan(Date.now());
    expect(after.last_verified_at).toBeTruthy();
    expect(after.last_error).toBeNull();
  }, 30_000);

  it('records a refused token request and ends without a retry', async () => {
    const w = world({ [`POST ${IDP}/token`]: () => ({ status: 400, body: 'invalid_grant' }) });
    const s = w.put('efactura_settings', settingsRow({ access_token: null }));
    await w.run('connect', { settings_id: s.id, code: 'stale' });
    expect(w.table('efactura_settings').get(s.id)!.last_error).toContain('invalid_grant');
  }, 30_000);
});

describe('submit', () => {
  function filed(w: ReturnType<typeof world>, extra: Row = {}) {
    const inv = w.put('efactura_invoices', { status: 'submitting', seller_cui: '18547290', ...extra });
    w.put('efactura_files', { invoice_id: inv.id, xml: '<Invoice>x</Invoice>' });
    return inv;
  }

  it('uploads the stored XML for the filing CIF, refreshing an expiring token first', async () => {
    const w = world({
      [`POST ${IDP}/token`]: tokens('2'),
      [`POST ${API}/upload`]: ({ url, headers, body }) => {
        expect(url.searchParams.get('cif')).toBe('18547290');
        expect(url.searchParams.get('standard')).toBe('UBL');
        expect(headers.get('authorization')).toBe('Bearer access-2');
        expect(body).toBe('<Invoice>x</Invoice>');
        return { body: '<header ExecutionStatus="0" index_incarcare="5001234"/>' };
      },
    });
    w.put('efactura_settings', settingsRow({ token_expires_at: new Date(Date.now() + 60_000).toISOString() }));
    const inv = filed(w);
    await w.run('submit', { id: inv.id });
    const after = w.table('efactura_invoices').get(inv.id)!;
    expect(after).toMatchObject({ status: 'submitted', anaf_index: '5001234' });
    expect(new URLSearchParams(w.seen[0]!.body).get('grant_type')).toBe('refresh_token');
  }, 30_000);

  it('a refused upload goes back to xml_generated with ANAF answer', async () => {
    const w = world({ [`POST ${API}/upload`]: () => ({ status: 400, body: 'Fisierul nu respecta' }) });
    w.put('efactura_settings', settingsRow());
    const inv = filed(w);
    await w.run('submit', { id: inv.id });
    const after = w.table('efactura_invoices').get(inv.id)!;
    expect(after.status).toBe('xml_generated');
    expect(after.anaf_response).toContain('Fisierul nu respecta');
  }, 30_000);

  it('a lost answer leaves it submitting: whether ANAF has it is unknown', async () => {
    const w = world({
      [`POST ${API}/upload`]: () => {
        throw new Error('connection reset');
      },
    });
    w.put('efactura_settings', settingsRow());
    const inv = filed(w);
    await w.run('submit', { id: inv.id });
    const after = w.table('efactura_invoices').get(inv.id)!;
    expect(after.status).toBe('submitting');
    expect(after.anaf_response).toContain('Upload outcome unknown');
  }, 30_000);

  it('without a connection row the invoice is handed back, nothing sent', async () => {
    const w = world({});
    const inv = filed(w);
    await w.run('submit', { id: inv.id });
    expect(w.table('efactura_invoices').get(inv.id)!.status).toBe('xml_generated');
    expect(w.seen).toHaveLength(0);
  }, 30_000);

  it('a 2xx without an upload index stays submitting: not a sure refusal', async () => {
    const w = world({ [`POST ${API}/upload`]: () => ({ body: '<header ExecutionStatus="0"/>' }) });
    w.put('efactura_settings', settingsRow());
    const inv = filed(w);
    await w.run('submit', { id: inv.id });
    expect(w.table('efactura_invoices').get(inv.id)!).toMatchObject({ status: 'submitting' });
  }, 30_000);

  it('an invoice no longer submitting is not sent', async () => {
    const w = world({});
    w.put('efactura_settings', settingsRow());
    const inv = filed(w, { status: 'submitted' });
    await w.run('submit', { id: inv.id });
    expect(w.seen).toHaveLength(0);
  }, 30_000);
});

describe('checkStatus', () => {
  it('ok accepts the invoice and keeps the signed archive', async () => {
    const zip = new Uint8Array([0x50, 0x4b, 3, 4, 0, 255]);
    const w = world({
      [`GET ${API}/stareMesaj`]: ({ url }) => {
        expect(url.searchParams.get('id_incarcare')).toBe('77');
        return { body: '<header stare="ok" id_descarcare="9001"/>' };
      },
      [`GET ${API}/descarcare`]: ({ url }) => {
        expect(url.searchParams.get('id')).toBe('9001');
        return { type: 'application/zip', body: zip };
      },
    });
    w.put('efactura_settings', settingsRow());
    const inv = w.put('efactura_invoices', { status: 'submitted', anaf_index: '77' });
    const file = w.put('efactura_files', { invoice_id: inv.id, xml: '<x/>' });
    await w.run('checkStatus', { id: inv.id });
    expect(w.table('efactura_invoices').get(inv.id)).toMatchObject({
      status: 'accepted',
      anaf_state: 'ok',
      anaf_download_id: '9001',
    });
    expect(Buffer.from(w.table('efactura_files').get(file.id)!.archive, 'base64')).toEqual(Buffer.from(zip));
  }, 30_000);

  it('in processing changes only the recorded state', async () => {
    const w = world({ [`GET ${API}/stareMesaj`]: () => ({ body: '<header stare="in prelucrare"/>' }) });
    w.put('efactura_settings', settingsRow());
    const inv = w.put('efactura_invoices', { status: 'submitted', anaf_index: '78' });
    await w.run('checkStatus', { id: inv.id });
    expect(w.table('efactura_invoices').get(inv.id)).toMatchObject({ status: 'submitted', anaf_state: 'in prelucrare' });
  }, 30_000);
});

describe('syncMessages and renderPdf', () => {
  it('adds the messages not yet listed', async () => {
    const w = world({
      [`GET ${API}/listaMesajeFactura`]: ({ url }) => {
        expect(url.searchParams.get('zile')).toBe('10');
        expect(url.searchParams.get('cif')).toBe('18547290');
        return {
          type: 'application/json',
          body: JSON.stringify({
            mesaje: [
              { id: '1', tip: 'FACTURA TRIMISA', data_creare: '202611061200', id_solicitare: '77' },
              { id: '2', tip: 'FACTURA PRIMITA', data_creare: '202611061300', detalii: 'from supplier' },
            ],
          }),
        };
      },
    });
    w.put('efactura_settings', settingsRow());
    w.put('efactura_messages', { anaf_id: '1', tip: 'FACTURA TRIMISA' });
    await w.run('syncMessages', { days: 10 });
    const rows = [...w.table('efactura_messages').values()];
    expect(rows.map((r) => r.anaf_id).sort()).toEqual(['1', '2']);
    expect(rows.find((r) => r.anaf_id === '2')!.detalii).toBe('from supplier');
  }, 30_000);

  it('"no messages" is an empty list, not a failure', async () => {
    const w = world({
      [`GET ${API}/listaMesajeFactura`]: () => ({
        type: 'application/json',
        body: JSON.stringify({ eroare: 'Nu exista mesaje in ultimele 10 zile' }),
      }),
    });
    w.put('efactura_settings', settingsRow());
    await w.run('syncMessages', { days: 10 });
    expect(w.table('efactura_messages').size).toBe(0);
  }, 30_000);

  it("keeps ANAF's PDF of the stored XML", async () => {
    const pdf = new TextEncoder().encode('%PDF-1.4 fake');
    const w = world({
      'POST https://webservicesp.anaf.ro/prod/FCTEL/rest/transformare/FACT1': ({ body }) => {
        expect(body).toBe('<Invoice>y</Invoice>');
        return { type: 'application/pdf', body: pdf };
      },
    });
    const inv = w.put('efactura_invoices', { status: 'xml_generated' });
    const file = w.put('efactura_files', { invoice_id: inv.id, xml: '<Invoice>y</Invoice>' });
    await w.run('renderPdf', { id: inv.id });
    expect(Buffer.from(w.table('efactura_files').get(file.id)!.pdf, 'base64').toString()).toBe('%PDF-1.4 fake');
  }, 30_000);
});
