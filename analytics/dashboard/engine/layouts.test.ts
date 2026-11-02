// Layouts live in the declared collection `dashboard_layouts` (2.0.0): a saved
// personal layout comes back on the next read, a reset clears it, and an admin's
// role layout is what a member without one of their own inherits — clamped to
// the member's widgets.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mountForTest } from '../../../testing/ext-harness';

const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');
const EXT_DIR = join(import.meta.dir, '..');
const manifest = JSON.parse(readFileSync(join(EXT_DIR, 'manifest.json'), 'utf8'));

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('analytics/dashboard — layouts in dashboard_layouts', () => {
  let db: any;

  beforeAll(async () => {
    const { getTestApp } = await import(join(ENGINE, 'testing/app-harness.js'));
    const { applyDeclaredCollections, readDeclaredCollections } = await import(
      join(ENGINE, 'lib/extensions/declared-collections.js')
    );
    ({ db } = await getTestApp());
    const files = await readDeclaredCollections(
      manifest.name,
      EXT_DIR,
      manifest.collections,
      manifest.integrity?.schemaSha256,
    );
    await applyDeclaredCollections(db, manifest.name, files, true);
  });

  // Each test starts with no layouts, whatever the one before it left.
  afterEach(async () => {
    const { sql } = await import(join(ENGINE, '../node_modules/kysely/dist/index.js'));
    await sql`DELETE FROM zvd_dashboard_layouts`.execute(db);
  });

  afterAll(async () => {
    if (!db) return;
    const { dropTestCollection } = await import(join(ENGINE, 'testing/app-harness.js'));
    await dropTestCollection(db, 'dashboard_layouts');
  });

  const call = async (opts: Parameters<typeof mountForTest>[1], method: string, path = '/', body?: unknown) => {
    const { app } = await mountForTest(import.meta.dir, opts);
    const res = await app.request(path, {
      method,
      ...(body ? { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } } : {}),
    });
    expect(res.status).toBe(200);
    return (await res.json()) as { widgets: string[]; personalized?: boolean; configured?: boolean };
  };

  it('a saved personal layout comes back, and a reset clears it', async () => {
    const saved = await call({ admin: true }, 'PUT', '/', { widgets: ['trust'] });
    expect(saved.widgets).toEqual(['welcome', 'trust']);

    const read = await call({ admin: true }, 'GET');
    expect(read.personalized).toBe(true);
    expect(read.widgets).toEqual(['welcome', 'trust']);

    const reset = await call({ admin: true }, 'DELETE');
    expect(reset.personalized).toBe(false);
    expect(reset.widgets).toEqual(['welcome', 'health', 'people', 'data', 'activity', 'trust']);
  });

  it("a role layout reaches the role's members, clamped to what they may see", async () => {
    await call({ admin: true }, 'PUT', '/admin/role/god', { widgets: ['health', 'trust'] });
    const role = await call({ admin: true }, 'GET', '/admin/role/god');
    expect(role).toMatchObject({ configured: true, widgets: ['health', 'trust'] });

    // The harness's admin holds the role `god` and has no layout of its own,
    // so it inherits the role layout.
    const admin = await call({ admin: true }, 'GET');
    expect(admin.widgets).toEqual(['welcome', 'health', 'trust']);
  });

  it('a stored layout naming tenant widgets does not show them to a member', async () => {
    const saved = await call({ admin: true }, 'PUT', '/', { widgets: ['health', 'people'] });
    expect(saved.widgets).toEqual(['welcome', 'health', 'people']);
    // Same user id, no `admin`: the stored row names health and people.
    const member = await call({ admin: false }, 'GET');
    expect(member.personalized).toBe(true);
    expect(member.widgets).toEqual(['welcome']);
  });
});
