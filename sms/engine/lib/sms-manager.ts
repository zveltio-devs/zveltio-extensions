import type { Database } from '@zveltio/engine-db';
import { sendViaTwilio } from './providers/twilio.js';
import { sendViaVonage } from './providers/vonage.js';

let _db: Database | null = null;

/**
 * Provider credentials, as the deployment configured them.
 *
 * These were `process.env.TWILIO_*` / `process.env.VONAGE_*`, read from inside
 * the extension — which in-process means the ENGINE's whole environment, not
 * just these keys. They now arrive through `ctx.config.vars`: everything the
 * deployment set as `ZVELTIO_EXT_SMS_<KEY>`, and nothing else.
 *
 *   ZVELTIO_EXT_SMS_TWILIO_ACCOUNT_SID
 *   ZVELTIO_EXT_SMS_TWILIO_AUTH_TOKEN
 *   ZVELTIO_EXT_SMS_TWILIO_FROM_NUMBER
 *   ZVELTIO_EXT_SMS_VONAGE_API_KEY
 *   ZVELTIO_EXT_SMS_VONAGE_API_SECRET
 *   ZVELTIO_EXT_SMS_VONAGE_FROM_NUMBER
 */
let _vars: Readonly<Record<string, string>> = {};

function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '');
}

export interface SendOpts {
  provider: 'twilio' | 'vonage';
  to: string;
  body?: string;
  template_id?: string;
  variables?: Record<string, string>;
}

export const SmsManager = {
  init(db: Database, vars?: Readonly<Record<string, string>>): void {
    _db = db;
    if (vars) _vars = vars;
  },

  async send(opts: SendOpts): Promise<{ id: string; status: string }> {
    if (!_db) throw new Error('SmsManager not initialized');
    const db = _db;

    let body = opts.body ?? '';

    // Resolve template if provided
    if (opts.template_id) {
      const template = await (db as any)
        .selectFrom('zv_sms_templates')
        .selectAll()
        .where('id', '=', opts.template_id)
        .executeTakeFirst();
      if (!template) throw new Error(`SMS template ${opts.template_id} not found`);
      body = interpolate(template.body, opts.variables ?? {});
    }

    if (!body) throw new Error('SMS body is required');

    // Insert pending record
    const record = await (db as any)
      .insertInto('zv_sms_messages')
      .values({
        provider: opts.provider,
        to_number: opts.to,
        from_number: opts.provider === 'twilio'
          ? (_vars.TWILIO_FROM_NUMBER ?? null)
          : (_vars.VONAGE_FROM_NUMBER ?? null),
        body,
        status: 'pending',
      })
      .returningAll()
      .executeTakeFirst();

    const messageId = record.id as string;

    try {
      let providerMsgId: string;
      let providerStatus: string;

      if (opts.provider === 'twilio') {
        const result = await sendViaTwilio({
          accountSid: _vars.TWILIO_ACCOUNT_SID ?? '',
          authToken: _vars.TWILIO_AUTH_TOKEN ?? '',
          from: _vars.TWILIO_FROM_NUMBER ?? '',
          to: opts.to,
          body,
        });
        providerMsgId = result.sid;
        providerStatus = result.status;
      } else {
        const result = await sendViaVonage({
          apiKey: _vars.VONAGE_API_KEY ?? '',
          apiSecret: _vars.VONAGE_API_SECRET ?? '',
          from: _vars.VONAGE_FROM_NUMBER ?? '',
          to: opts.to,
          text: body,
        });
        providerMsgId = result.messageId;
        providerStatus = result.status;
      }

      await (db as any)
        .updateTable('zv_sms_messages')
        .set({
          status: 'sent',
          provider_message_id: providerMsgId,
          sent_at: new Date(),
        })
        .where('id', '=', messageId)
        .execute();

      return { id: messageId, status: providerStatus };
    } catch (err: any) {
      await (db as any)
        .updateTable('zv_sms_messages')
        .set({
          status: 'failed',
          error: err.message ?? String(err),
        })
        .where('id', '=', messageId)
        .execute();
      throw err;
    }
  },

  async getStats(): Promise<Array<{ status: string; count: number }>> {
    if (!_db) return [];
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const rows = await (_db as any)
      .selectFrom('zv_sms_messages')
      .select([
        'status',
        (eb: any) => eb.fn.count('id').as('count'),
      ])
      .where('created_at', '>=', since)
      .groupBy('status')
      .execute();

    return rows.map((r: any) => ({ status: r.status, count: Number(r.count) }));
  },
};
