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

/** Stands in for `ctx.internals.maybeEncrypt`, which tags rather than encrypts. */
const encrypt = async (v: unknown) => `enc:v1:${String(v)}`;

/** A host with no FIELD_ENCRYPTION_KEY: the engine helper throws rather than
 *  writing a sensitive value in clear. */
const refuseToEncrypt = async () => {
  throw new Error('FIELD_ENCRYPTION_KEY is not set');
};

describe('repairUnsignedIncomingWebhooksAtLoad', () => {
  it('generates secrets for unsigned rows', async () => {
    const db = new CannedDb();
    db.when(/from zvd_incoming_webhooks/i, [{ id: 'w1', name: 'stripe-hook' }]);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(await repairUnsignedIncomingWebhooksAtLoad(db.kysely, encrypt)).toBe(1);
      expect(warn.mock.calls.some((c) => String(c[0]).includes('stripe-hook'))).toBe(true);
      // Written encrypted, not in clear. A signing secret readable from the
      // database lets anyone with read access forge deliveries, which is the
      // whole property the signature is supposed to provide.
      const [update] = db.executed(/update zvd_incoming_webhooks/i);
      expect(String(update?.parameters?.[0])).toStartWith('enc:v1:');
    } finally {
      warn.mockRestore();
    }
    expect(db.executed(/update zvd_incoming_webhooks/i)).toHaveLength(1);
  });

  it('does nothing when every webhook is signed', async () => {
    const db = new CannedDb();
    db.when(/from zvd_incoming_webhooks/i, []);
    expect(await repairUnsignedIncomingWebhooksAtLoad(db.kysely, encrypt)).toBe(0);
    expect(db.executed(/update zvd_incoming_webhooks/i)).toHaveLength(0);
  });

  it('does not throw when the table is missing', async () => {
    const db = new CannedDb();
    db.fail(/from zvd_incoming_webhooks/i, new Error('relation "zvd_incoming_webhooks" does not exist'));
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(await repairUnsignedIncomingWebhooksAtLoad(db.kysely, encrypt)).toBe(0);
    } finally {
      warn.mockRestore();
    }
  });

  it('writes nothing, and says why, when there is no key to encrypt with', async () => {
    const db = new CannedDb();
    db.when(/from zvd_incoming_webhooks/i, [{ id: 'w1', name: 'stripe-hook' }]);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(await repairUnsignedIncomingWebhooksAtLoad(db.kysely, refuseToEncrypt)).toBe(0);
      // The message has to name the consequence. "could not repair" reads as a
      // hiccup; these webhooks are still accepting anything anyone sends.
      expect(
        warn.mock.calls.some((c) => /keep accepting unauthenticated/.test(String(c[0]))),
      ).toBe(true);
    } finally {
      warn.mockRestore();
    }
    // And crucially: no row written in clear as a fallback.
    expect(db.executed(/update zvd_incoming_webhooks/i)).toHaveLength(0);
  });
});
