// The declared collections, through the engine's own load path: they
// apply on a fresh instance, owned by this extension, with a foreign key per
// relation, and nothing is owed afterwards — a boot or a firm's activation runs
// the same plan and refuses while it has steps, so a file the engine reads back
// differently (a relation key it fills in, say) would lock the extension out.
import { afterAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ENGINE = join(import.meta.dir, '../../../zveltio/packages/engine/src');
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
    await applyDeclaredCollections(db, NAME, files, true);
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

    // Each declared composite key is a real unique index: tenant_id plus its fields.
    const keyed = COLLECTIONS.filter((c) => JSON.parse(files[`collections/${c}.json`]).indexes?.length);
    const uniques = await sql`
      SELECT DISTINCT indrelid::regclass::text AS t FROM pg_index
       WHERE indisunique AND indnatts = 3
         AND indrelid::regclass::text IN (${sql.join(COLLECTIONS.map((n) => `zvd_${n}`))})`.execute(db);
    expect(uniques.rows.map((r: { t: string }) => r.t).sort()).toEqual(keyed.map((c) => `zvd_${c}`).sort());

    // The tax-id check digit is a rule in the file, applied with the collection.
    const rules = await sql`
      SELECT collection || '.' || field_name || ':' || rule_type AS r FROM zv_validation_rules
       WHERE tenant_id IS NULL AND collection IN (${sql.join(COLLECTIONS)})`.execute(db);
    expect(rules.rows.map((r: { r: string }) => r.r)).toEqual(['organizations.tax_id:custom']);
  }, 120_000);
});
