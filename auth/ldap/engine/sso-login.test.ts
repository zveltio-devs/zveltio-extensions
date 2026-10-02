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
// The harness runs no request transaction, so the users already have accounts
// (as after SCIM, or an earlier login); first-login provisioning inside the
// request transaction is the engine's harness (`sso-session.test.ts`).
import { afterAll, describe, expect, it } from 'bun:test';
// @ts-ignore — asn1 ships no types; it is ldapts' own BER codec.
import { Ber, BerReader, BerWriter } from 'asn1';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { engineSession, mountForTest } from '../../../testing/ext-harness';

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
  const directory = startDirectory([alice, bob]);
  afterAll(async () => {
    directory.stop();
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
    const { app } = await mountForTest(import.meta.dir);
    const cfg = await app.request('/config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        enabled: true,
        url: directory.url,
        bindDN: SERVICE_DN,
        bindPassword: SERVICE_PASSWORD,
        searchBase: 'dc=test',
        tlsVerify: false,
      }),
    });
    expect(cfg.status).toBe(200);
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
    // The audit row's metadata is a JSON object, not a string holding the JSON
    // (a single `::jsonb` cast under Bun.SQL; run with EXT_HARNESS_DRIVER=bun).
    const shape = await sql<{ t: string }>`
      SELECT jsonb_typeof(metadata) AS t FROM zv_audit_log
       WHERE event_type = 'auth.login_success' AND user_id = ${id}
    `.execute(db);
    expect(shape.rows.length).toBeGreaterThan(0);
    for (const r of shape.rows) expect(r.t).toBe('object');
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
});
