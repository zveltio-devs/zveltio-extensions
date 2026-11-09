// The IMAP4rev1 subset a mail client needs (RFC 3501, MOVE RFC 6851, UIDPLUS
// RFC 4315, SPECIAL-USE RFC 6154), spoken over the engine's relayed stream.
// One command at a time; no IDLE (a job is a bounded run, not a session).

import type { JobTcpStream } from '@zveltio/sdk/extension';
import { Wire } from './wire.js';

/** A parsed IMAP value: atom or string, literal bytes, NIL, or a parenthesized list. */
export type Val = string | Uint8Array | null | Val[];

export class ImapError extends Error {}

interface Resp {
  tag: string;
  tokens: Val[];
}

const enc = new TextEncoder();
const LIT = '\u0001';

/** Parse one response's text; `\u0001<i>\u0001` stands for literal `i`. */
export function parseTokens(s: string, lits: Uint8Array[]): Val[] {
  let i = 0;
  const list = (): Val[] => {
    const out: Val[] = [];
    while (i < s.length) {
      const ch = s[i]!;
      if (ch === ' ') {
        i++;
      } else if (ch === '(') {
        i++;
        out.push(list());
      } else if (ch === ')') {
        i++;
        return out;
      } else if (ch === '"') {
        let v = '';
        i++;
        while (i < s.length && s[i] !== '"') {
          if (s[i] === '\\') i++;
          v += s[i++] ?? '';
        }
        i++;
        out.push(v);
      } else if (ch === LIT) {
        const end = s.indexOf(LIT, i + 1);
        out.push(lits[Number(s.slice(i + 1, end))]!);
        i = end + 1;
      } else {
        let v = '';
        while (i < s.length && s[i] !== ' ' && s[i] !== '(' && s[i] !== ')') {
          if (s[i] === '[') {
            const end = s.indexOf(']', i);
            const stop = end < 0 ? s.length : end + 1;
            v += s.slice(i, stop);
            i = stop;
          } else {
            v += s[i++];
          }
        }
        out.push(v.toUpperCase() === 'NIL' ? null : v);
      }
    }
    return out;
  };
  return list();
}

/** A string as an IMAP astring: quoted when it can be, else a literal. */
type Part = string | Uint8Array;
function astring(v: string): Part[] {
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7e]*$/.test(v) && v.length < 1000) return [`"${v.replace(/["\\]/g, '\\$&')}"`];
  return [enc.encode(v)];
}

/** Modified UTF-7 (RFC 3501 §5.1.3), the encoding of mailbox names. */
export function decodeMailbox(name: string): string {
  return name.replace(/&([^-]*)-/g, (_, b64: string) => {
    if (b64 === '') return '&';
    const bin = atob(b64.replace(/,/g, '/') + '==='.slice((b64.length + 3) % 4));
    let out = '';
    for (let i = 0; i + 1 < bin.length; i += 2) out += String.fromCharCode((bin.charCodeAt(i) << 8) | bin.charCodeAt(i + 1));
    return out;
  });
}

