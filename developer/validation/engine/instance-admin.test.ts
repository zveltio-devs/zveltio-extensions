/**
 * Every write here needs an INSTANCE admin, not a tenant admin.
 *
 * Rules are instance-wide schema metadata: every tenant's writes to the
 * collection answer to them. The routes were gated on
 * `checkPermission(user, 'admin', '*')`, which a tenant admin passes inside
 * their own tenant — so the admin of one firm stored rules that refused every
 * other firm's writes. Measured against the 1.1.1 bundle: `POST /rules` as the
 * harness's tenant admin answered 201 and the row landed.
 *
 * The allow path (an instance admin writes, through the engine) is the engine's
 * to prove: `validation-rules-instance-admin.test.ts` drives
 * `ctx.internals.writeValidationRule` behind the real `/ext/*` gate.
 */

import { beforeAll, describe, expect, it } from 'bun:test';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;
const COLL = `vria_${Date.now()}`;
const ID = '00000000-0000-4000-8000-00000000a1a1';
const rule = { field_name: 'code', rule_type: 'required', error_message: 'x' };

describe.skipIf(!DB_URL)('developer/validation: a tenant admin writes no rule', () => {
  let app: any;
  beforeAll(async () => {
    app = (await mountForTest(import.meta.dir, { admin: true })).app;
  });

  const send = (method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  it('refuses every write route, and nothing lands', async () => {
    const writes: Array<[string, string, unknown?]> = [
      ['POST', '/rules', { ...rule, collection: COLL }],
      ['PATCH', `/rules/${ID}`, { is_active: false }],
      ['DELETE', `/rules/${ID}`],
      ['POST', `/${COLL}`, rule],
      ['POST', `/${COLL}/import`, [rule]],
      ['PATCH', `/${COLL}/${ID}`, { is_active: false }],
      ['DELETE', `/${COLL}/${ID}`],
      [
        'POST',
        '/groups',
        { name: 'g', collection: COLL, field_name: 'code', rule_ids: [ID] },
      ],
      ['DELETE', `/groups/${ID}`],
      ['POST', '/generate', { description: 'not empty' }],
    ];
    for (const [method, path, body] of writes) {
      const res = await send(method, path, body);
      expect({ method, path, status: res.status }).toEqual({ method, path, status: 403 });
    }
    const pool = new Pool({ connectionString: DB_URL });
    try {
      const left = await pool.query('SELECT 1 FROM zv_validation_rules WHERE collection = $1', [
        COLL,
      ]);
      expect(left.rowCount).toBe(0);
    } finally {
      await pool.end();
    }
  });
});
