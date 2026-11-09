// Reading and writing RFC 5322 / MIME messages. Parsing is postal-mime; the
// HTML body is sanitized here, once, before it is stored, so every reader of
// `mail_messages.body_html` (Studio, the data API, an export) gets inert HTML.

import PostalMime from 'postal-mime';
import sanitizeHtml from 'sanitize-html';

const enc = new TextEncoder();

/**
 * Inert HTML: no script, no event handler, no form, no frame, no remote
 * stylesheet; links keep http(s)/mailto only; images keep `cid:` and `data:`
 * (remote images stay as written: Studio decides whether to load them).
 */
export function cleanHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'center', 'font', 'span', 'del', 'ins', 'u', 's']),
    allowedAttributes: {
      '*': ['style', 'align', 'valign', 'width', 'height', 'bgcolor', 'color', 'dir', 'lang', 'title'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      font: ['face', 'size', 'color'],
      td: ['colspan', 'rowspan', 'style', 'align', 'valign', 'width', 'bgcolor'],
      th: ['colspan', 'rowspan', 'style', 'align', 'valign', 'width', 'bgcolor'],
      table: ['border', 'cellpadding', 'cellspacing', 'width', 'bgcolor', 'style', 'align'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'cid', 'data'],
    allowedSchemesByTag: { a: ['http', 'https', 'mailto'], img: ['http', 'https', 'cid', 'data'] },
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) },
  });
}

export interface Address {
  address: string;
  name?: string;
}

export interface ParsedAttachment {
  filename: string;
  mimeType: string;
  size: number;
  contentId: string | null;
  inline: boolean;
  content: Uint8Array;
}

export interface Parsed {
  messageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  from: Address;
  to: Address[];
  cc: Address[];
  replyTo: string | null;
  subject: string | null;
  text: string | null;
  html: string | null;
  snippet: string;
  date: string | null;
  priority: 'high' | 'normal' | 'low';
  readReceipt: boolean;
  attachments: ParsedAttachment[];
}

const addrs = (v: unknown): Address[] => {
  const out: Address[] = [];
  for (const a of (Array.isArray(v) ? v : v ? [v] : []) as Array<{ address?: string; name?: string; group?: unknown[] }>) {
    if (a.group) out.push(...addrs(a.group));
    else if (a.address) out.push(a.name ? { address: a.address, name: a.name } : { address: a.address });
  }
  return out;
};

export async function parseMessage(raw: Uint8Array): Promise<Parsed> {
  const m = await PostalMime.parse(raw, { attachmentEncoding: 'arraybuffer' });
  const header = (k: string) => m.headers.find((h) => h.key === k)?.value ?? null;
  const prio = (header('x-priority') ?? header('importance') ?? '').toLowerCase();
  const text = m.text ?? null;
  const html = m.html ? cleanHtml(m.html) : null;
  const plain = text ?? (html ? html.replace(/<[^>]*>/g, ' ') : '');
  return {
    messageId: m.messageId ?? null,
    inReplyTo: m.inReplyTo ?? null,
    references: m.references ?? null,
    from: addrs(m.from)[0] ?? { address: '' },
    to: addrs(m.to),
    cc: addrs(m.cc),
    replyTo: addrs(m.replyTo)[0]?.address ?? null,
    subject: m.subject ?? null,
    text,
    html,
    snippet: plain.replace(/\s+/g, ' ').trim().slice(0, 200),
    date: m.date && !Number.isNaN(Date.parse(m.date)) ? new Date(m.date).toISOString() : null,
    priority: /^[12]\b|high/.test(prio) ? 'high' : /^[45]\b|low/.test(prio) ? 'low' : 'normal',
    readReceipt: header('disposition-notification-to') !== null,
    attachments: m.attachments.map((a) => {
      const content = new Uint8Array(a.content as ArrayBuffer);
      return {
        filename: a.filename || 'attachment',
        mimeType: a.mimeType || 'application/octet-stream',
        size: content.length,
        contentId: a.contentId ? a.contentId.replace(/^<|>$/g, '') : null,
        inline: a.disposition === 'inline',
        content,
      };
    }),
  };
}

// ── Writing ──────────────────────────────────────────────────────────────────

