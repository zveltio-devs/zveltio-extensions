// Upgrading 1.0.15 → 1.0.16: SCIM's marker table and its trigger on "user" go,
// and every ban they recorded is carried by the engine's `ban_source` (035).
//
// Each leg seeds the 1.0.15 state (003 + 004 UP) in a transaction, runs 005 UP
// and rolls back. The instance's tenancy is what 005 reads from `zv_tenants`; a
// temp table of that name shadows the real one for the leg (pg_temp is searched
// first), so both answers are proven whatever tenants the suite left behind.
import { afterAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool, type PoolClient } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

const sqlOf = (f: string) => readFileSync(join(import.meta.dir, 'migrations', f), 'utf8').split(/^-- DOWN$/m);
const up = (f: string) => sqlOf(f)[0]!;

d('auth/scim — 005 moves SCIM bans onto the engine ban_source', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  afterAll(async () => {
    await pool.end();
  });

  const leg = async (tenants: number) => {
    await mountForTest(import.meta.dir); // 001–005 applied, as on an installed instance
    const c: PoolClient = await pool.connect();
    try {
      await c.query('BEGIN');
      await c.query(up('003_per_tenant_deactivation.sql'));
      await c.query(up('004_block_ends_with_ban.sql'));
      const tenant = (await c.query('SELECT id FROM public.zv_tenants LIMIT 1')).rows[0].id as string;
      await c.query(
        `CREATE TEMP TABLE zv_tenants ON COMMIT DROP AS
           SELECT gen_random_uuid() AS id FROM generate_series(1, $1::int)`,
        [tenants],
      );

      const tag = crypto.randomUUID().slice(0, 8);
      const person = async (name: string, o: { legacy?: boolean; inactive?: boolean; marker?: boolean }) => {
        const id = `${name}-${tag}`;
        await c.query(
          `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", banned)
           VALUES ($1, $1, $1 || '@test.local', true, now(), now(), true)`,
          [id],
        );
        // A ban older than 035 carries no time.
        if (o.legacy) await c.query('UPDATE "user" SET banned_at = NULL WHERE id = $1', [id]);
        await c.query('INSERT INTO zv_scim_users (tenant_id, user_id, active) VALUES ($1, $2, $3)', [
          tenant,
          id,
          !o.inactive,
        ]);
        if (o.marker) await c.query('INSERT INTO zv_scim_sign_in_blocks (user_id) VALUES ($1)', [id]);
        return id;
      };
      const marked = await person('marked', { inactive: true, marker: true });
      const legacyOff = await person('legacy-off', { legacy: true, inactive: true });
      const legacyOn = await person('legacy-on', { legacy: true });
      const recent = await person('recent', { inactive: true });

      await c.query(up('005_engine_ban_source.sql'));

      const src = async (id: string) =>
        (await c.query('SELECT ban_source FROM "user" WHERE id = $1', [id])).rows[0].ban_source as string;
      const out = {
        marked: await src(marked),
        legacyOff: await src(legacyOff),
        legacyOn: await src(legacyOn),
        recent: await src(recent),
        table: (await c.query(`SELECT to_regclass('public.zv_scim_sign_in_blocks') AS t`)).rows[0].t,
        trigger: (await c.query(`SELECT COUNT(*)::int AS n FROM pg_trigger WHERE tgname = 'zv_scim_sign_in_block_ends'`))
          .rows[0].n,
        fn: (await c.query(`SELECT to_regproc('zv_scim_forget_sign_in_block') AS f`)).rows[0].f,
        down: [] as string[],
      };
      // DOWN gives a downgrade back its markers.
      await c.query(sqlOf('005_engine_ban_source.sql')[1]!);
      out.down = (
        await c.query('SELECT user_id FROM zv_scim_sign_in_blocks WHERE user_id = ANY($1) ORDER BY user_id', [
          [marked, legacyOff, legacyOn, recent],
        ])
      ).rows.map((r) => r.user_id as string);
      return { out, ids: { marked, legacyOff } };
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  };

  it('multi-tenant: a marker becomes ext:auth/scim; nothing else is claimed', async () => {
    const { out, ids } = await leg(2);
    expect(out).toEqual({
      marked: 'ext:auth/scim',
      legacyOff: 'unknown',
      legacyOn: 'unknown',
      recent: 'unknown',
      table: null,
      trigger: 0,
      fn: null,
      down: [ids.marked],
    });
  });

  it('single-tenant: also the pre-035 ban of a person the IdP holds inactive', async () => {
    const { out, ids } = await leg(1);
    expect(out).toEqual({
      marked: 'ext:auth/scim',
      legacyOff: 'ext:auth/scim',
      legacyOn: 'unknown', // the IdP holds them active: the ban is not its
      recent: 'unknown', // placed since 035 without a source: an administrator's
      table: null,
      trigger: 0,
      fn: null,
      down: [ids.legacyOff, ids.marked].sort(),
    });
  });
});
