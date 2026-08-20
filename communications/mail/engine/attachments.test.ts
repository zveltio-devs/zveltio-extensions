// Attachments are stored, and can be downloaded. Neither was true.
//
// The audit: "Attachments are never stored — the table is read-only, and there
// is no download route." `zv_mail_attachments` shipped in migration 001 and the
// only statement in the codebase that named it was a SELECT. Sync already asked
// IMAP for `bodyStructure`, so the part list arrived on every message and was
// dropped on the floor.
//
// Two things had to change together. The rows are written now, and they carry
// the IMAP part number — migration 003 — because `client.download(uid, part)`
// needs it and re-deriving it later by matching filenames is not safe: one
// message can hold two parts called image001.png, which is what a forwarded
// thread looks like.
//
// The nesting case is the one that matters most. `hasAttachments` used to be a
// one-level `childNodes.some(...)`, so a forwarded mail — multipart/mixed >
// message/rfc822 > multipart/mixed > the file — reported no attachments at all.
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import hoodiecrow from 'hoodiecrow-imap';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;
const PORT = 4012;

// A plain attachment, and one buried inside a forwarded message.
const PDF_B64 = 'JVBERi0xLjQKJSVFT0Y=';
const SIMPLE = [
  'From: a@x.test',
  'To: me@x.test',
  'Subject: Invoice attached',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="BB"',
  '',
  '--BB',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'See attached',
  '',
  '--BB',
  'Content-Type: application/pdf; name="invoice.pdf"',
  'Content-Disposition: attachment; filename="invoice.pdf"',
  'Content-Transfer-Encoding: base64',
  '',
  PDF_B64,
  '',
  '--BB--',
  '',
].join('\r\n');

const FORWARDED = [
  'From: b@x.test',
  'To: me@x.test',
  'Subject: Fwd: Invoice',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="OUT"',
  '',
  '--OUT',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'Forwarding this',
  '',
  '--OUT',
  'Content-Type: message/rfc822',
  '',
  'From: a@x.test',
  'To: b@x.test',
  'Subject: Invoice attached',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="IN"',
  '',
  '--IN',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'See attached',
  '',
  '--IN',
  'Content-Type: application/pdf; name="deep.pdf"',
  'Content-Disposition: attachment; filename="deep.pdf"',
  'Content-Transfer-Encoding: base64',
  '',
  PDF_B64,
  '',
  '--IN--',
  '',
  '--OUT--',
  '',
].join('\r\n');

