// A SAML sign-in produces a cookie the engine accepts, and a deactivated user
// gets none — on the engine's real `/ext/*` chain (`onEngine`).
//
// The settings are the declared collection `saml_settings`; `private_key` is a
// `secret` field (ADR 0024), sealed from every request role and served to no
// one, so the routes read it through `ctx.host(c).collections` (ADR 0025), as
// the system inside `asSystem`, in the request's firm only.
//
// The ACS is a declared public route (ADR 0039) that signs the person in with
// `host.identity.signIn`: the engine finds or creates the account — an address
// the tenant has no claim to, the instance owner's, signs nobody in — opens the
// session and audits success and failure with the provider as actor. "Signed
// in" here means the engine's `getSession` read the cookie back.
//
// The assertion is genuinely signed and validated by the real node-saml.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
// @ts-ignore — node-forge ships no types in this repository.
import forge from 'node-forge';
// @ts-ignore — xml-crypto 2.x ships no types.
import { SignedXml } from 'xml-crypto';
import { onEngine } from '../../../testing/ext-harness';

const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET && process.env.FIELD_ENCRYPTION_KEY
    ? describe
    : describe.skip;

const SP = 'zveltio-sp';
const ACS = 'http://localhost/ext/auth/saml/callback';

/** A self-signed IdP and a signed Response for `email`. */
function createIdp() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date(Date.now() - 86_400_000);
  cert.validity.notAfter = new Date(Date.now() + 86_400_000);
  cert.setSubject([{ name: 'commonName', value: 'test-idp' }]);
  cert.setIssuer([{ name: 'commonName', value: 'test-idp' }]);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

  const response = (email: string) => {
    const at = new Date().toISOString();
    const later = new Date(Date.now() + 5 * 60_000).toISOString();
    const aid = `_a${crypto.randomUUID().replaceAll('-', '')}`;
    const xml =
      `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r${aid}" Version="2.0" IssueInstant="${at}" Destination="${ACS}">` +
      `<saml:Issuer>https://idp.test</saml:Issuer>` +
      `<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>` +
      `<saml:Assertion ID="${aid}" Version="2.0" IssueInstant="${at}"><saml:Issuer>https://idp.test</saml:Issuer>` +
      `<saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${email}</saml:NameID>` +
      `<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="${later}" Recipient="${ACS}"/></saml:SubjectConfirmation></saml:Subject>` +
      `<saml:Conditions NotBefore="${at}" NotOnOrAfter="${later}"><saml:AudienceRestriction><saml:Audience>${SP}</saml:Audience></saml:AudienceRestriction></saml:Conditions>` +
      `<saml:AuthnStatement AuthnInstant="${at}" SessionIndex="${aid}"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement>` +
      `<saml:AttributeStatement><saml:Attribute Name="email"><saml:AttributeValue>${email}</saml:AttributeValue></saml:Attribute></saml:AttributeStatement>` +
      `</saml:Assertion></samlp:Response>`;
    // Sign the Response (its enveloped signature covers the assertion), which is
    // what the SP requires by default (wantAuthnResponseSigned). xml-crypto 6
    // (pulled in by @node-saml/node-saml 5.x) takes an options object and uses
    // `privateKey`/`getSignedXml`, not the 2.x `signingKey`/positional-
    // `addReference` API this used to call.
    const sig = new SignedXml({
      privateKey: keyPem,
      signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
      canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
    });
    sig.addReference({
      xpath: "//*[local-name(.)='Response']",
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/2001/10/xml-exc-c14n#',
      ],
      digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
    });
    sig.computeSignature(xml, {
      location: { reference: "//*[local-name(.)='Issuer']", action: 'after' },
    });
    return Buffer.from(sig.getSignedXml()).toString('base64');
  };
  const config = {
    enabled: true,
    entryPoint: 'https://idp.test/sso',
    issuer: SP,
    cert: forge.pki.certificateToPem(cert),
    callbackUrl: ACS,
  };
  return { config, response };
}

