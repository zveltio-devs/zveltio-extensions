// An LDAP sign-in produces a cookie the engine accepts, and a deactivated user
// gets none — on the engine's real `/ext/*` chain (`onEngine`).
//
// The settings are the declared collection `ldap_settings`; `bind_password` is a
// `secret` field (ADR 0024), sealed from every request role and served to no
// one, so the routes read it through `ctx.host(c).collections` (ADR 0025):
// `/login` as the system inside `asSystem`, `/test` as the caller. Each firm
// reads its own row only — a god's read reach is every firm.
//
// The directory is real LDAP over a socket, spoken by the real `ldapts` client.
// The account is the engine's to find or create (`provisionUser`): a first
// sign-in provisions it, and an address the tenant has no claim to — the
// instance owner's — signs nobody in.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
// @ts-ignore — asn1 ships no types; it is ldapts' own BER codec.
import { Ber, BerReader, BerWriter } from 'asn1';
import { onEngine } from '../../../testing/ext-harness';

const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET && process.env.FIELD_ENCRYPTION_KEY
    ? describe
    : describe.skip;

const SERVICE_DN = 'cn=svc,dc=test';
const SERVICE_PASSWORD = 'svc-secret';
type DirectoryUser = { uid: string; password: string; mail: string };

function message(id: number, op: number, body: (w: any) => void): Buffer {
  const w = new BerWriter();
  w.startSequence();
  w.writeInt(id);
  w.startSequence(op);
  body(w);
  w.endSequence();
  w.endSequence();
  return w.buffer;
}
const result = (code: number) => (w: any) => {
  w.writeEnumeration(code);
  w.writeString('');
  w.writeString('');
};

/** Simple bind, search, unbind — what `ldapAuthenticate` sends. */
function startDirectory(users: DirectoryUser[]) {
  const dnOf = (u: DirectoryUser) => `uid=${u.uid},dc=test`;
  const server = Bun.listen({
    hostname: '127.0.0.1',
    port: 0,
    socket: {
      data(socket, chunk) {
        const r = new BerReader(Buffer.from(chunk));
        r.readSequence();
        const id = r.readInt();
        const op = r.readSequence();
        if (op === 0x60) {
          r.readInt();
          const dn = r.readString();
          const password = r.readString(Ber.Context) ?? '';
          const ok =
            (dn === SERVICE_DN && password === SERVICE_PASSWORD) ||
            users.find((u) => dnOf(u) === dn)?.password === password;
          socket.write(message(id, 0x61, result(ok ? 0 : 49)));
        } else if (op === 0x63) {
          const user = users.find((u) => Buffer.from(chunk).toString('latin1').includes(u.uid));
          if (user) {
            socket.write(
              message(id, 0x64, (w) => {
                w.writeString(dnOf(user));
                w.startSequence();
                for (const [k, v] of [['uid', user.uid], ['mail', user.mail], ['cn', user.uid]]) {
                  w.startSequence();
                  w.writeString(k);
                  w.startSequence(0x31);
                  w.writeString(v);
                  w.endSequence();
                  w.endSequence();
                }
                w.endSequence();
              }),
            );
          }
          socket.write(message(id, 0x65, result(0)));
        } else if (op === 0x42) {
          socket.end();
        }
      },
    },
  });
  return {
    url: `ldap://127.0.0.1:${server.port}`,
    stop: () => server.stop(true),
  };
}

