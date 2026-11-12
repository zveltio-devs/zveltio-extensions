// Twilio's status callback on the engine (ADR 0039): the packed bundle loaded by
// `finalizeExtensionLoad`, behind the engine's own `/ext/*` chain. The route is
// the manifest's declared one: public for POST, answered without a session; the
// tenant is the request's subdomain, and the settings it reads as the system are
// that tenant's only; the report is queued as `deliveryStatus` in that tenant.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { createHmac } from 'node:crypto';
import { join } from 'node:path';
import { onEngine } from '../../testing/ext-harness';

const ENGINE = join(import.meta.dir, '../../../zveltio/packages/engine/src');

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET && process.env.FIELD_ENCRYPTION_KEY
    ? describe
    : describe.skip;

d('sms — the Twilio status callback is a declared public route', () => {
  const tag = `${Date.now()}${Math.floor(Math.random() * 1e4)}`;
  const firm = (k: string) => ({ id: crypto.randomUUID(), slug: `sms-${k}-${tag}` });
  const A = firm('a');
  const B = firm('b');
  const sid = `SM${tag}`;
  let e: Awaited<ReturnType<typeof onEngine>>;

  const url = (slug: string) => `http://${slug}.sms.test/ext/sms/webhook/twilio`;
  const params = { MessageSid: sid, MessageStatus: 'delivered', AccountSid: 'AC1' };
  const sign = (token: string, slug: string) =>
    createHmac('sha1', token)
      .update(url(slug) + Object.keys(params).sort().map((k) => k + params[k as keyof typeof params]).join(''))
      .digest('base64');
  const post = (slug: string, signature: string, method = 'POST') =>
    e.app.request(url(slug), {
      method,
      headers: { host: `${slug}.sms.test`, 'x-twilio-signature': signature },
      ...(method === 'POST' ? { body: new URLSearchParams(params) } : {}),
    });
  const queued = async () =>
    (
      await e.sql`SELECT data->'input' AS input FROM pgboss.job
                   WHERE name = 'ext.sms.deliveryStatus' AND data->'input'->>'sid' = ${sid}`.execute(e.db)
    ).rows.map((r: { input: unknown }) => r.input);

  beforeAll(async () => {
    e = await onEngine(import.meta.dir);
    const { encryptField } = await import(join(ENGINE, 'lib/data/field-crypto.js'));
    for (const t of [A, B]) {
      await e.sql`INSERT INTO zv_tenants (id, slug, name, status) VALUES (${t.id}::uuid, ${t.slug}, ${t.slug}, 'active')`.execute(e.db);
      const token = await encryptField(`tok-${t.slug}`);
      await e.harness.asTenant(e.db, t.id, (trx: any) =>
        e.sql`INSERT INTO zvd_sms_settings (tenant_id, scope, twilio_auth_token)
              VALUES (${t.id}::uuid, 'tenant', ${token})`.execute(trx),
      );
    }
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    await e.sql`DELETE FROM pgboss.job WHERE name = 'ext.sms.deliveryStatus' AND data->'input'->>'sid' = ${sid}`.execute(e.db);
    await e.done();
    await e.sql`DELETE FROM zv_tenants WHERE id IN (${A.id}::uuid, ${B.id}::uuid)`.execute(e.db);
  });

  it("queues the report signed with the request tenant's token, without a session", async () => {
    const res = await post(A.slug, sign(`tok-${A.slug}`, A.slug));
    expect([res.status, await res.json()]).toEqual([200, { received: true }]);
    expect(await queued()).toEqual([{ sid, status: 'delivered' }]);
  });

  it("refuses another tenant's token: the settings read are the request tenant's only", async () => {
    const res = await post(B.slug, sign(`tok-${A.slug}`, B.slug));
    expect(res.status).toBe(403);
    expect(await queued()).toHaveLength(1);
  });

  it('opens no other method of the path', async () => {
    expect((await post(A.slug, sign(`tok-${A.slug}`, A.slug), 'GET')).status).toBe(401);
  });
});
