// Generating against a REAL engine: the engine's own `/ext/*` chain (session,
// tenant transaction, extension gate) in front of the packed bundle, and
// `ctx.internals` as the engine builds it, with only the PDF renderer stubbed.
// What only the real chain can show: the template is read and the render is
// logged as the caller, and a refused or failed render keeps nothing.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seatHarnessGod } from '../../../testing/ext-harness';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path, and the packed bundle
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const ENGINE = join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src');
const EXT_DIR = join(import.meta.dir, '..');
const manifest = JSON.parse(readFileSync(join(EXT_DIR, 'manifest.json'), 'utf8'));

let db: Any;
let sql: Any;
let app: Any;
let dropCollection: (db: Any, name: string) => Promise<void>;
let member = { cookie: '', userId: '' };
let reader = { cookie: '', userId: '' };
let ids: Record<string, string> = {};
const rendered: string[] = [];

const generate = (id: string, variables: unknown, cookie = member.cookie, extra: object = {}) =>
  app.request(`/ext/content/documents/generate/${id}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ variables_data: variables, ...extra }),
  });
const docs = async () => (await sql`SELECT * FROM zvd_generated_documents ORDER BY document_number`.execute(db)).rows;
const TEMPLATES_DIR = join(EXT_DIR, '..', 'document-templates');
const templatesManifest = JSON.parse(readFileSync(join(TEMPLATES_DIR, 'manifest.json'), 'utf8'));

d('content/documents — a document is numbered and recorded as the caller', () => {
  beforeAll(async () => {
    const harness = (await import(join(ENGINE, 'testing', 'app-harness.js'))) as Any;
    ({ sql } = (await import(join(ENGINE, '..', 'node_modules', 'kysely', 'dist', 'index.js'))) as Any);
    const data = (await import(join(ENGINE, 'lib', 'data', 'index.js'))) as Any;
    const tenancy = (await import(join(ENGINE, 'lib', 'tenancy', 'index.js'))) as Any;
    const { buildExtensionInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'internals.js'))) as Any;
    const { gateInternals } = (await import(join(ENGINE, 'lib', 'extensions', 'capabilities.js'))) as Any;
    const { createRestrictedDb } = (await import(join(ENGINE, 'lib', 'extensions', 'extension-context.js'))) as Any;
    const { applyDeclaredCollections, readDeclaredCollections } = (await import(
      join(ENGINE, 'lib', 'extensions', 'declared-collections.js')
    )) as Any;
    const { getAuth } = (await import(join(ENGINE, 'lib', 'auth.js'))) as Any;
    const { sessionPrefetch } = (await import(join(ENGINE, 'middleware', 'session-prefetch.js'))) as Any;
    const { tenantMiddleware } = (await import(join(ENGINE, 'middleware', 'tenant.js'))) as Any;
    const gate = (await import(join(ENGINE, 'middleware', 'extension-auth-gate.js'))) as Any;
    dropCollection = harness.dropTestCollection;

    let engineApp: Any;
    ({ app: engineApp, db } = await harness.getTestApp());
    for (const [m, dir] of [[templatesManifest, TEMPLATES_DIR], [manifest, EXT_DIR]]) {
      const files = await readDeclaredCollections(m.name, dir, m.collections, m.integrity?.schemaSha256);
      await applyDeclaredCollections(db, m.name, files, true);
    }
    const own = (actions: string[]) => [
      { collection: 'document_templates', actions: ['read'] },
      { collection: 'document_number_sequences', actions: ['read', 'create', 'update'] },
      { collection: 'generated_documents', actions },
    ];
    member = await harness.createMemberSession(engineApp, db, { grants: own(['read', 'create']) });
    // May take a number, may not record a document.
    reader = await harness.createMemberSession(engineApp, db, { grants: own(['read']) });
    const t = await sql`INSERT INTO zvd_document_templates (name, html_body, is_active)
                        VALUES ('Offer', '<h1>{{name}}</h1>', true), ('Old', '<p/>', false)
                        RETURNING id, name`.execute(db);
    ids = Object.fromEntries(t.rows.map((r: Any) => [r.name, r.id]));

    const ctx: Any = {
      db: createRestrictedDb(() => tenancy.getCurrentTenantTrx() ?? db, manifest.name),
      config: {},
      auth: getAuth(),
      internals: Object.assign(gateInternals(manifest.name, buildExtensionInternals(), manifest.permissions ?? []), {
        // No browser in the test: the PDF is the HTML it was handed, or a failure on demand.
        generatePDFAsync: async (html: string) => {
          if (html.includes('FAIL')) throw new Error('renderer down');
          rendered.push(html);
          return Buffer.from(`%PDF ${html}`);
        },
      }),
    };
    const { Hono } = (await import(join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js'))) as Any;
    const mod = await import(join(import.meta.dir, 'index.js'));
    app = new Hono();
    app.use('/ext/*', sessionPrefetch(getAuth(), db));
    app.use('/ext/*', tenantMiddleware);
    app.use('/ext/*', gate.extensionAuthGate(getAuth(), db));
    gate.registerExtensionPublicRoutes(manifest.name, []);
    const sub = new Hono();
    await mod.default.register(sub, ctx);
    app.route('/ext/content/documents', sub);
  }, 60_000);

  afterAll(async () => {
    await seatHarnessGod();
    if (!db) return;
    const all = [...templatesManifest.collections, ...manifest.collections] as string[];
    await sql`DELETE FROM zvd_relations WHERE source_collection IN (${sql.join(all)})`.execute(db);
    for (const c of all.reverse()) await dropCollection(db, c).catch(() => undefined);
  });

  it('numbers each document and records it as the caller, variables escaped', async () => {
    const year = new Date().getFullYear();
    const first = await generate(ids.Offer, { name: 'x' });
    expect(first.status).toBe(200);
    expect(first.headers.get('x-document-number')).toBe(`DOC-${year}-0001`);
    const html = await generate(ids.Offer, {}, member.cookie, { output_format: 'html' });
    expect(html.status).toBe(201);
    expect((await html.json()).document.document_number).toBe(`DOC-${year}-0002`);
    const rows = await docs();
    expect(rows.map((r: Any) => r.created_by)).toEqual([member.userId, member.userId]);
  });

  it('a caller who may not record a document takes no number', async () => {
    expect((await generate(ids.Offer, {}, reader.cookie)).status).toBe(403);
    const [seq] = (await sql`SELECT next_number FROM zvd_document_number_sequences`.execute(db)).rows;
    expect(Number(seq.next_number)).toBe(3);
  });

  it('an inactive template is refused, and a failed PDF keeps no document and no number', async () => {
    expect((await generate(ids.Old, {})).status).toBe(400);
    const before = rendered.length;
    expect((await generate(ids.Offer, { name: 'FAIL' })).status).toBe(502);
    expect(rendered.length).toBe(before);
    expect(await docs()).toHaveLength(2);
    const [seq] = (await sql`SELECT next_number FROM zvd_document_number_sequences`.execute(db)).rows;
    expect(Number(seq.next_number)).toBe(3);
  });
});
