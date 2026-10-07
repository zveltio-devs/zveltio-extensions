// A record page lists one address per published record in the sitemap.
//
// Which column addresses a record is checked against the table's catalog first.
// That read was raw SQL on `information_schema` through `ctx.db`, which engine
// #858 refuses to an extension — and the refusal is not caught there, so the
// whole sitemap answered 500. It is now `ctx.DDLManager.columnNames`.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;
const SFX = String(Date.now()).slice(-7);
const COLL = `smrec_${SFX}`;

describe.skipIf(!DB_URL)('pages: record addresses in the sitemap', () => {
  let pool: any;
  let siteId: string;

  beforeAll(async () => {
    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 1 });
    await pool.query(`CREATE TABLE zvd_${COLL} (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text)`);
    await pool.query(`INSERT INTO zvd_${COLL} (slug) VALUES ('first-record')`);
  });

  afterAll(async () => {
    if (!pool) return;
    if (siteId) await pool.query('DELETE FROM zv_page_sites WHERE id = $1', [siteId]).catch(() => undefined);
    await pool.query(`DROP TABLE IF EXISTS zvd_${COLL}`).catch(() => undefined);
    await pool.end();
  });

  it('lists the published records of a record page', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const site = await pool.query(
      `INSERT INTO zv_page_sites (name, slug, is_active, is_public, public_collections, base_path)
       VALUES ('smrec', $1, true, true, $2, $3) RETURNING id`,
      [`smrec-${SFX}`, [COLL], `/smrec-${SFX}`],
    );
    siteId = site.rows[0].id;
    await pool.query(
      `INSERT INTO zv_pages (title, slug, status, site_id, record_collection, record_field)
       VALUES ('Records', $1, 'published', $2, $3, 'slug')`,
      [`records-${SFX}`, siteId, COLL],
    );

    const res = await app.request('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain(`records-${SFX}/first-record</loc>`);
  });
});
