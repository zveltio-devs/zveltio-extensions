// Reading and writing RFC 5322 / MIME messages. Parsing is postal-mime; the
// HTML body is sanitized here, once, before it is stored, so every reader of
// `mail_messages.body_html` (Studio, the data API, an export) gets inert HTML.

import PostalMime, { decodeWords } from 'postal-mime';
import type { Leaf } from './imap.js';
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

/** The text of an HTML body, for the text part of a message written as rich text. */
export function htmlText(html: string): string {
  return html
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/blockquote)\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

// ── Parts, as a BODYSTRUCTURE lists them ─────────────────────────────────────

/** A part's bytes without their Content-Transfer-Encoding (base64, quoted-printable; anything else as is). */
export function decodeTransfer(bytes: Uint8Array, encoding: string): Uint8Array {
  if (encoding === 'base64') {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    s = s.replace(/[^A-Za-z0-9+/]/g, '');
    const bin = atob(s.slice(0, s.length - (s.length % 4 === 1 ? 1 : 0)));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  if (encoding === 'quoted-printable') {
    const out = new Uint8Array(bytes.length);
    let n = 0;
    const hex = (c: number | undefined) => c !== undefined && /[0-9A-Fa-f]/.test(String.fromCharCode(c));
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i]!;
      if (b !== 0x3d) {
        out[n++] = b;
      } else if (bytes[i + 1] === 0x0d && bytes[i + 2] === 0x0a) {
        i += 2; // soft line break
      } else if (bytes[i + 1] === 0x0a) {
        i += 1;
      } else if (hex(bytes[i + 1]) && hex(bytes[i + 2])) {
        out[n++] = parseInt(String.fromCharCode(bytes[i + 1]!, bytes[i + 2]!), 16);
        i += 2;
      } else {
        out[n++] = b;
      }
    }
    return out.subarray(0, n);
  }
  return bytes;
}

/** A text part as a string: transfer encoding off, then its charset (UTF-8 when unknown). */
export function partText(bytes: Uint8Array, leaf: Pick<Leaf, 'encoding' | 'params'>): string {
  const raw = decodeTransfer(bytes, leaf.encoding);
  try {
    return new TextDecoder(leaf.params.charset || 'utf-8').decode(raw);
  } catch {
    return new TextDecoder().decode(raw);
  }
}

/** A MIME parameter: plain, RFC 2047 encoded-words, or RFC 2231 (`name*`, `name*0*`...). */
function param(o: Record<string, string>, name: string): string | null {
  if (o[name]) return decodeWords(o[name]);
  const keys = Object.keys(o)
    .filter((k) => k === `${name}*` || new RegExp(`^${name}\\*\\d+\\*?$`).test(k))
    .sort((a, b) => Number(a.split('*')[1] || 0) - Number(b.split('*')[1] || 0));
  if (!keys.length) return null;
  const joined = keys.map((k) => o[k]).join('');
  const m = /^([^']*)'[^']*'(.*)$/.exec(joined);
  if (!m) return joined;
  const bytes: number[] = [];
  for (let i = 0; i < m[2]!.length; i++) {
    const h = m[2]!.slice(i + 1, i + 3);
    if (m[2]![i] === '%' && /^[0-9A-Fa-f]{2}$/.test(h)) {
      bytes.push(parseInt(h, 16));
      i += 2;
    } else bytes.push(m[2]!.charCodeAt(i) & 0xff);
  }
  try {
    return new TextDecoder(m[1] || 'utf-8').decode(new Uint8Array(bytes));
  } catch {
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
}

export interface PartRef {
  section: string;
  encoding: string;
  filename: string;
  mimeType: string;
  size: number;
  contentId: string | null;
  inline: boolean;
}

/**
 * A message's leaves split into its body (the first plain and first HTML part
 * that are not attachments) and its attachments, each with where it is.
 */
export function splitParts(all: Leaf[]): { text: Leaf | null; html: Leaf | null; attachments: PartRef[] } {
  let text: Leaf | null = null;
  let html: Leaf | null = null;
  const attachments: PartRef[] = [];
  for (const l of all) {
    const name = param(l.dparams, 'filename') ?? param(l.params, 'name');
    const body = l.disposition !== 'attachment' && !name && (l.type === 'text/plain' || l.type === 'text/html');
    if (body) {
      if (l.type === 'text/plain' && !text) text = l;
      else if (l.type === 'text/html' && !html) html = l;
      continue;
    }
    const sub = l.type === 'message/rfc822' ? 'eml' : (l.type.split('/')[1] ?? '');
    attachments.push({
      section: l.section,
      encoding: l.encoding,
      filename: name?.replace(/[\r\n/\\]/g, '_') || `attachment${/^[a-z0-9]{1,8}$/.test(sub) ? `.${sub}` : ''}`,
      mimeType: l.type,
      size: l.size,
      contentId: l.id ? l.id.replace(/^<|>$/g, '') : null,
      inline: l.disposition === 'inline' || (l.disposition === null && !!l.id),
    });
  }
  return { text, html, attachments };
}

/** A message from its header and the text of its body parts (a sync fetches nothing more). */
export async function parseListed(header: Uint8Array, text: string | null, html: string | null): Promise<Parsed> {
  const p = await parseMessage(header);
  const clean = html ? cleanHtml(html) : null;
  const plain = text ?? (clean ? clean.replace(/<[^>]*>/g, ' ') : '');
  return { ...p, text, html: clean, snippet: plain.replace(/\s+/g, ' ').trim().slice(0, 200), attachments: [] };
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
