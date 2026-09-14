/**
 * `POST /recurrence/trigger` gated on `session.user.role === 'admin'`.
 * `"user".role` is a Better-Auth column with `user_role_check CHECK (role =
 * ANY (ARRAY['god', 'member']))` — `'admin'` is not a legal value, so that
 * comparison was always false. The route refused every caller, including a
 * real platform `god` session, from the day it was written: recurring
 * checklists could never be triggered by anyone.
 *
 * Fixed to the repository's own idiom for this check —
 * `checkPermission(uid, 'admin', '*')` — the same call `analytics/quality`,
 * `developer/validation` and `content/documents` use for the identical
 * "Admin access required" gate.
 */

import { describe, it, expect } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!DB_URL)('workflow/checklists: POST /recurrence/trigger admin gate', () => {
  it('a platform admin session is allowed through the gate', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/recurrence/trigger', { method: 'POST' });
    // Before the fix this was 403 "Admin access required" for EVERY caller,
    // admin included — `session.user.role` can never equal `'admin'`.
    expect(res.status).not.toBe(403);
  });

  it('a non-admin session is still refused', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/recurrence/trigger', { method: 'POST' });
    expect(res.status).toBe(403);
  });
});
