-- 003_attachment_part.sql
--
-- `zv_mail_attachments` has existed since 001 and nothing has ever written to
-- it: the audit's "attachments are never stored — the table is read-only, and
-- there is no download route". Sync fetches `bodyStructure` already, so the
-- part list has been in hand the whole time; it was thrown away.
--
-- Persisting the metadata is only half of it. To fetch the bytes later, IMAP
-- needs the pair (message UID, PART NUMBER) — `client.download(uid, '2')`. The
-- UID is on zv_mail_messages; the part number had nowhere to live, and without
-- it a download route would have to re-fetch bodyStructure and guess which node
-- it wanted by filename. Filenames repeat inside one message ("image001.png"
-- twice is ordinary in a forwarded thread), so that guess is not safe.
--
-- Bytes are deliberately NOT stored. `storage_path` stays for whoever wants to
-- cache them; the download route streams from IMAP on demand, which keeps a
-- mailbox's worth of attachments out of this database.

ALTER TABLE zv_mail_attachments ADD COLUMN IF NOT EXISTS part TEXT;

-- One row per part per message. Re-syncing a message must not accumulate
-- duplicate attachment rows, and ON CONFLICT needs something to conflict on.
CREATE UNIQUE INDEX IF NOT EXISTS idx_zv_mail_attachments_message_part
  ON zv_mail_attachments (message_id, part);

-- DOWN
DROP INDEX IF EXISTS idx_zv_mail_attachments_message_part;
ALTER TABLE zv_mail_attachments DROP COLUMN IF EXISTS part;
