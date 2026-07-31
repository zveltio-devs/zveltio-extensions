/**
 * AES-256-GCM for IMAP/SMTP passwords, performed by the host.
 *
 * This used to read `MAIL_ENCRYPTION_KEY` from the environment and do the
 * crypto here. In-process that meant the extension could reach the ENGINE's
 * whole environment — including `FIELD_ENCRYPTION_KEY` and
 * `BETTER_AUTH_SECRET` — and it had the `secrets` capability in practice
 * whether or not the manifest declared it.
 *
 * The host now holds the key and writes the same `aes256gcm:<iv>:<ct>` envelope
 * under the same `MAIL_ENCRYPTION_KEY`, so passwords already stored keep
 * decrypting and the separate mail key still does its job: rotating it does not
 * touch field data.
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
      '[mail] host internals not wired — setInternals(ctx.internals) must run in register()',
    );
  }
  return _internals;
}

export async function encryptPassword(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  return internals().encryptSecret(plaintext, { keyring: 'mail' });
}

export async function decryptPassword(stored: string): Promise<string> {
  if (!stored) return '';
  // Accounts configured before this extension encrypted anything hold a bare
  // password. The host passes an unrecognised envelope through unchanged, so
  // those keep working instead of failing at connect time.
  return internals().decryptSecret(stored, { keyring: 'mail' });
}