export function encodeMailbox(name: string): string {
  return name.replace(/&/g, '&-').replace(/[^\x20-\x7e]+/g, (run) => {
    let bin = '';
    for (const ch of run) {
      for (let i = 0; i < ch.length; i++) {
        const c = ch.charCodeAt(i);
        bin += String.fromCharCode(c >> 8, c & 0xff);
      }
    }
    return '&' + btoa(bin).replace(/=+$/, '').replace(/\//g, ',') + '-';
  });
}

/** Pairs of a FETCH item list as a map: `UID`, `FLAGS`, `BODY[]`... (upper-cased keys). */
function fetchItems(v: Val): Map<string, Val> {
  const m = new Map<string, Val>();
  if (!Array.isArray(v)) return m;
  for (let i = 0; i + 1 < v.length; i += 2) {
    const k = v[i];
    if (typeof k === 'string') m.set(k.toUpperCase(), v[i + 1]!);
  }
  return m;
}

const str = (v: Val | undefined): string =>
  typeof v === 'string' ? v : v instanceof Uint8Array ? new TextDecoder().decode(v) : '';

export interface Folder {
  path: string;
  name: string;
  delimiter: string;
  flags: string[];
}

export interface Fetched {
  uid: number;
  flags: string[];
  size: number;
  internalDate: string | null;
  raw?: Uint8Array;
}

export class Imap {
  private seq = 0;
  caps = new Set<string>();
  private readonly wire: Wire;

  private constructor(stream: JobTcpStream) {
    this.wire = new Wire(stream);
  }

  get bytesIn(): number {
    return this.wire.bytesIn;
  }

  /** Read the greeting; with `starttls`, upgrade before anything else crosses. */
  static async open(stream: JobTcpStream, tls: 'implicit' | 'starttls' | 'none'): Promise<Imap> {
    const c = new Imap(stream);
    const hello = await c.read();
    if (str(hello.tokens[1]).toUpperCase() === 'BYE') throw new ImapError('the IMAP server refused the connection');
    await c.capability();
    if (tls === 'starttls') {
      if (!c.caps.has('STARTTLS')) throw new ImapError('the IMAP server does not offer STARTTLS');
      await c.run(['STARTTLS']);
      // Anything already buffered arrived in plaintext and would be read as if
      // it came over TLS (STARTTLS response injection, CVE-2011-0411 class).
      if (c.wire.pending) throw new ImapError('the IMAP server sent data after STARTTLS; refusing to continue');
      await c.wire.startTls();
      await c.capability();
    }
    return c;
  }

  /** One complete response: a line and the literals it announces. */
  private async read(): Promise<Resp> {
    const lits: Uint8Array[] = [];
    let text = '';
    for (;;) {
      const line = await this.wire.line();
      const m = /\{(\d+)\+?\}$/.exec(line);
      if (!m) {
        text += line;
        break;
      }
      text += line.slice(0, m.index) + LIT + lits.length + LIT;
      lits.push(await this.wire.bytes(Number(m[1])));
    }
    const sp = text.indexOf(' ');
    const tag = sp < 0 ? text : text.slice(0, sp);
    return { tag, tokens: parseTokens(text, lits) };
  }

  /**
   * Send one command and collect its untagged responses. A literal waits for the
   * server's continuation unless LITERAL+ lets it go at once.
   */
  async run(parts: Part[]): Promise<Val[][]> {
    const tag = `z${++this.seq}`;
    const plus = this.caps.has('LITERAL+');
    const untagged: Val[][] = [];
    let line = `${tag} `;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      if (typeof p === 'string') {
        line += (i > 0 ? ' ' : '') + p;
        continue;
      }
      await this.wire.write(`${line}${i > 0 ? ' ' : ''}{${p.length}${plus ? '+' : ''}}\r\n`);
      line = '';
      if (!plus) {
        for (;;) {
          const r = await this.read();
          if (r.tag === '+') break;
          if (r.tag === tag) throw new ImapError(`IMAP ${String(parts[0])} failed: ${r.tokens.slice(2).map(str).join(' ')}`);
          untagged.push(r.tokens);
        }
      }
      await this.wire.write(p);
    }
    await this.wire.write(`${line}\r\n`);
    for (;;) {
      const r = await this.read();
      if (r.tag === '*') {
        untagged.push(r.tokens.slice(1));
      } else if (r.tag === tag) {
        const status = str(r.tokens[1]).toUpperCase();
        if (status !== 'OK') {
          const why = r.tokens.slice(2).map(str).join(' ');
          throw new ImapError(`IMAP ${String(parts[0])} failed: ${why}`);
        }
        return untagged;
      }
      // A continuation nobody asked for, or another tag: ignored.
    }
  }

  async capability(): Promise<void> {
    const res = await this.run(['CAPABILITY']);
    for (const r of res) {
      if (str(r[0]).toUpperCase() === 'CAPABILITY') this.caps = new Set(r.slice(1).map((v) => str(v).toUpperCase()));
    }
  }

  async login(user: string, password: string): Promise<void> {
    if (this.caps.has('LOGINDISABLED')) throw new ImapError('the IMAP server disables LOGIN on this connection');
    await this.run(['LOGIN', ...astring(user), ...astring(password)]);
    await this.capability();
  }

  /** SASL XOAUTH2 (Gmail, Microsoft 365). */
  async xoauth2(user: string, token: string): Promise<void> {
    const b64 = btoa(`user=${user}\x01auth=Bearer ${token}\x01\x01`);
    await this.run(['AUTHENTICATE XOAUTH2', b64]);
    await this.capability();
  }

  async list(): Promise<Folder[]> {
    const res = await this.run(['LIST "" "*"']);
    const out: Folder[] = [];
    for (const r of res) {
      if (str(r[0]).toUpperCase() !== 'LIST') continue;
      const flags = Array.isArray(r[1]) ? r[1].map((f) => str(f)) : [];
      if (flags.some((f) => f.toLowerCase() === '\\noselect' || f.toLowerCase() === '\\nonexistent')) continue;
      const path = str(r[3]);
      const delimiter = str(r[2]);
      const decoded = decodeMailbox(path);
      out.push({ path, delimiter, flags, name: delimiter ? decoded.split(delimiter).pop()! : decoded });
    }
    return out;
  }

  async select(path: string): Promise<{ exists: number; uidValidity: number; uidNext: number }> {
    const res = await this.run(['SELECT', ...astring(path)]);
    let exists = 0;
    let uidValidity = 0;
    let uidNext = 0;
    for (const r of res) {
      if (str(r[1]).toUpperCase() === 'EXISTS') exists = Number(str(r[0]));
      const code = r.map(str).join(' ');
      const v = /\[UIDVALIDITY (\d+)\]/i.exec(code);
      if (v) uidValidity = Number(v[1]);
      const n = /\[UIDNEXT (\d+)\]/i.exec(code);
      if (n) uidNext = Number(n[1]);
    }
    return { exists, uidValidity, uidNext };
  }

  async status(path: string): Promise<{ messages: number; unseen: number }> {
    const res = await this.run(['STATUS', ...astring(path), '(MESSAGES UNSEEN)']);
    const items = fetchItems(res.find((r) => str(r[0]).toUpperCase() === 'STATUS')?.[2] ?? []);
    return { messages: Number(str(items.get('MESSAGES'))) || 0, unseen: Number(str(items.get('UNSEEN'))) || 0 };
  }

  /** UID, flags, size and date of every message from `fromUid` on (no bodies). */
  async headers(fromUid: number): Promise<Fetched[]> {
    const res = await this.run([`UID FETCH ${fromUid}:* (UID FLAGS RFC822.SIZE INTERNALDATE)`]);
    return this.fetched(res).filter((m) => m.uid >= fromUid);
  }

  /** Flags of every message, for reconciling read/starred/deleted. */
  async flags(): Promise<Fetched[]> {
    return this.fetched(await this.run(['UID FETCH 1:* (UID FLAGS)']));
  }

  /** The whole message, without setting \Seen. */
  async body(uid: number): Promise<Uint8Array | null> {
    const [m] = this.fetched(await this.run([`UID FETCH ${uid} (UID BODY.PEEK[])`])).filter((x) => x.uid === uid);
    return m?.raw ?? null;
  }

  /** Only the header block, for a message too large to fetch whole. */
  async header(uid: number): Promise<Uint8Array | null> {
    const [m] = this.fetched(await this.run([`UID FETCH ${uid} (UID BODY.PEEK[HEADER])`]), 'BODY[HEADER]').filter((x) => x.uid === uid);
    return m?.raw ?? null;
  }

  private fetched(res: Val[][], bodyKey = 'BODY[]'): Fetched[] {
    const out: Fetched[] = [];
    for (const r of res) {
      if (str(r[1]).toUpperCase() !== 'FETCH') continue;
      const it = fetchItems(r[2] ?? null);
      const uid = Number(str(it.get('UID')));
      if (!uid) continue;
      const flags = it.get('FLAGS');
      const raw = it.get(bodyKey);
      out.push({
        uid,
        flags: Array.isArray(flags) ? flags.map((f) => str(f)) : [],
        size: Number(str(it.get('RFC822.SIZE'))) || 0,
        internalDate: str(it.get('INTERNALDATE')) || null,
        raw: raw instanceof Uint8Array ? raw : typeof raw === 'string' ? enc.encode(raw) : undefined,
      });
    }
    return out;
  }

  async store(uids: number[], op: '+' | '-', flags: string[]): Promise<void> {
    if (uids.length) await this.run([`UID STORE ${uids.join(',')} ${op}FLAGS.SILENT (${flags.join(' ')})`]);
  }

  /** Move to `target`: MOVE where offered, else COPY, \Deleted and expunge. */
  async move(uids: number[], target: string): Promise<void> {
    if (!uids.length) return;
    const set = uids.join(',');
    if (this.caps.has('MOVE')) {
      await this.run([`UID MOVE ${set}`, ...astring(target)]);
      return;
    }
    await this.run([`UID COPY ${set}`, ...astring(target)]);
    await this.expunge(uids);
  }

  /** Remove these messages for good, and only these where UIDPLUS allows it. */
  async expunge(uids: number[]): Promise<void> {
    if (!uids.length) return;
    await this.store(uids, '+', ['\\Deleted']);
    await this.run([this.caps.has('UIDPLUS') ? `UID EXPUNGE ${uids.join(',')}` : 'EXPUNGE']);
  }

  async append(path: string, flags: string[], raw: Uint8Array): Promise<void> {
    await this.run(['APPEND', ...astring(path), `(${flags.join(' ')})`, raw]);
  }

  async create(path: string): Promise<void> {
    await this.run(['CREATE', ...astring(path)]);
  }

  async rename(from: string, to: string): Promise<void> {
    await this.run(['RENAME', ...astring(from), ...astring(to)]);
  }

  async remove(path: string): Promise<void> {
    await this.run(['DELETE', ...astring(path)]);
  }

  async logout(): Promise<void> {
    try {
      await this.run(['LOGOUT']);
    } catch {
      // The server may hang up before tagging LOGOUT; the session is over either way.
    }
    await this.wire.close();
  }
}
