// An LDAP sign-in produces a cookie the engine accepts, and a deactivated user
// gets none.
//
// `/login` ran `DELETE FROM session` and the session insert on the request's
// transaction — as `zveltio_rls`, which has had no grant on `session` since
// engine migration 044 — so every LDAP login answered 500. With Valkey the row
// would not have been read anyway. The session is now the host's to write
// (`createBetterAuthSession`), and the harness wires the engine's real one, so
// "signed in" here means the engine's `getSession` read the cookie back.
//
// The directory is real LDAP over a socket, spoken by the real `ldapts` client.
// The account is the engine's to find or create (`provisionUser`): a first
// sign-in provisions it, and an address the tenant has no claim to — the
// instance owner's — signs nobody in.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// @ts-ignore — asn1 ships no types; it is ldapts' own BER codec.
import { Ber, BerReader, BerWriter } from 'asn1';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { engineSession, godAcrossFirms, mountForTest } from '../../../testing/ext-harness';

const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');
const manifest = JSON.parse(readFileSync(join(import.meta.dir, '../manifest.json'), 'utf8'));

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

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
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  const tag = `${Date.now()}${Math.floor(Math.random() * 1e4)}`;
  const alice = { uid: `alice${tag}`, password: 'pw-alice', mail: `alice-${tag}@ldap.test` };
  const bob = { uid: `bob${tag}`, password: 'pw-bob', mail: `bob-${tag}@ldap.test` };
  const carol = { uid: `carol${tag}`, password: 'pw-carol', mail: `Carol-${tag}@LDAP.test` };
  // A directory whose `mail` attribute names the instance owner — some
  // directories let users edit their own.
  const mallory = { uid: `mallory${tag}`, password: 'pw-mallory', mail: 'ext-harness-uuid@test.local' };
  const directory = startDirectory([alice, bob, carol, mallory]);
  let engineDb: any;

  // The settings are the declared collection `ldap_settings`, saved through the
  // data API in the product; here one row is written with the bind password
  // encrypted the way the engine stores it.
  beforeAll(async () => {
    const { getTestApp } = await import(join(ENGINE, 'testing/app-harness.js'));
    const { applyDeclaredCollections, readDeclaredCollections } = await import(
      join(ENGINE, 'lib/extensions/declared-collections.js')
    );
    const { maybeEncrypt } = await import(join(ENGINE, 'lib/data/field-crypto.js'));
    ({ db: engineDb } = await getTestApp());
    const files = await readDeclaredCollections(
      manifest.name,
      join(import.meta.dir, '..'),
      manifest.collections,
      manifest.integrity?.schemaSha256,
    );
    await applyDeclaredCollections(engineDb, manifest.name, files, true);
    await sql`DELETE FROM zvd_ldap_settings`.execute(db);
    await sql`
      INSERT INTO zvd_ldap_settings (scope, enabled, url, bind_dn, bind_password, search_base, tls_verify)
      VALUES ('tenant', true, ${directory.url}, ${SERVICE_DN}, ${await maybeEncrypt(SERVICE_PASSWORD, true)}, 'dc=test', false)`.execute(db);
  });

  afterAll(async () => {
    directory.stop();
    if (engineDb) {
      const { dropTestCollection } = await import(join(ENGINE, 'testing/app-harness.js'));
      await dropTestCollection(engineDb, 'ldap_settings');
    }
    await db.destroy();
  });

  const account = async (mail: string, banned = false) => {
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO "user" (id, email, name, "emailVerified", banned, "createdAt", "updatedAt")
      VALUES (${id}, ${mail}, ${mail}, true, ${banned}, NOW(), NOW())`.execute(db);
    return id;
  };

  const setUp = async () => {
    // Anonymous, in the tenant transaction: `/login` reads the settings as the
    // system, which the engine allows only inside the running tenant.
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false, transaction: true });
    const login = (u: DirectoryUser) =>
      app.request('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: u.uid, password: u.password }),
      });
    return login;
  };

  it('signs the user in, and the next sign-in replaces the session', async () => {
    const id = await account(alice.mail);
    const login = await setUp();

    const first = await login(alice);
    expect(first.status).toBe(200);
    const firstCookie = first.headers.get('set-cookie') ?? '';
    expect(await engineSession(firstCookie)).toBe(id);

    const second = await login(alice);
    expect(second.status).toBe(200);
    expect(await engineSession(second.headers.get('set-cookie') ?? '')).toBe(id);
    expect(await engineSession(firstCookie)).toBeUndefined();
  });

  it('refuses a deactivated user with 403 and no cookie', async () => {
    const id = await account(bob.mail, true);
    const login = await setUp();

    const res = await login(bob);
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
    const rows = await sql`SELECT 1 FROM session WHERE "userId" = ${id}`.execute(db);
    expect(rows.rows).toHaveLength(0);
  });

  it('a first sign-in provisions the account through the engine', async () => {
    const login = await setUp();
    const res = await login(carol);
    expect(res.status).toBe(200);
    const id = await engineSession(res.headers.get('set-cookie') ?? '');
    const row = await sql<{ email: string; emailVerified: boolean; role: string | null }>`
      SELECT email, "emailVerified", role FROM "user" WHERE id = ${id ?? ''}`.execute(db);
    // Lower-cased, verified, never god.
    expect(row.rows[0]).toMatchObject({ email: carol.mail.toLowerCase(), emailVerified: true });
    expect(row.rows[0]!.role).not.toBe('god');
  });

  it('a directory address that names the instance owner signs nobody in', async () => {
    const login = await setUp();
    const res = await login(mallory);
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('POST /test refuses an anonymous caller (401) and a non-admin (403)', async () => {
    for (const [opts, status] of [[{ authed: false, admin: false }, 401], [{ authed: true, admin: false }, 403]] as const) {
      const { app } = await mountForTest(import.meta.dir, opts);
      const res = await app.request('/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: alice.uid, password: alice.password }),
      });
      expect(res.status).toBe(status);
    }
  });

  // A god's read reach is every firm, so the settings read without its tenant
  // filter answers with whichever firm's row comes first. Each firm points at a
  // different directory: only its own reaches the users.
  it('POST /test uses the directory of the firm the admin works in', async () => {
    const A = '00000000-0000-4000-8000-0000000d1a0a';
    const B = '00000000-0000-4000-8000-0000000d1a0b';
    const h = await godAcrossFirms(import.meta.dir, [A, B]);
    try {
      const pw = await (await import(join(ENGINE, 'lib/data/field-crypto.js'))).maybeEncrypt(SERVICE_PASSWORD, true);
      for (const [tenant, url] of [[A, directory.url], [B, 'ldap://127.0.0.1:1']]) {
        await h.pool.query(
          `INSERT INTO zvd_ldap_settings (tenant_id, scope, enabled, url, bind_dn, bind_password, search_base, tls_verify)
           VALUES ($1, 'tenant', true, $2, $3, $4, 'dc=test', false)`,
          [tenant, url, SERVICE_DN, pw],
        );
      }
      const test = async (tenant: string) =>
        (await (await h.asGod(tenant)).request('/test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username: alice.uid, password: alice.password }),
        })).json() as Promise<{ success: boolean }>;
      expect((await test(A)).success).toBe(true);
      expect((await test(B)).success).toBe(false);
    } finally {
      await h.pool.query(`DELETE FROM zvd_ldap_settings WHERE tenant_id = ANY($1)`, [[A, B]]);
      await h.done();
    }
  });
});
