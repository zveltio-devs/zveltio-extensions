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

// Engine migration 079 stores the token's digest; a lookup by the raw token finds
// nothing, and one that matched the stored value as given would let the digest
// itself — readable by the request role — open the link.
describe('validateShareToken — token lookup', () => {
  it('looks a link up by the digest of the token it is given', async () => {
    const asked: unknown[] = [];
    const { db } = makeDb({ id: 's1', is_active: true, password_hash: null });
    const select = db.selectFrom;
    db.selectFrom = (table: string) => {
      const c = select(table) as Record<string, unknown>;
      const where = c.where as () => unknown;
      c.where = (col: string, _op: string, v: unknown) => {
        if (table === 'zv_media_shares' && col === 'token') asked.push(v);
        return where();
      };
      return c;
    };
    await validateShareToken(db as never, 'tok');
    // What 079's trigger stores for 'tok':
    // 'sha256:' || encode(sha256(convert_to('tok', 'UTF8')), 'hex')
    expect(asked).toEqual([
      'sha256:1a7674eb4ee78df7e1ac439a93c3fa8e3c945784d4dec9fd8e3011738b2f1d62',
    ]);
  });
});
