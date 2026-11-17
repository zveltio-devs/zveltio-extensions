// Members of one tenant against a REAL engine (`onEngine`), with the operator
// setup the README documents (ADR 0058 decision 3): the row rule
// `tenant_member: created_by eq user_id` on the consents and the subject
// requests, and the default grants on `gdpr_request_decisions` revoked. What only
// the real chain can show: a member neither reads nor withdraws another member's
// consent, no member decides a request, a tenant admin (the DPO) does, and the
// Art. 15 export holds the caller's own rows.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { onEngine } from '../../../testing/ext-harness';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const ENGINE = join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src');
const OWN = ['gdpr_consent_records', 'gdpr_subject_requests'];
/** The default grants on the decisions, which the README has the operator revoke. */
const DECIDE = [
  ['tenant_member', 'read'],
  ['tenant_member', 'create'],
  ['tenant_member', 'update'],
  ['tenant_member', 'execute'],
  ['tenant_viewer', 'read'],
];

d('compliance/gdpr — one member cannot act on another member’s records', () => {
  let e: Awaited<ReturnType<typeof onEngine>>;
  let god = '';
  const ruleIds: string[] = [];
  const s = { a: { cookie: '', userId: '' }, b: { cookie: '', userId: '' }, dpo: { cookie: '', userId: '' } };

  const run = (action: string, body: unknown, cookie: string) =>
    e.app.request(`/ext/compliance/gdpr/actions/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(body),
    });
  const result = async (res: Response) => ((await res.json()) as { result: Any }).result;
  const ids = async (collection: string, cookie: string) =>
    ((await (await e.engineApp.request(`/api/data/${collection}`, { headers: { cookie } })).json()) as Any).records.map(
      (r: Any) => r.id,
    );
  const consent = async (id: string) =>
    (await e.sql`SELECT granted, withdrawn_at FROM zvd_gdpr_consent_records WHERE id = ${id}`.execute(e.db)).rows[0];
  const status = async (id: string) =>
    (await e.sql`SELECT status FROM zvd_gdpr_subject_requests WHERE id = ${id}`.execute(e.db)).rows[0].status;

  beforeAll(async () => {
    e = await onEngine(import.meta.dir);
    const { grantTenantMembership } = (await import(join(ENGINE, 'lib', 'identity.js'))) as Any;
    const { DEFAULT_TENANT_ID } = (await import(join(ENGINE, 'lib', 'tenancy', 'tenant-manager.js'))) as Any;
    const member = async (grade: 'member' | 'admin') => {
      const u = await e.harness.createMemberSession(e.engineApp, e.db, { grants: [] });
      await grantTenantMembership(e.db, { id: DEFAULT_TENANT_ID, slug: null }, u.userId, grade, { reopen: true });
      return u;
    };
    s.a = await member('member');
    s.b = await member('member');
    s.dpo = await member('admin');
    // The README's operator steps, as written there.
    god = await e.harness.createGodSession(e.engineApp, e.db);
    const admin = (method: string, path: string, body: unknown) =>
      e.engineApp.request(path, {
        method,
        headers: { 'content-type': 'application/json', cookie: god },
        body: JSON.stringify(body),
      });
    for (const [subject, action] of DECIDE) {
      const res = await admin('DELETE', '/api/permissions/policies', {
        subject,
        resource: 'gdpr_request_decisions',
        action,
      });
      expect(res.status).toBe(200);
    }
    for (const collection of OWN) {
      const res = await admin('POST', '/api/admin/rls', {
        collection,
        role: 'tenant_member',
        filter_field: 'created_by',
        filter_op: 'eq',
        filter_value_source: 'user_id',
      });
      expect(res.status).toBe(201);
      ruleIds.push(((await res.json()) as Any).policy.id);
    }
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    for (const id of ruleIds) {
      await e.engineApp.request(`/api/admin/rls/${id}`, { method: 'DELETE', headers: { cookie: god } });
    }
    await e.done();
  });

  it('a member neither reads nor withdraws another member’s consent; their own, yes', async () => {
    const mine = await result(await run('giveConsent', { purpose: 'newsletter', granted: true }, s.a.cookie));
    expect(mine.created_by).toBe(s.a.userId);
    await run('giveConsent', { purpose: 'profiling', granted: true }, s.b.cookie);

    expect(await ids('gdpr_consent_records', s.b.cookie)).not.toContain(mine.id);
    const res = await run('withdrawConsent', { id: mine.id }, s.b.cookie);
    expect(res.status).toBe(404);
    expect((await consent(mine.id)).withdrawn_at).toBeNull();

    expect((await run('withdrawConsent', { id: mine.id }, s.a.cookie)).status).toBe(200);
    expect(await consent(mine.id)).toMatchObject({ granted: false });
  });

  it('no member decides a request, their own included; the DPO decides any', async () => {
    const req = await result(await run('submitRequest', { request_type: 'erasure' }, s.a.cookie));
    expect(await ids('gdpr_subject_requests', s.b.cookie)).not.toContain(req.id);
    expect(await ids('gdpr_subject_requests', s.a.cookie)).toContain(req.id);

    expect((await run('setRequestStatus', { id: req.id, status: 'completed' }, s.b.cookie)).status).toBe(403);
    expect((await run('setRequestStatus', { id: req.id, status: 'rejected' }, s.a.cookie)).status).toBe(403);
    expect(await status(req.id)).toBe('pending');

    const done = await run('setRequestStatus', { id: req.id, status: 'completed', notes: 'erased' }, s.dpo.cookie);
    expect(done.status).toBe(200);
    expect(await status(req.id)).toBe('completed');
    const decisions = await e.sql`SELECT created_by, to_status FROM zvd_gdpr_request_decisions
                                   WHERE request_id = ${req.id}`.execute(e.db);
    expect(decisions.rows).toEqual([{ created_by: s.dpo.userId, to_status: 'completed' }]);
  });

  it('the Art. 15 export holds the caller’s own consents and requests, no one else’s', async () => {
    const theirs = await result(await run('giveConsent', { purpose: 'theirs', granted: true }, s.b.cookie));
    const theirReq = await result(await run('submitRequest', { request_type: 'access' }, s.b.cookie));
    // The DPO reads every member's rows; their export is still only their own.
    for (const who of [s.a, s.dpo]) {
      const res = await e.app.request('/ext/compliance/gdpr/export-my-data', { headers: { cookie: who.cookie } });
      expect(res.status).toBe(200);
      const body = (await res.json()) as Any;
      expect(body.profile.id).toBe(who.userId);
      for (const row of [...body.consents, ...body.subject_requests]) expect(row.created_by).toBe(who.userId);
      expect(body.consents.map((r: Any) => r.id)).not.toContain(theirs.id);
      expect(body.subject_requests.map((r: Any) => r.id)).not.toContain(theirReq.id);
    }
    const res = await e.app.request('/ext/compliance/gdpr/export-my-data', { headers: { cookie: s.a.cookie } });
    const body = (await res.json()) as Any;
    expect(body.consents.map((r: Any) => r.purpose).sort()).toEqual(['newsletter']);
    expect(body.subject_requests.map((r: Any) => r.request_type)).toEqual(['erasure']);
  });
});
