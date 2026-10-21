// The SAML identity provider a request uses is its OWN firm's row.
//
// `zvd_saml_config` is one row per tenant (migration 004), but the reader was
// `selectFrom('zvd_saml_config').executeTakeFirst()` — no tenant filter. The row
// policy admits the caller's READ REACH, every firm for a god and the
// descendants for a `subtree` member, so a god in firm B read firm A's IdP — and
// a signed-in god's login and ACS callback ran against it.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms } from '../../../testing/ext-harness';

const A = '00000000-0000-4000-8000-0000000d5a0a';
const B = '00000000-0000-4000-8000-0000000d5a0b';

describe.skipIf(!process.env.TEST_DATABASE_URL)('saml: the configuration is the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    for (const [id, tag] of [[A, 'a'], [B, 'b']]) {
      const config = {
        enabled: true,
        entryPoint: `https://idp-${tag}.example.test/sso`,
        issuer: `sp-${tag}`,
        cert: `cert-${tag}`,
        callbackUrl: `https://sp-${tag}.example.test/acs`,
      };
      await h.pool.query(
        `INSERT INTO zvd_saml_config (tenant_id, config) VALUES ($1, $2::jsonb)
         ON CONFLICT (tenant_id) DO UPDATE SET config = EXCLUDED.config`,
        [id, JSON.stringify(config)],
      );
    }
  });

  afterAll(async () => {
    await h.pool.query(`DELETE FROM zvd_saml_config WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    await h.done();
  });

  // Both firms: which row an unfiltered read returns depends on the plan, so
  // one firm alone may pass.
  it('a god reads the identity provider of the firm it works in', async () => {
    for (const [tenant, tag] of [[A, 'a'], [B, 'b']]) {
      const res = await (await h.asGod(tenant)).request('/config');
      expect(res.status).toBe(200);
      expect(((await res.json()) as any).config.issuer).toBe(`sp-${tag}`);
    }
  });
});
