// CRM registers the contacts ↔ organizations relation in the engine's
// relation registry, once, and adopting does not try again.
//
// Migration 005 registers it, as the engine. Adopting the collections also
// inserted it again with raw SQL on `ctx.db`, which engine #858 refuses to an
// extension: a refused write and a warning at every boot.
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!DB_URL)('crm: the contact ↔ organization relation', () => {
  it('is registered by the migration, and adopting does not write it through ctx.db', async () => {
    const pg: any = await import('pg');
    const pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 1 });
    try {
      // A clean slate: mounting applies the migrations again.
      await pool.query(`DELETE FROM zvd_relations WHERE name = 'contact_organizations'`);
      const { ctx } = await mountForTest(import.meta.dir);

      const warned: string[] = [];
      const warn = console.warn;
      console.warn = (...args: unknown[]) => void warned.push(args.map(String).join(' '));
      try {
        const { adoptCrmCollections } = await import('./adopt');
        await adoptCrmCollections(ctx);
      } finally {
        console.warn = warn;
      }
      expect(warned).toEqual([]);

      const rels = (await ctx.DDLManager.getRelations(ctx.db, 'contacts')) as Array<{ name: string }>;
      expect(rels.map((r) => r.name)).toContain('contact_organizations');
    } finally {
      await pool.end();
    }
  });
});
