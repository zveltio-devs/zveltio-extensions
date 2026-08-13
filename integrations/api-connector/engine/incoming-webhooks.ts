import { sql } from 'kysely';

/** 256-bit hex secret for incoming webhook HMAC verification. */
export function generateIncomingWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Backfill signing secrets for incoming webhooks created before auto-generation.
 *
 * Rows without a secret accepted any payload from anyone who knew the path;
 * this closes that gap at extension load.
 *
 * The generated secret is encrypted with the host's field encryption, the same
 * as the create path and the same as the engine's outbound webhooks: the value
 * is what separates a genuine delivery from a forged one, so writing it in
 * clear would leave anyone with database read access able to forge deliveries.
 *
 * `encrypt` is passed in rather than imported because it lives on
 * `ctx.internals`, and this runs at extension load where the context is in
 * hand.
 */
export async function repairUnsignedIncomingWebhooksAtLoad(
  db: {
    // biome-ignore lint/suspicious/noExplicitAny: extension db handle is Kysely-shaped
    executeQuery: (query: any) => Promise<{ rows: unknown[] }>;
  },
  encrypt: (value: unknown, isEncrypted: boolean) => Promise<unknown>,
): Promise<number> {
  try {
    const { rows } = await sql<{ id: string; name: string | null }>`
      SELECT id, name FROM zvd_incoming_webhooks WHERE secret IS NULL OR secret = ''
    `.execute(db as never);
    if (rows.length === 0) return 0;

    // Checked once, up front: `maybeEncrypt` refuses without
    // FIELD_ENCRYPTION_KEY, and discovering that inside the loop would leave
    // some rows repaired and the rest not, under a message that reads like a
    // hiccup rather than "these webhooks still accept anything".
    try {
      await encrypt('probe', true);
    } catch (err) {
      console.warn(
        `⚠️  [api-connector] ${rows.length} incoming webhook(s) have no signing secret and will ` +
          'keep accepting unauthenticated payloads: a secret cannot be stored because ' +
          `${(err as Error).message}`,
      );
      return 0;
    }

    let repaired = 0;
    for (const row of rows) {
      const secret = (await encrypt(generateIncomingWebhookSecret(), true)) as string;
      await sql`UPDATE zvd_incoming_webhooks SET secret = ${secret} WHERE id = ${row.id}`.execute(
        db as never,
      );
      repaired++;
      console.warn(
        `⚠️  [api-connector] incoming webhook "${row.name ?? row.id}" had no signing secret ` +
          'and accepted unauthenticated payloads. A secret has been generated — fetch it from ' +
          'the admin UI and configure the sender to sign with x-hub-signature-256.',
      );
    }
    return repaired;
  } catch (err) {
    console.warn(
      '[api-connector] could not repair unsigned incoming webhooks:',
      (err as Error).message,
    );
    return 0;
  }
}
