/**
 * AES-256-GCM for AI provider API keys, performed by the host.
 *
 * This used to read `AI_KEY_ENCRYPTION_KEY` (falling back to
 * `MAIL_ENCRYPTION_KEY`) from the environment and do the crypto here. In-process
 * that meant the extension could reach the ENGINE's whole environment —
 * `DATABASE_URL`, `BETTER_AUTH_SECRET`, `FIELD_ENCRYPTION_KEY` — so it held the
 * `secrets` capability in practice while its manifest did not declare it, and
 * the capability gate had nothing to enforce.
 *
 * The host now holds the key, under the same `AI_KEY_ENCRYPTION_KEY`, on its own
 * `ai` keyring — so rotating it still does not touch field data or mail
 * passwords, which is the reason a separate key existed in the first place.
 *
 * The envelope changed from `aes256gcm:` to `aes256gcm-ai:`. The host picks the
 * decryption key from the envelope rather than from the caller's argument, and
 * two keyrings sharing one prefix would defeat that — an AI key would be handed
 * to the mail key and fail as though it were corrupt.
 */

// biome-ignore lint/suspicious/noExplicitAny: ctx.internals is engine-typed
type Internals = any;

let _internals: Internals | undefined;

/** Wired from `register()` before any route can run. */
export function setInternals(internals: Internals): void {
  _internals = internals;
}

function internals(): Internals {
  if (!_internals) {
    throw new Error(
      '[ai] host internals not wired — setInternals(ctx.internals) must run in register()',
    );
  }
  return _internals;
}

export async function encryptApiKey(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  return internals().encryptSecret(plaintext, { keyring: 'ai' });
}

export async function decryptApiKey(stored: string): Promise<string> {
  if (!stored) return '';
  // A provider row saved before this extension encrypted anything holds a bare
  // key. The host passes an unrecognised envelope through unchanged, so those
  // keep working instead of failing at the first chat request.
  return internals().decryptSecret(stored, { keyring: 'ai' });
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  // Both envelopes: rows written before the move to the host keyring carry the
  // old `aes256gcm:` prefix, and showing one of those as a partial key would put
  // ciphertext on screen where an administrator expects a masked secret.
  if (key.startsWith('aes256gcm:') || key.startsWith('aes256gcm-ai:')) return '***encrypted***';
  if (key.length <= 8) return '***';
  return `${key.slice(0, 4)}***${key.slice(-4)}`;
}
