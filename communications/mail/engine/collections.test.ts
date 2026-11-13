// The declared collections (ADR 0012), through the engine's own load path: they
// apply on a fresh instance, owned by this extension, with a foreign key per
// relation, and nothing is owed afterwards — a boot or a firm's activation runs
// the same plan and refuses while it has steps, so a file the engine reads back
// differently (a relation key it fills in, say) would lock the extension out.
import { afterAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');
const EXT_DIR = join(import.meta.dir, '..');
const manifest = JSON.parse(readFileSync(join(EXT_DIR, 'manifest.json'), 'utf8'));
const NAME: string = manifest.name;
const COLLECTIONS: string[] = manifest.collections;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d(`${NAME}: declared collections`, () => {
  let db: any;
  let sql: any;

  afterAll(async () => {
    if (!db) return;
    const { dropTestCollection } = await import(join(ENGINE, 'testing/app-harness.js'));
    await sql`DELETE FROM zvd_relations WHERE source_collection IN (${sql.join(COLLECTIONS)})`.execute(db);
    await sql`DELETE FROM zv_validation_rules WHERE collection IN (${sql.join(COLLECTIONS)})`.execute(db);
    for (const c of [...COLLECTIONS].reverse()) await dropTestCollection(db, c);
  });

  it('apply, are owned, and leave nothing owed', async () => {
    // By path, like testing/ext-harness.ts: a bare 'kysely' resolves to the tsconfig's .d.ts.
    ({ sql } = await import(join(ENGINE, '../node_modules/kysely/dist/index.js')));
    const { getTestApp } = await import(join(ENGINE, 'testing/app-harness.js'));
    const { applyDeclaredCollections, readDeclaredCollections } = await import(
      join(ENGINE, 'lib/extensions/declared-collections.js')
    );
    ({ db } = await getTestApp());
    const files = await readDeclaredCollections(NAME, EXT_DIR, COLLECTIONS, manifest.integrity?.schemaSha256);
    // An install of 2.1.0 first: `body_html` a textarea, draft `attachments` json,
    // no `thread_id`. 2.2.0 retypes both within their columns (ADR 0042 slice 5).
    const before = Object.fromEntries(
      Object.entries(files).map(([path, text]) => {
        const c = JSON.parse(text);
        c.fields = c.fields
          .filter((f: { name: string }) => f.name !== 'thread_id')
          .map((f: { name: string; type: string; options?: unknown }) =>
            f.type === 'richtext' ? { ...f, type: 'textarea' } : f.type === 'file' ? { name: f.name, type: 'json' } : f,
          );
        return [path, JSON.stringify(c)];
      }),
    );
    await applyDeclaredCollections(db, NAME, before, true);
    await sql`INSERT INTO zvd_mail_accounts (name, email_address, imap_host, imap_user, smtp_host) VALUES ('a', 'a@x.test', 'h', 'u', 'h')`.execute(db);
    await sql`
      INSERT INTO zvd_mail_drafts (account_id, body_html, attachments)
      SELECT id, '<p>kept</p>', '[{"file_id":"f1","filename":"a.pdf"}]'::jsonb FROM zvd_mail_accounts`.execute(db);
    await applyDeclaredCollections(db, NAME, files, true);
    const kept = await sql`SELECT body_html, attachments FROM zvd_mail_drafts`.execute(db);
    expect(kept.rows).toEqual([{ body_html: '<p>kept</p>', attachments: [{ file_id: 'f1', filename: 'a.pdf' }] }]);
    // `false` is the boot / firm-activation path: it throws while any step is owed.
    await applyDeclaredCollections(db, NAME, files, false);

    const owned = await sql`SELECT name FROM zvd_collections WHERE owner_extension = ${NAME} ORDER BY name`.execute(db);
    expect(owned.rows.map((r: { name: string }) => r.name)).toEqual([...COLLECTIONS].sort());

    const declared = COLLECTIONS.flatMap((c) =>
      (JSON.parse(files[`collections/${c}.json`]).relations ?? []).map(
        (r: { field: string; target: string }) => `zvd_${c}.${r.field} -> zvd_${r.target}`,
      ),
    );
    const fks = await sql`
      SELECT c.conrelid::regclass::text || '.' || a.attname || ' -> ' || c.confrelid::regclass::text AS fk
        FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
       WHERE c.contype = 'f' AND c.confrelid::regclass::text <> '"user"'
         AND c.conrelid::regclass::text IN (${sql.join(COLLECTIONS.map((n) => `zvd_${n}`))})`.execute(db);
    expect(fks.rows.map((r: { fk: string }) => r.fk).sort()).toEqual(declared.sort());

    // A secret is sealed in the database: no request role reads the column.
    const can = async (table: string, col: string) =>
      (await sql`SELECT has_column_privilege('zveltio_rls', ${table}, ${col}, 'SELECT') AS ok`.execute(db)).rows[0].ok;
    for (const c of ['imap_password', 'smtp_password']) expect(await can('zvd_mail_accounts', c)).toBe(false);
    expect(await can('zvd_mail_accounts', 'imap_host')).toBe(true);
  }, 120_000);
});
