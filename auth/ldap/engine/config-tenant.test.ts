// The LDAP directory a request uses is its OWN firm's row.
//
// `zvd_ldap_config` is one row per tenant (migration 004), but the reader was
// `selectFrom('zvd_ldap_config').executeTakeFirst()` — no tenant filter — and
// the save was a read-then-UPDATE with no WHERE. The row policy admits the
// caller's READ REACH, every firm for a god and the descendants for a `subtree`
// member: a god in firm B read firm A's directory, and a save without a new
// password copied A's bind password and wrote over every visible firm's row.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms, mountForTest } from '../../../testing/ext-harness';

const A = '00000000-0000-4000-8000-0000000d1a0a';
const B = '00000000-0000-4000-8000-0000000d1a0b';
const cfg = (tag: string) => ({
  enabled: true, url: `ldaps://${tag}.example.test`, bindDN: `cn=${tag}`, bindPassword: `pw-${tag}`, searchBase: `dc=${tag}`,
});

describe.skipIf(!process.env.TEST_DATABASE_URL)('ldap: the configuration is the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    for (const [id, tag] of [[A, 'a'], [B, 'b']]) {
      await h.pool.query(
        `INSERT INTO zvd_ldap_config (tenant_id, config) VALUES ($1, $2::jsonb)
         ON CONFLICT (tenant_id) DO UPDATE SET config = EXCLUDED.config`,
        [id, JSON.stringify(cfg(tag))],
      );
    }
  });

  afterAll(async () => {
    await h.pool.query(`DELETE FROM zvd_ldap_config WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    await h.done();
  });

  // Both firms: which row an unfiltered read returns depends on the plan, so
  // one firm alone may pass.
  it('a god reads the directory of the firm it works in', async () => {
    for (const [tenant, tag] of [[A, 'a'], [B, 'b']]) {
      const res = await (await h.asGod(tenant)).request('/config');
      expect(res.status).toBe(200);
      expect(((await res.json()) as any).config.url).toBe(`ldaps://${tag}.example.test`);
    }
  });

  it('a save in firm B keeps B’s password and leaves A’s row alone', async () => {
    const { bindPassword: _keep, ...body } = cfg('b2');
    const res = await (await h.asGod(B)).request('/config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(200);
    const rows = await h.pool.query(
      `SELECT tenant_id, config->>'url' AS url, config->>'bindPassword' AS pw
         FROM zvd_ldap_config WHERE tenant_id = ANY($1) ORDER BY tenant_id`,
      [[A, B]],
    );
    expect(rows.rows[0]).toEqual({ tenant_id: A, url: 'ldaps://a.example.test', pw: 'pw-a' });
    expect(rows.rows[1].url).toBe('ldaps://b2.example.test');
    // Stored encrypted now; under the encryption it must be B's own password.
    const { ctx } = await mountForTest(import.meta.dir);
    expect(await ctx.internals.decryptSecret(rows.rows[1].pw)).toBe('pw-b');
  });
});