/** A header value: RFC 2047 encoded-words when it is not plain ASCII. */
export function encodeWord(v: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7e]*$/.test(v)) return v;
  const words: string[] = [];
  let chunk = '';
  for (const ch of v) {
    // 45 bytes of UTF-8 encode to 60 base64 chars: each word stays under 76.
    if (enc.encode(chunk + ch).length > 45) {
      words.push(chunk);
      chunk = '';
    }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${b64(enc.encode(w))}?=`).join(' ');
}

function b64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Base64 folded at 76 columns (RFC 2045 §6.8). */
const b64Lines = (bytes: Uint8Array) => b64(bytes).replace(/.{76}(?=.)/g, '$&\r\n');

/** `Name <addr>`; the display name quoted or encoded, the address checked for header injection. */
export function formatAddress(a: Address): string {
  if (/[\r\n<>,;"]/.test(a.address) || !a.address.includes('@')) throw new Error(`invalid address: ${JSON.stringify(a.address)}`);
  if (!a.name) return a.address;
  const name = /^[\w .'-]*$/.test(a.name) ? `"${a.name}"` : encodeWord(a.name.replace(/[\r\n]/g, ' '));
  return `${name} <${a.address}>`;
}

export interface Outgoing {
  from: Address;
  to: Address[];
  cc: Address[];
  bcc: Address[];
  replyTo?: string | null;
  subject: string;
  text: string;
  html?: string | null;
  inReplyTo?: string | null;
  references?: string | null;
  priority?: 'high' | 'normal' | 'low';
  readReceipt?: boolean;
  attachments: Array<{ filename: string; mimeType: string; content: Uint8Array }>;
  /** Fixed for tests; random otherwise. */
  boundary?: string;
  date?: Date;
  messageId?: string;
}

const noCrlf = (v: string) => v.replace(/[\r\n]+/g, ' ');

/** A complete message. Bcc stays out of the headers: it is only the envelope. */
export function buildMessage(o: Outgoing): { raw: Uint8Array; messageId: string } {
  const domain = o.from.address.split('@')[1] ?? 'zveltio.invalid';
  const messageId = o.messageId ?? `<${crypto.randomUUID()}@${domain}>`;
  const boundary = o.boundary ?? `zv-${crypto.randomUUID()}`;
  const h: string[] = [
    `From: ${formatAddress(o.from)}`,
    ...(o.to.length ? [`To: ${o.to.map(formatAddress).join(', ')}`] : []),
    ...(o.cc.length ? [`Cc: ${o.cc.map(formatAddress).join(', ')}`] : []),
    ...(o.replyTo ? [`Reply-To: ${formatAddress({ address: o.replyTo })}`] : []),
    `Subject: ${encodeWord(noCrlf(o.subject))}`,
    `Date: ${(o.date ?? new Date()).toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: ${messageId}`,
    ...(o.inReplyTo ? [`In-Reply-To: ${noCrlf(o.inReplyTo)}`] : []),
    ...(o.references ? [`References: ${noCrlf(o.references)}`] : []),
    ...(o.priority === 'high' ? ['X-Priority: 1', 'Importance: high'] : o.priority === 'low' ? ['X-Priority: 5', 'Importance: low'] : []),
    ...(o.readReceipt ? [`Disposition-Notification-To: ${formatAddress(o.from)}`] : []),
    'MIME-Version: 1.0',
  ];
  const textPart = (type: string, body: string) =>
    `Content-Type: ${type}; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64Lines(enc.encode(body))}\r\n`;
  const alt = o.html
    ? `Content-Type: multipart/alternative; boundary="${boundary}-a"\r\n\r\n` +
      `--${boundary}-a\r\n${textPart('text/plain', o.text)}--${boundary}-a\r\n${textPart('text/html', o.html)}--${boundary}-a--\r\n`
    : textPart('text/plain', o.text);
  let body: string;
  if (!o.attachments.length) {
    body = alt;
  } else {
    body = `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n--${boundary}\r\n${alt}`;
    for (const a of o.attachments) {
      const name = encodeWord(noCrlf(a.filename).replace(/"/g, ''));
      body +=
        `--${boundary}\r\nContent-Type: ${noCrlf(a.mimeType)}; name="${name}"\r\n` +
        `Content-Disposition: attachment; filename="${name}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64Lines(a.content)}\r\n`;
    }
    body += `--${boundary}--\r\n`;
  }
  return { raw: enc.encode(`${h.join('\r\n')}\r\n${body}`), messageId };
}
