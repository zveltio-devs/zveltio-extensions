// A locale code and a translation key name the OWN firm's row.
//
// `zvd_locales` is keyed (tenant_id, code) and `zvd_translation_keys.key` is
// unique per tenant (migrations 003/004), but the handlers matched on code, key
// or `is_default` alone. The row policy admits the caller's READ REACH, every
// firm for a god, so a god making a locale default in firm A cleared every
// firm's default, deleting `xx` deleted every firm's `xx` (and its translations
// by cascade), a key another firm had answered 409, and the public lookup of a
// god's request mixed every firm's values — then cached that for the firm.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms } from '../../../testing/ext-harness';

const A = '00000000-0000-4000-8000-0000000118aa';
const B = '00000000-0000-4000-8000-0000000118ab';

describe.skipIf(!process.env.TEST_DATABASE_URL)('i18n: locales and keys are the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;
  const q = async (text: string) => (await h.pool.query(text, [[A, B]])).rows;
  const post = async (tenant: string, path: string, body: unknown) =>
    (await h.asGod(tenant)).request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    for (const [id, tag] of [[A, 'A'], [B, 'B']]) {
      await h.pool.query(
        `INSERT INTO zvd_locales (tenant_id, code, name, is_default)
         VALUES ($1, 'q1', 'Q1', true), ($1, 'q2', 'Q2', false), ($1, 'q3', 'Q3', false)`,
        [id],
      );
      const k = await h.pool.query(
        `INSERT INTO zvd_translation_keys (tenant_id, key) VALUES ($1, 'q.shared') RETURNING id`,
        [id],
      );
      await h.pool.query(
        `INSERT INTO zvd_translations (tenant_id, key_id, locale, value) VALUES ($1, $2, 'q3', $3)`,
        [id, k.rows[0].id, tag],
      );
    }
    await h.pool.query(`INSERT INTO zvd_translation_keys (tenant_id, key) VALUES ($1, 'q.only.b')`, [B]);
  });

  afterAll(async () => {
    for (const t of ['zvd_translations', 'zvd_translation_keys', 'zvd_locales']) {
      await h.pool.query(`DELETE FROM ${t} WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    }
    await h.done();
  });

  it('making a locale default clears the own firm’s default only', async () => {
    expect((await post(A, '/locales', { code: 'q4', name: 'Q4', is_default: true })).status).toBe(201);
    expect(
      await q(`SELECT tenant_id::text AS t, code FROM zvd_locales
                WHERE tenant_id = ANY($1) AND is_default ORDER BY 1`),
    ).toEqual([
      { t: A, code: 'q4' },
      { t: B, code: 'q1' },
    ]);
  });

  it('deleting a locale removes the own firm’s only', async () => {
    expect((await (await h.asGod(A)).request('/locales/q2', { method: 'DELETE' })).status).toBe(200);
    expect(
      await q(`SELECT tenant_id::text AS t FROM zvd_locales WHERE tenant_id = ANY($1) AND code = 'q2'`),
    ).toEqual([{ t: B }]);
  });

  it('a key only another firm has is created in the own firm', async () => {
    expect((await post(A, '/', { key: 'q.only.b' })).status).toBe(201);
    expect((await post(A, '/', { key: 'q.only.b' })).status).toBe(409);
  });

  // Both firms: which duplicate wins the map depends on row order.
  it('the public lookup serves the own firm’s value', async () => {
    for (const [tenant, tag] of [[A, 'A'], [B, 'B']] as const) {
      const res = await (await h.asGod(tenant)).request('/public/q3');
      expect(res.status).toBe(200);
      expect(((await res.json()) as any).translations['q.shared']).toBe(tag);
    }
  });

  // By id: another firm's key is not found, so no translation is written under
  // the own tenant against it, and its translations are neither approved nor deleted.
  it('another firm’s key id is not found', async () => {
    const [{ id }] = await q(`SELECT id FROM zvd_translation_keys WHERE tenant_id = ANY($1) AND key = 'q.only.b'
                               AND tenant_id::text = '${B}'`);
    const god = await h.asGod(A);
    expect((await god.request(`/${id}`)).status).toBe(404);
    const put = await god.request(`/${id}/q3`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: 'from A' }),
    });
    expect(put.status).toBe(404);
    const [{ id: bShared }] = await q(`SELECT id FROM zvd_translation_keys WHERE tenant_id = ANY($1)
                                         AND key = 'q.shared' AND tenant_id::text = '${B}'`);
    expect((await god.request(`/${bShared}/q3/approve`, { method: 'POST' })).status).toBe(404);
    expect((await god.request(`/${bShared}/q3`, { method: 'DELETE' })).status).toBe(200);
    expect((await god.request(`/${id}`, { method: 'DELETE' })).status).toBe(200);
    expect(
      await q(`SELECT tk.tenant_id::text AS t, count(t.id)::int AS n FROM zvd_translation_keys tk
                LEFT JOIN zvd_translations t ON t.key_id = tk.id
                WHERE tk.tenant_id = ANY($1) AND tk.id IN ('${id}', '${bShared}') GROUP BY 1`),
    ).toEqual([{ t: B, n: 1 }]);
  });
});