d('auth/ldap — a directory sign-in is a session the engine accepts', () => {
  const tag = `${Date.now()}${Math.floor(Math.random() * 1e4)}`;
  const alice = { uid: `alice${tag}`, password: 'pw-alice', mail: `alice-${tag}@ldap.test` };
  const bob = { uid: `bob${tag}`, password: 'pw-bob', mail: `bob-${tag}@ldap.test` };
  const carol = { uid: `carol${tag}`, password: 'pw-carol', mail: `Carol-${tag}@LDAP.test` };
  // A directory whose `mail` attribute names the instance owner — some
  // directories let users edit their own. Its address is the god's, read below.
  const mallory = { uid: `mallory${tag}`, password: 'pw-mallory', mail: '' };
  const directory = startDirectory([alice, bob, carol, mallory]);
  const DEFAULT = '00000000-0000-0000-0000-000000000001';
  // Firm A points at the directory, B at nothing listening, C holds a bind
  // password the instance's key cannot decrypt.
  const firm = (k: string) => ({ id: crypto.randomUUID(), slug: `ldap-${k}-${tag}` });
  const A = firm('a');
  const B = firm('b');
  const C = firm('c');
  let e: Awaited<ReturnType<typeof onEngine>>;
  let god = '';
  let getSession: (cookie: string) => Promise<string | undefined>;

  const seed = async (tenant: string, url: string, bindPassword: string) =>
    e.harness.asTenant(e.db, tenant, (trx: any) =>
      e.sql`INSERT INTO zvd_ldap_settings (tenant_id, scope, enabled, url, bind_dn, bind_password, search_base, tls_verify)
            VALUES (${tenant}::uuid, 'tenant', true, ${url}, ${SERVICE_DN}, ${bindPassword}, 'dc=test', false)`.execute(trx),
    );

  beforeAll(async () => {
    e = await onEngine(import.meta.dir);
    const { encryptField } = await import(join(ENGINE, 'lib/data/field-crypto.js'));
    const { getAuth } = await import(join(ENGINE, 'lib/auth.js'));
    getSession = async (setCookie) =>
      (await getAuth().api.getSession({ headers: new Headers({ cookie: setCookie.split(';')[0] ?? '' }) }))?.user?.id;
    god = await e.harness.createGodSession(e.engineApp, e.db);
    mallory.mail = (await e.sql`SELECT email FROM "user" WHERE role = 'god'`.execute(e.db)).rows[0].email;
    for (const t of [A, B, C]) {
      await e.sql`INSERT INTO zv_tenants (id, slug, name, status) VALUES (${t.id}::uuid, ${t.slug}, ${t.slug}, 'active')`.execute(e.db);
    }
    await e.harness.asEveryTenant(e.db, (trx: any) => e.sql`DELETE FROM zvd_ldap_settings`.execute(trx));
    const sealed = await encryptField(SERVICE_PASSWORD);
    await seed(DEFAULT, directory.url, sealed);
    await seed(A.id, directory.url, sealed);
    await seed(B.id, 'ldap://127.0.0.1:1', sealed);
    await seed(C.id, directory.url, 'enc:v1:not-a-ciphertext');
  }, 120_000);

  afterAll(async () => {
    directory.stop();
    if (!e) return;
    await e.done();
    await e.sql`DELETE FROM zv_tenants WHERE id IN (${A.id}::uuid, ${B.id}::uuid, ${C.id}::uuid)`.execute(e.db);
  });

  const account = async (mail: string, banned = false) => {
    const id = crypto.randomUUID();
    await e.sql`
      INSERT INTO "user" (id, email, name, "emailVerified", banned, "createdAt", "updatedAt")
      VALUES (${id}, ${mail}, ${mail}, true, ${banned}, NOW(), NOW())`.execute(e.db);
    return id;
  };

  /** POST `path` as `u`, in `slug`'s firm (the default tenant without one), with `cookie` if given. */
  const call = (path: string, u: DirectoryUser, opts: { slug?: string; cookie?: string } = {}) =>
    e.app.request(`/ext/auth/ldap${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        host: opts.slug ? `${opts.slug}.ldap.test` : 'localhost',
        ...(opts.cookie ? { cookie: opts.cookie } : {}),
      },
      body: JSON.stringify({ username: u.uid, password: u.password }),
    });
  const login = (u: DirectoryUser, slug?: string) => call('/login', u, { slug });

  it('signs the user in, and the next sign-in replaces the session', async () => {
    const id = await account(alice.mail);

    const first = await login(alice);
    expect(first.status).toBe(200);
    const firstCookie = first.headers.get('set-cookie') ?? '';
    expect(await getSession(firstCookie)).toBe(id);

    const second = await login(alice);
    expect(second.status).toBe(200);
    expect(await getSession(second.headers.get('set-cookie') ?? '')).toBe(id);
    expect(await getSession(firstCookie)).toBeUndefined();
  });

  it('refuses a deactivated user with 403 and no cookie', async () => {
    const id = await account(bob.mail, true);
    const res = await login(bob);
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
    const rows = await e.sql`SELECT 1 FROM session WHERE "userId" = ${id}`.execute(e.db);
    expect(rows.rows).toHaveLength(0);
  });

  it('a first sign-in provisions the account through the engine', async () => {
    const res = await login(carol);
    expect(res.status).toBe(200);
    const id = await getSession(res.headers.get('set-cookie') ?? '');
    const row = await e.sql`SELECT email, "emailVerified", role FROM "user" WHERE id = ${id ?? ''}`.execute(e.db);
    // Lower-cased, verified, never god.
    expect(row.rows[0]).toMatchObject({ email: carol.mail.toLowerCase(), emailVerified: true });
    expect(row.rows[0].role).not.toBe('god');
  });

  it('a directory address that names the instance owner signs nobody in', async () => {
    const res = await login(mallory);
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  // `/login` reads as the system, and the system's reach is the request's firm:
  // B's row points at no directory, so a sign-in there cannot reach A's.
  it("/login binds with the firm's own settings, decrypted for this extension", async () => {
    expect((await login(alice, B.slug)).status).toBe(401);
    // Alice is a member nowhere yet: the engine refuses to hand her to firm A,
    // which proves the bind and search ran against A's directory first.
    expect([200, 403]).toContain((await login(alice, A.slug)).status);
    const failed = await login({ ...alice, password: 'wrong' }, A.slug);
    expect(failed.status).toBe(401);
  });

  it('answers 500 "unreadable" for a bind password the key cannot decrypt, not "not configured"', async () => {
    const res = await login(alice, C.slug);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'LDAP configuration is unreadable' });
  });

  it('POST /test refuses an anonymous caller (401) and a non-admin (403)', async () => {
    expect((await call('/test', alice)).status).toBe(401);
    const member = await e.harness.createMemberSession(e.engineApp, e.db, { grants: [] });
    expect((await call('/test', alice, { cookie: member.cookie })).status).toBe(403);
  });

  // As the caller: a god's read reach is every firm, so the list holds A's and
  // B's rows; each firm's admin tests its own directory only.
  it('POST /test uses the directory of the firm the admin works in', async () => {
    const test = async (slug: string) =>
      (await (await call('/test', alice, { slug, cookie: god })).json()) as { success: boolean };
    expect((await test(A.slug)).success).toBe(true);
    expect((await test(B.slug)).success).toBe(false);
  });

  it('the data API serves bind_password to no one, god included', async () => {
    const res = await e.engineApp.request('/api/data/ldap_settings', { headers: { cookie: god } });
    expect(res.status).toBe(200);
    const { records } = (await res.json()) as { records: Record<string, unknown>[] };
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) expect(r).not.toHaveProperty('bind_password');
  });
});
