// The OAuth2 flow, end to end, including the IMAP handshake it exists for.
//
// The audit: "OAuth2 for Gmail/Outlook is schema and config only — no flow
// exists." The columns and the settings knobs have been in place since 001, and
// `imap-operations.ts` even authenticates with XOAUTH2 when it finds a token —
// a consumer waiting for a producer nobody wrote. Filling in a client id and
// secret did nothing at all.
//
// Both halves are exercised against real servers rather than mocked out:
//   * a token endpoint on Bun.serve, so the code exchange and the refresh are
//     real HTTP with real form encoding
//   * hoodiecrow with its `xoauth2` plugin, so the access token this flow
//     produces is actually presented to an IMAP server and accepted
//
// Endpoints are read from mail settings — which is what makes this testable, and
// is also what an install behind an enterprise identity proxy needs.
import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import hoodiecrow from 'hoodiecrow-imap';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;
const IMAP_PORT = 4021;
const OAUTH_PORT = 4022;
const ACCESS_TOKEN = 'test-access-token-aaa';
const REFRESHED_TOKEN = 'test-access-token-bbb';

const d = DB_URL ? describe : describe.skip;

d('mail: OAuth2 connect flow', () => {
  let imap: any;
  let oauth: any;
  let pool: any;
  let app: any;
  let accountId: string;
  /** Every form body the token endpoint received, so the test can assert shape. */
  const tokenCalls: Array<Record<string, string>> = [];

  beforeAll(async () => {
    imap = hoodiecrow({
      plugins: [
        'ID',
        'SASL-IR',
        'AUTH-PLAIN',
        'XOAUTH2',
        'NAMESPACE',
        'ENABLE',
        'LITERALPLUS',
        'SPECIAL-USE',
      ],
      id: { name: 'hoodiecrow', version: '1.0.0' },
      // hoodiecrow validates XOAUTH2 against server.users[u].xoauth2.accessToken,
      // so the token has to live here — not under a top-level `xoauth2` key,
      // which it ignores. Supplying `users` replaces the default testuser.
      users: {
        'oauth@example.test': {
          password: 'unused',
          xoauth2: { accessToken: ACCESS_TOKEN, sessionTimeout: 3600 * 1000 },
        },
      },
      storage: {
        INBOX: {
          messages: [
            { raw: 'From: a@example.test\r\nTo: oauth@example.test\r\nSubject: Hi\r\n\r\nx' },
          ],
        },
      },
    });
    await new Promise<void>((res) => imap.listen(IMAP_PORT, () => res()));

    oauth = Bun.serve({
      port: OAUTH_PORT,
      async fetch(req) {
        const form = Object.fromEntries(new URLSearchParams(await req.text()));
        tokenCalls.push(form as Record<string, string>);
        if (form.grant_type === 'authorization_code') {
          if (form.code !== 'good-code') {
            return Response.json({ error: 'invalid_grant' }, { status: 400 });
          }
          return Response.json({
            access_token: ACCESS_TOKEN,
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
          });
        }
        // A refresh, and deliberately WITHOUT a refresh_token in the response —
        // which is what Google and Microsoft normally do, and means "keep the
        // one you have".
        return Response.json({ access_token: REFRESHED_TOKEN, expires_in: 3600 });
      },
    });

    app = (await mountForTest(import.meta.dir)).app;

    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });

    await pool.query(
      `INSERT INTO zv_settings (key, value) VALUES ('mail', $1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [
        JSON.stringify({
          oauth2_gmail_client_id: 'client-abc',
          oauth2_gmail_client_secret: 'secret-xyz',
          oauth2_gmail_token_url: `http://127.0.0.1:${OAUTH_PORT}/token`,
          oauth2_gmail_authorize_url: 'https://accounts.example.test/authorize',
        }),
      ],
    );

    const acc = await pool.query(
      `INSERT INTO zv_mail_accounts
         (user_id, name, email_address, imap_host, imap_port, imap_secure, imap_user, imap_password, smtp_host)
       VALUES ($1,'oauth','oauth@example.test','127.0.0.1',$2,false,'oauth@example.test','unused','smtp.example.test')
       RETURNING id`,
      [HARNESS_USER, IMAP_PORT],
    );
    accountId = acc.rows[0].id;
  });

  afterAll(async () => {
    if (pool) {
      await pool
        .query(`DELETE FROM zv_mail_accounts WHERE id = $1`, [accountId])
        .catch(() => undefined);
      await pool.end().catch(() => undefined);
    }
    oauth?.stop?.();
    await new Promise<void>((res) => (imap ? imap.close(() => res()) : res()));
  });

  const authorize = async () => {
    const res = await app.request(`/accounts/${accountId}/oauth/gmail/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirect_uri: 'https://zveltio.test/oauth/cb' }),
    });
    return {
      res,
      body: (await res.json()) as { authorize_url?: string; state?: string; error?: string },
    };
  };

  it('builds an authorize URL carrying state, offline access, and the account as login hint', async () => {
    const { res, body } = await authorize();
    expect(res.status).toBe(200);
    const u = new URL(body.authorize_url!);
    expect(u.origin + u.pathname).toBe('https://accounts.example.test/authorize');
    expect(u.searchParams.get('client_id')).toBe('client-abc');
    expect(u.searchParams.get('state')).toBe(body.state);
    expect(u.searchParams.get('login_hint')).toBe('oauth@example.test');
    // Without these Google issues no refresh token, and the connection dies an
    // hour after setup looking like a credential problem.
    expect(u.searchParams.get('access_type')).toBe('offline');
    expect(u.searchParams.get('prompt')).toBe('consent');
  });

  it('refuses a callback whose state it did not issue', async () => {
    const res = await app.request('/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'forged-state', code: 'good-code' }),
    });
    expect(res.status).toBe(400);
  });

  it('exchanges the code and stores the tokens', async () => {
    const { body } = await authorize();
    const res = await app.request('/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: body.state, code: 'good-code' }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).renewable).toBe(true);

    // Read the columns, not the response — they are the thing the flow exists to
    // populate and were empty on every install until now.
    const row = await pool.query(
      `SELECT oauth2_provider, oauth2_access_token, oauth2_refresh_token, oauth2_expires_at
       FROM zv_mail_accounts WHERE id = $1`,
      [accountId],
    );
    expect(row.rows[0].oauth2_provider).toBe('gmail');
    expect(row.rows[0].oauth2_access_token).toBe(ACCESS_TOKEN);
    expect(row.rows[0].oauth2_refresh_token).toBe('test-refresh-token');
    expect(row.rows[0].oauth2_expires_at).not.toBeNull();
  });

  it('will not accept the same state twice', async () => {
    const { body } = await authorize();
    const first = await app.request('/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: body.state, code: 'good-code' }),
    });
    expect(first.status).toBe(200);
    // A replayed redirect must find nothing.
    const second = await app.request('/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: body.state, code: 'good-code' }),
    });
    expect(second.status).toBe(400);
  });

  it('the stored token actually authenticates against IMAP', async () => {
    // The assertion the whole feature is for. hoodiecrow accepts XOAUTH2 only
    // for the exact token configured above, so a sync that succeeds proves the
    // token travelled from the exchange, through the database, into the SASL
    // handshake.
    const res = await app.request(`/accounts/${accountId}/sync`, { method: 'POST' });
    expect(res.status).toBe(200);
    const out = (await res.json()) as { synced: number; errors: string[] };
    expect(out.errors).toEqual([]);
    expect(out.synced).toBe(1);
  });

  it('refreshes an expired token, and keeps the refresh token the provider omitted', async () => {
    await pool.query(
      `UPDATE zv_mail_accounts SET oauth2_expires_at = NOW() - INTERVAL '1 hour' WHERE id = $1`,
      [accountId],
    );
    // hoodiecrow only knows ACCESS_TOKEN, so this sync must fail to authenticate
    // — which is exactly what proves the refresh RAN and swapped the token.
    await app.request(`/accounts/${accountId}/sync`, { method: 'POST' });

    const row = await pool.query(
      `SELECT oauth2_access_token, oauth2_refresh_token FROM zv_mail_accounts WHERE id = $1`,
      [accountId],
    );
    expect(row.rows[0].oauth2_access_token).toBe(REFRESHED_TOKEN);
    // The response carried no refresh_token. Overwriting with null here is how
    // an account silently becomes unrenewable.
    expect(row.rows[0].oauth2_refresh_token).toBe('test-refresh-token');
    expect(tokenCalls.some((f) => f.grant_type === 'refresh_token')).toBe(true);
  });
});