d('auth/saml — an assertion is a session the engine accepts', () => {
  const idp = createIdp();
  const tag = `${Date.now()}${Math.floor(Math.random() * 1e4)}`;
  const DEFAULT = '00000000-0000-0000-0000-000000000001';
  const firm = (k: string) => ({ id: crypto.randomUUID(), slug: `saml-${k}-${tag}` });
  const A = firm('a');
  const B = firm('b');
  const C = firm('c');
  const spKey = forge.pki.privateKeyToPem(forge.pki.rsa.generateKeyPair(2048).privateKey);
  let e: Awaited<ReturnType<typeof onEngine>>;
  let god = '';
  let owner = '';
  let getSession: (cookie: string) => Promise<string | undefined>;

  const seed = (tenant: string, issuer: string, privateKey: string | null) =>
    e.harness.asTenant(e.db, tenant, (trx: any) =>
      e.sql`INSERT INTO zvd_saml_settings (tenant_id, scope, enabled, entry_point, issuer, cert, callback_url, private_key)
            VALUES (${tenant}::uuid, 'tenant', true, ${idp.config.entryPoint}, ${issuer}, ${idp.config.cert},
                    ${idp.config.callbackUrl}, ${privateKey})`.execute(trx),
    );

  beforeAll(async () => {
    e = await onEngine(import.meta.dir);
    const { encryptField } = await import(join(ENGINE, 'lib/data/field-crypto.js'));
    const { getAuth } = await import(join(ENGINE, 'lib/auth.js'));
    getSession = async (setCookie) =>
      (await getAuth().api.getSession({ headers: new Headers({ cookie: setCookie.split(';')[0] ?? '' }) }))?.user?.id;
    god = await e.harness.createGodSession(e.engineApp, e.db);
    owner = (await e.sql`SELECT email FROM "user" WHERE role = 'god'`.execute(e.db)).rows[0].email;
    for (const t of [A, B, C]) {
      await e.sql`INSERT INTO zv_tenants (id, slug, name, status) VALUES (${t.id}::uuid, ${t.slug}, ${t.slug}, 'active')`.execute(e.db);
    }
    await e.harness.asEveryTenant(e.db, (trx: any) => e.sql`DELETE FROM zvd_saml_settings`.execute(trx));
    await seed(DEFAULT, idp.config.issuer, null);
    await seed(A.id, 'sp-a', await encryptField(spKey));
    await seed(B.id, 'sp-b', null);
    await seed(C.id, SP, null);
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    await e.done();
    await e.sql`DELETE FROM zv_tenants WHERE id IN (${A.id}::uuid, ${B.id}::uuid, ${C.id}::uuid)`.execute(e.db);
  });

  const account = async (email: string, banned = false) => {
    const id = crypto.randomUUID();
    await e.sql`
      INSERT INTO "user" (id, email, name, "emailVerified", banned, "createdAt", "updatedAt")
      VALUES (${id}, ${email}, ${email}, true, ${banned}, NOW(), NOW())`.execute(e.db);
    return id;
  };

  /** The IdP's form POST to the ACS, anonymous, in the default tenant. */
  const acs = (email: string, samlResponse = idp.response(email), host = 'localhost') => {
    const form = new FormData();
    form.set('SAMLResponse', samlResponse);
    return e.app.request('/ext/auth/saml/callback', { method: 'POST', body: form, headers: { host } });
  };
  /** GET `path` in `slug`'s firm, as the god when `cookie` is given. */
  const get = (path: string, slug: string, cookie?: string) =>
    e.app.request(`/ext/auth/saml${path}`, {
      headers: { host: `${slug}.saml.test`, ...(cookie ? { cookie } : {}) },
    });

  it('signs the user in, and the next sign-in replaces the session', async () => {
    const email = `carol-${tag}@saml.test`;
    const id = await account(email);

    const first = await acs(email);
    expect(first.status).toBe(302);
    const firstCookie = first.headers.get('set-cookie') ?? '';
    expect(await getSession(firstCookie)).toBe(id);

    const second = await acs(email);
    expect(second.status).toBe(302);
    expect(await getSession(second.headers.get('set-cookie') ?? '')).toBe(id);
    expect(await getSession(firstCookie)).toBeUndefined();
  });

  /** The engine's sign-in audit rows naming `who` (the NameID, or the assertion id). */
  const audited = (type: string, who: string) =>
    e.harness.asEveryTenant(e.db, async (trx: any) =>
      (
        await e.sql`SELECT user_id, metadata->>'provider' AS provider, metadata->>'actor' AS actor,
                           metadata->>'reason' AS reason
                      FROM zv_audit_log
                     WHERE event_type = ${type}
                       AND (metadata->>'subject' = ${who} OR metadata->>'identifier' = ${who})`.execute(trx)
      ).rows,
    );

  it('a sign-in and a refused one each leave the engine audit entry, the provider as actor', async () => {
    const email = `frank-${tag}@saml.test`;
    const ok = await acs(email);
    expect(ok.status).toBe(302);
    const id = await getSession(ok.headers.get('set-cookie') ?? '');
    const signedIn = await audited('auth.login_success', email);
    expect([signedIn.length, signedIn[0]]).toMatchObject([
      1,
      { user_id: id, provider: 'saml', actor: 'ext:auth/saml' },
    ]);

    // A replay is refused at the provider: the engine audits it on its word.
    const assertion = idp.response(email);
    expect((await acs(email, assertion)).status).toBe(302);
    expect((await acs(email, assertion)).status).toBe(401);
    const aid = /<saml:Assertion ID="([^"]+)"/.exec(Buffer.from(assertion, 'base64').toString())?.[1] ?? '';
    const failed = await audited('auth.login_failed', aid);
    expect([failed.length, failed[0]?.provider, failed[0]?.reason]).toEqual([1, 'saml', 'assertion already used']);
  });

  it('GET /api/sign-in/providers lists the identity provider, for any front end', async () => {
    const res = await e.engineApp.request('/api/sign-in/providers');
    const { providers } = (await res.json()) as { providers: Record<string, unknown>[] };
    expect(providers).toContainEqual({
      id: 'saml',
      label: 'SAML single sign-on',
      kind: 'redirect',
      extension: 'auth/saml',
      url: '/ext/auth/saml/login',
    });
  });

  it('refuses a deactivated user with 403, no cookie, and spends the assertion', async () => {
    const email = `dave-${tag}@saml.test`;
    const id = await account(email, true);

    const assertion = idp.response(email);
    const res = await acs(email, assertion);
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
    const rows = await e.sql`SELECT 1 FROM session WHERE "userId" = ${id}`.execute(e.db);
    expect(rows.rows).toHaveLength(0);
    const refused = await audited('auth.login_failed', email);
    expect(refused.at(-1)).toMatchObject({ user_id: id, provider: 'saml', reason: 'account_disabled' });
    // Reactivated, the refused assertion still cannot be presented again.
    await e.sql`UPDATE "user" SET banned = false WHERE id = ${id}`.execute(e.db);
    expect((await acs(email, assertion)).status).toBe(401);
  });

  it('a person the firm does not admit is refused with 403, no account, and the assertion is spent', async () => {
    const email = `grace-${tag}@saml.test`;
    const assertion = idp.response(email);
    const host = `${C.slug}.saml.test`;
    const res = await acs(email, assertion, host);
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
    const users = await e.sql`SELECT 1 FROM "user" WHERE email = ${email}`.execute(e.db);
    expect(users.rows).toHaveLength(0);
    expect((await audited('auth.login_failed', email)).at(-1)).toMatchObject({ provider: 'saml', reason: 'not_a_member' });
    expect((await acs(email, assertion, host)).status).toBe(401);
  });

  it('a first sign-in provisions the account through the engine', async () => {
    const email = `Erin-${tag}@SAML.test`;
    const res = await acs(email);
    expect(res.status).toBe(302);
    const id = await getSession(res.headers.get('set-cookie') ?? '');
    const row = await e.sql`SELECT email, "emailVerified", role FROM "user" WHERE id = ${id ?? ''}`.execute(e.db);
    expect(row.rows[0]).toMatchObject({ email: email.toLowerCase(), emailVerified: true });
    expect(row.rows[0].role).not.toBe('god');
  });

  it("an assertion naming the instance owner's address signs nobody in", async () => {
    const res = await acs(owner);
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  // The settings are read as the system, whose reach is the request's firm —
  // even for a god, whose own reach is every firm.
  it('the metadata is the identity provider of the firm the request runs in', async () => {
    for (const [slug, issuer] of [[A.slug, 'sp-a'], [B.slug, 'sp-b']]) {
      const res = await get('/metadata', slug, god);
      expect(res.status).toBe(200);
      expect(await res.text()).toContain(`entityID="${issuer}"`);
    }
  });

  // node-saml signs the AuthnRequest with the SP key when it has one: the
  // signature on the redirect is the key, revealed to this extension only.
  it("/login signs with the firm's private key, which the data API serves to no one", async () => {
    const signed = await get('/login', A.slug);
    expect(signed.status).toBe(302);
    expect(new URL(signed.headers.get('location') ?? '').searchParams.get('Signature')).toBeTruthy();
    const unsigned = await get('/login', B.slug);
    expect(unsigned.status).toBe(302);
    expect(new URL(unsigned.headers.get('location') ?? '').searchParams.get('Signature')).toBeNull();

    const res = await e.engineApp.request('/api/data/saml_settings', { headers: { cookie: god } });
    expect(res.status).toBe(200);
    const { records } = (await res.json()) as { records: Record<string, unknown>[] };
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) expect(r).not.toHaveProperty('private_key');
  });
});
