import { describe, expect, it, spyOn } from 'bun:test';
import { CannedDb } from '../../../../zveltio/packages/engine/src/tests/unit/fixtures/canned-db.js';
import {
  generateIncomingWebhookSecret,
  repairUnsignedIncomingWebhooksAtLoad,
} from './incoming-webhooks.js';

describe('generateIncomingWebhookSecret', () => {
  it('returns a 64-char hex string', () => {
    const s = generateIncomingWebhookSecret();
    expect(s).toMatch(/^[0-9a-f]{64}$/);
    expect(generateIncomingWebhookSecret()).not.toBe(s);
  });
});

describe('repairUnsignedIncomingWebhooksAtLoad', () => {
  it('generates secrets for unsigned rows', async () => {
    const db = new CannedDb();
    db.when(/from zvd_incoming_webhooks/i, [{ id: 'w1', name: 'stripe-hook' }]);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(await repairUnsignedIncomingWebhooksAtLoad(db.kysely)).toBe(1);
      expect(warn.mock.calls.some((c) => String(c[0]).includes('stripe-hook'))).toBe(true);
    } finally {
      warn.mockRestore();
    }
    expect(db.executed(/update zvd_incoming_webhooks/i)).toHaveLength(1);
  });

  it('does nothing when every webhook is signed', async () => {
    const db = new CannedDb();
    db.when(/from zvd_incoming_webhooks/i, []);
    expect(await repairUnsignedIncomingWebhooksAtLoad(db.kysely)).toBe(0);
    expect(db.executed(/update zvd_incoming_webhooks/i)).toHaveLength(0);
  });

  it('does not throw when the table is missing', async () => {
    const db = new CannedDb();
    db.fail(/from zvd_incoming_webhooks/i, new Error('relation "zvd_incoming_webhooks" does not exist'));
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(await repairUnsignedIncomingWebhooksAtLoad(db.kysely)).toBe(0);
    } finally {
      warn.mockRestore();
    }
  });
});
