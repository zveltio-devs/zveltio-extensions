/**
 * Share-link password verification.
 *
 * Covers the argon2id path, the legacy unsalted-SHA-256 path that existing
 * links still carry, and the transparent upgrade that removes the weak digest
 * from the table on first successful use.
 */

import { describe, expect, it } from 'bun:test';
import { validateShareToken } from './sharing.js';

const FUTURE = new Date(Date.now() + 60 * 60 * 1000);

function legacySha256(pw: string): string {
  const h = new Bun.CryptoHasher('sha256');
  h.update(pw);
  return h.digest('hex');
}

/**
 * Minimal Kysely-shaped stub: `selectFrom(...)` chains resolve to a fixed row,
 * `updateTable(...)` records the values it was asked to write.
 */
function makeDb(share: Record<string, unknown>) {
  const updates: Record<string, unknown>[] = [];
  const chain = (result: unknown) => {
    const c: Record<string, unknown> = {};
    for (const m of ['select', 'selectAll', 'where', 'set', 'returning', 'returningAll']) {
      c[m] = () => c;
    }
    c.executeTakeFirst = async () => result;
    c.execute = async () => (result === undefined ? [] : [result]);
    return c;
  };
  const db = {
    selectFrom: (table: string) => {
      // Only the share row matters here; file/folder lookups return "not found",
      // which validateShareToken reports separately from a password failure.
      if (table === 'zv_media_shares') return chain(share);
      return chain(undefined);
    },
    updateTable: () => {
      const c = chain(undefined) as Record<string, unknown>;
      c.set = (vals: Record<string, unknown>) => {
        updates.push(vals);
        return c;
      };
      return c;
    },
  };
  return { db, updates };
}

describe('validateShareToken — password handling', () => {
  it('accepts the correct password against an argon2id hash', async () => {
    const hash = await Bun.password.hash('correct horse');
    const { db } = makeDb({ id: 's1', password_hash: hash, is_active: true, expires_at: FUTURE });

    const res = await validateShareToken(db as never, 'tok', 'correct horse');
    expect(res.error).not.toBe('Invalid password');
  });

  it('rejects a wrong password against an argon2id hash', async () => {
    const hash = await Bun.password.hash('correct horse');
    const { db } = makeDb({ id: 's1', password_hash: hash, is_active: true, expires_at: FUTURE });

    const res = await validateShareToken(db as never, 'tok', 'wrong horse');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Invalid password');
  });

  it('still accepts a legacy unsalted SHA-256 hash', async () => {
    const { db } = makeDb({
      id: 's1',
      password_hash: legacySha256('legacy pw'),
      is_active: true,
      expires_at: FUTURE,
    });

    const res = await validateShareToken(db as never, 'tok', 'legacy pw');
    expect(res.error).not.toBe('Invalid password');
  });

  it('rejects a wrong password against a legacy hash', async () => {
    const { db } = makeDb({
      id: 's1',
      password_hash: legacySha256('legacy pw'),
      is_active: true,
      expires_at: FUTURE,
    });

    const res = await validateShareToken(db as never, 'tok', 'nope');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Invalid password');
  });

  it('upgrades a legacy hash to argon2id on first successful use', async () => {
    const { db, updates } = makeDb({
      id: 's1',
      password_hash: legacySha256('legacy pw'),
      is_active: true,
      expires_at: FUTURE,
    });

    await validateShareToken(db as never, 'tok', 'legacy pw');

    expect(updates).toHaveLength(1);
    const written = updates[0].password_hash as string;
    expect(written.startsWith('$argon2')).toBe(true);
    expect(await Bun.password.verify('legacy pw', written)).toBe(true);
  });

  it('does not rewrite the hash when the legacy password is wrong', async () => {
    const { db, updates } = makeDb({
      id: 's1',
      password_hash: legacySha256('legacy pw'),
      is_active: true,
      expires_at: FUTURE,
    });

    await validateShareToken(db as never, 'tok', 'nope');
    expect(updates).toHaveLength(0);
  });

  it('requires a password when the share has one', async () => {
    const hash = await Bun.password.hash('pw');
    const { db } = makeDb({ id: 's1', password_hash: hash, is_active: true, expires_at: FUTURE });

    const res = await validateShareToken(db as never, 'tok');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Password required');
  });
});
