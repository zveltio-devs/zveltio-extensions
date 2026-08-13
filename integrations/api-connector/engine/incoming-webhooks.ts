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
 * Unlike engine outbound webhooks, `zvd_incoming_webhooks.secret` is plain TEXT —
 * no FIELD_ENCRYPTION_KEY required. Rows without a secret accepted any payload
 * from anyone who knew the path; this repair closes that gap at extension load.
 */
export async function repairUnsignedIncomingWebhooksAtLoad(db: {
  // biome-ignore lint/suspicious/noExplicitAny: extension db handle is Kysely-shaped
  executeQuery: (query: any) => Promise<{ rows: unknown[] }>;
}): Promise<number> {
  try {
    const { rows } = await sql<{ id: string; name: string | null }>`
      SELECT id, name FROM zvd_incoming_webhooks WHERE secret IS NULL OR secret = ''
    `.execute(db as never);
    if (rows.length === 0) return 0;

    let repaired = 0;
    for (const row of rows) {
      const secret = generateIncomingWebhookSecret();
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
