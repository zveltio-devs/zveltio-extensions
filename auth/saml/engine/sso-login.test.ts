// A SAML sign-in produces a cookie the engine accepts, and a deactivated user
// gets none.
//
// The ACS ran `DELETE FROM session` and the session insert on the request's
// transaction — as `zveltio_rls`, which has had no grant on `session` since
// engine migration 044 — so every SAML login answered 500. With Valkey the row
// would not have been read anyway. The session is now the host's to write
// (`createBetterAuthSession`), and the harness wires the engine's real one, so
// "signed in" here means the engine's `getSession` read the cookie back.
//
// The assertion is genuinely signed and validated by the real node-saml. The
// account is the engine's to find or create (`provisionUser`): a first sign-in
// provisions it, and an address the tenant has no claim to — the instance
// owner's — signs nobody in.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Kysely, PostgresDialect, sql } from 'kysely';
// @ts-ignore — node-forge ships no types in this repository.
import forge from 'node-forge';
import { Pool } from 'pg';
// @ts-ignore — xml-crypto 2.x ships no types.
import { SignedXml } from 'xml-crypto';
import { engineSession, godAcrossFirms, mountForTest } from '../../../testing/ext-harness';

const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');
const manifest = JSON.parse(readFileSync(join(import.meta.dir, '../manifest.json'), 'utf8'));

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

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
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  const idp = createIdp();
  let engineDb: any;

  // The IdP settings are the declared collection `saml_settings`, saved through
  // the data API in the product; here one row per test tenant is written.
  const seed = (tenant: string | null, c: { entryPoint: string; issuer: string; cert: string; callbackUrl: string }) =>
    sql`
      INSERT INTO zvd_saml_settings (tenant_id, scope, enabled, entry_point, issuer, cert, callback_url)
      VALUES (COALESCE(${tenant}::uuid, '00000000-0000-0000-0000-000000000001'::uuid), 'tenant', true,
              ${c.entryPoint}, ${c.issuer}, ${c.cert}, ${c.callbackUrl})`.execute(db);

  beforeAll(async () => {
    const { getTestApp } = await import(join(ENGINE, 'testing/app-harness.js'));
    const { applyDeclaredCollections, readDeclaredCollections } = await import(
      join(ENGINE, 'lib/extensions/declared-collections.js')
    );
    ({ db: engineDb } = await getTestApp());
    const files = await readDeclaredCollections(
      manifest.name,
      join(import.meta.dir, '..'),
      manifest.collections,
      manifest.integrity?.schemaSha256,
    );
    await applyDeclaredCollections(engineDb, manifest.name, files, true);
    await sql`DELETE FROM zvd_saml_settings`.execute(db);
    await seed(null, idp.config);
  });

  afterAll(async () => {
    if (engineDb) {
      const { dropTestCollection } = await import(join(ENGINE, 'testing/app-harness.js'));
      for (const name of manifest.collections) await dropTestCollection(engineDb, name);
    }
    await db.destroy();
  });

  const account = async (email: string, banned = false) => {
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO "user" (id, email, name, "emailVerified", banned, "createdAt", "updatedAt")
      VALUES (${id}, ${email}, ${email}, true, ${banned}, NOW(), NOW())`.execute(db);
    return id;
  };

  const setUp = async () => {
    // Anonymous, in the tenant transaction: the callback reads the settings and
    // claims the assertion as the system, which runs only inside a tenant.
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false, transaction: true });
    return (email: string, samlResponse = idp.response(email)) => {
      const form = new FormData();
      form.set('SAMLResponse', samlResponse);
      return app.request('/callback', { method: 'POST', body: form });
    };
  };

  it('signs the user in, and the next sign-in replaces the session', async () => {
    const email = `carol-${Date.now()}@saml.test`;
    const id = await account(email);
    const acs = await setUp();

    const first = await acs(email);
    expect(first.status).toBe(302);
    const firstCookie = first.headers.get('set-cookie') ?? '';
    expect(await engineSession(firstCookie)).toBe(id);

    const second = await acs(email);
    expect(second.status).toBe(302);
    expect(await engineSession(second.headers.get('set-cookie') ?? '')).toBe(id);
    expect(await engineSession(firstCookie)).toBeUndefined();
  });

  it('refuses a deactivated user with 403, no cookie, and spends the assertion', async () => {
    const email = `dave-${Date.now()}@saml.test`;
    const id = await account(email, true);
    const acs = await setUp();

    const assertion = idp.response(email);
    const res = await acs(email, assertion);
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
    const rows = await sql`SELECT 1 FROM session WHERE "userId" = ${id}`.execute(db);
    expect(rows.rows).toHaveLength(0);
    // Reactivated, the refused assertion still cannot be presented again.
    await sql`UPDATE "user" SET banned = false WHERE id = ${id}`.execute(db);
    expect((await acs(email, assertion)).status).toBe(401);
  });

  it('a first sign-in provisions the account through the engine', async () => {
    const email = `Erin-${Date.now()}@SAML.test`;
    const acs = await setUp();
    const res = await acs(email);
    expect(res.status).toBe(302);
    const id = await engineSession(res.headers.get('set-cookie') ?? '');
    const row = await sql<{ email: string; emailVerified: boolean; role: string | null }>`
      SELECT email, "emailVerified", role FROM "user" WHERE id = ${id ?? ''}`.execute(db);
    expect(row.rows[0]).toMatchObject({ email: email.toLowerCase(), emailVerified: true });
    expect(row.rows[0]!.role).not.toBe('god');
  });

  it("an assertion naming the instance owner's address signs nobody in", async () => {
    const acs = await setUp();
    const res = await acs('ext-harness-uuid@test.local');
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  // A god's read reach is every firm, so the settings read without its tenant
  // filter answers with whichever firm's row comes first. The SP metadata names
  // the firm's own entity ID.
  it('the metadata is the identity provider of the firm the request runs in', async () => {
    const A = '00000000-0000-4000-8000-0000000d5a0a';
    const B = '00000000-0000-4000-8000-0000000d5a0b';
    const h = await godAcrossFirms(import.meta.dir, [A, B]);
    try {
      for (const [tenant, tag] of [[A, 'a'], [B, 'b']]) {
        await seed(tenant, { ...idp.config, issuer: `sp-${tag}` });
      }
      for (const [tenant, tag] of [[A, 'a'], [B, 'b']]) {
        const res = await (await h.asGod(tenant)).request('/metadata');
        expect(res.status).toBe(200);
        expect(await res.text()).toContain(`entityID="sp-${tag}"`);
      }
    } finally {
      await h.pool.query(`DELETE FROM zvd_saml_settings WHERE tenant_id = ANY($1)`, [[A, B]]);
      await h.done();
    }
  });
});