describe.skipIf(!DB_URL)('mail: attachments are stored and downloadable', () => {
  let server: any;
  let pool: any;
  let app: any;
  let accountId: string;

  beforeAll(async () => {
    server = hoodiecrow({
      plugins: [
        'ID',
        'SASL-IR',
        'AUTH-PLAIN',
        'NAMESPACE',
        'IDLE',
        'ENABLE',
        'LITERALPLUS',
        'UNSELECT',
        'SPECIAL-USE',
      ],
      storage: { INBOX: { messages: [{ raw: SIMPLE }, { raw: FORWARDED }] } },
    });
    await new Promise<void>((res) => server.listen(PORT, () => res()));

    app = (await mountForTest(import.meta.dir)).app;

    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });

    const acc = await pool.query(
      `INSERT INTO zv_mail_accounts
         (user_id, name, email_address, imap_host, imap_port, imap_secure, imap_user, imap_password, smtp_host)
       VALUES ($1, 'att', 'att@example.test', '127.0.0.1', $2, false, 'testuser', 'testpass', 'smtp.example.test')
       RETURNING id`,
      [HARNESS_USER, PORT],
    );
    accountId = acc.rows[0].id;

    const res = await app.request(`/accounts/${accountId}/sync`, { method: 'POST' });
    expect(res.status).toBe(200);
  });

  afterAll(async () => {
    if (pool) {
      await pool
        .query(`DELETE FROM zv_mail_accounts WHERE id = $1`, [accountId])
        .catch(() => undefined);
      await pool.end().catch(() => undefined);
    }
    await new Promise<void>((res) => (server ? server.close(() => res()) : res()));
  });

  it('writes a row for the plain attachment, with the part number', async () => {
    const r = await pool.query(
      `SELECT at.filename, at.mime_type, at.part, at.is_inline
       FROM zv_mail_attachments at
       INNER JOIN zv_mail_messages m ON m.id = at.message_id
       WHERE m.account_id = $1 AND at.filename = 'invoice.pdf'`,
      [accountId],
    );
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].mime_type).toBe('application/pdf');
    expect(r.rows[0].part).toBeTruthy();
    expect(r.rows[0].is_inline).toBe(false);
  });

  it('finds the one nested inside a forwarded message', async () => {
    // The assertion the old one-level check could not satisfy.
    const r = await pool.query(
      `SELECT at.part FROM zv_mail_attachments at
       INNER JOIN zv_mail_messages m ON m.id = at.message_id
       WHERE m.account_id = $1 AND at.filename = 'deep.pdf'`,
      [accountId],
    );
    expect(r.rows).toHaveLength(1);
    // A nested part number is dotted — proof it came from the walk, not the top level.
    expect(r.rows[0].part).toContain('.');
  });

  it('marks both messages as carrying attachments', async () => {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS n FROM zv_mail_messages WHERE account_id = $1 AND has_attachments = true`,
      [accountId],
    );
    expect(r.rows[0].n).toBe(2);
  });

  it('serves the bytes, decoded, with headers from the server', async () => {
    const id = (
      await pool.query(
        `SELECT at.id FROM zv_mail_attachments at
         INNER JOIN zv_mail_messages m ON m.id = at.message_id
         WHERE m.account_id = $1 AND at.filename = 'invoice.pdf'`,
        [accountId],
      )
    ).rows[0].id;

    const res = await app.request(`/attachments/${id}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/pdf');
    expect(res.headers.get('content-disposition')).toContain('invoice.pdf');

    // Decoded, not the base64 source: the raw part is 20 characters, the file is 14 bytes.
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.length).toBe(Buffer.from(PDF_B64, 'base64').length);
    expect(Buffer.from(bytes).toString('utf8')).toStartWith('%PDF-1.4');
  });

  it('re-syncing does not duplicate the rows', async () => {
    await app.request(`/accounts/${accountId}/sync`, { method: 'POST' });
    const r = await pool.query(
      `SELECT COUNT(*)::int AS n FROM zv_mail_attachments at
       INNER JOIN zv_mail_messages m ON m.id = at.message_id
       WHERE m.account_id = $1`,
      [accountId],
    );
    expect(r.rows[0].n).toBe(2);
  });

  it('refuses an attachment belonging to someone else', async () => {
    const stranger = '00000000-0000-4000-8000-0000000057a2';
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt", "twoFactorEnabled")
       VALUES ($1, 'S', 'stranger-att@test.local', true, 'member', NOW(), NOW(), false)
       ON CONFLICT (id) DO NOTHING`,
      [stranger],
    );
    const other = (
      await pool.query(
        `INSERT INTO zv_mail_accounts
           (user_id, name, email_address, imap_host, imap_user, imap_password, smtp_host)
         VALUES ($1, 'o', 'o@example.test', 'imap.example.test', 'o', 'x', 'smtp.example.test')
         RETURNING id`,
        [stranger],
      )
    ).rows[0].id;
    // account_id, folder_id and from_address are the NOT NULL columns without a
    // default — read off information_schema, not guessed.
    const folder = (
      await pool.query(
        `INSERT INTO zv_mail_folders (account_id, name, path, type)
         VALUES ($1, 'INBOX', 'INBOX', 'inbox') RETURNING id`,
        [other],
      )
    ).rows[0].id;
    const msg = (
      await pool.query(
        `INSERT INTO zv_mail_messages (account_id, folder_id, message_id, uid, from_address, subject)
         VALUES ($1, $2, 'x@y', 1, 'a@x.test', 'S') RETURNING id`,
        [other, folder],
      )
    ).rows[0].id;
    const att = (
      await pool.query(
        `INSERT INTO zv_mail_attachments (message_id, filename, mime_type, size_bytes, part)
         VALUES ($1, 'secret.pdf', 'application/pdf', 10, '2') RETURNING id`,
        [msg],
      )
    ).rows[0].id;

    const res = await app.request(`/attachments/${att}`);
    expect(res.status).toBe(404);

    await pool.query(`DELETE FROM zv_mail_accounts WHERE id = $1`, [other]).catch(() => undefined);
    await pool.query(`DELETE FROM "user" WHERE id = $1`, [stranger]).catch(() => undefined);
  });
});
