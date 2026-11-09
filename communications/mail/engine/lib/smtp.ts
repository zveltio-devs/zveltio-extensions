// SMTP submission (RFC 5321, STARTTLS RFC 3207, AUTH RFC 4954) over the
// engine's relayed stream: one message per connection.

import type { JobTcpStream } from '@zveltio/sdk/extension';
import { Wire } from './wire.js';

export class SmtpError extends Error {
  constructor(
    message: string,
    /** The server's reply code; 5xx is permanent, a retry will not help. */
    readonly code: number,
    /** True when the message was handed over and no reply came: it may or may not have been delivered. */
    readonly unknownOutcome = false,
  ) {
    super(message);
  }
}

export interface SmtpAuth {
  user: string;
  password?: string;
  /** An OAuth2 access token: SASL XOAUTH2 instead of a password. */
  accessToken?: string;
}

export interface Envelope {
  from: string;
  to: string[];
}

const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));

/** CRLF line ends and a leading dot doubled (RFC 5321 §4.5.2), then the terminator. */
export function dotStuff(raw: Uint8Array): Uint8Array {
  const out: number[] = [];
  let lineStart = true;
  for (let i = 0; i < raw.length; i++) {
    const b = raw[i]!;
    if (b === 10 && (i === 0 || raw[i - 1] !== 13)) out.push(13);
    if (lineStart && b === 46) out.push(46);
    out.push(b);
    lineStart = b === 10;
  }
  if (!lineStart) out.push(13, 10);
  out.push(46, 13, 10);
  return Uint8Array.from(out);
}

async function reply(w: Wire): Promise<{ code: number; text: string[] }> {
  const text: string[] = [];
  for (;;) {
    const line = await w.line();
    text.push(line.slice(4));
    if (line[3] !== '-') return { code: Number(line.slice(0, 3)) || 0, text };
  }
}

async function expect(w: Wire, ok: number[], what: string): Promise<string[]> {
  const r = await reply(w);
  if (!ok.includes(r.code)) throw new SmtpError(`SMTP ${what} refused: ${r.code} ${r.text.join(' ')}`, r.code);
  return r.text;
}

async function say(w: Wire, cmd: string, ok: number[], what = cmd.split(' ')[0]!): Promise<string[]> {
  await w.write(`${cmd}\r\n`);
  return expect(w, ok, what);
}

/** Address in an SMTP path: angle brackets, nothing that could start another command. */
function path(addr: string): string {
  if (/[\r\n<>]/.test(addr)) throw new SmtpError(`invalid address: ${JSON.stringify(addr)}`, 501);
  return `<${addr}>`;
}

/**
 * Submit `raw` (a complete RFC 5322 message) for `env`. `heloName` is what we
 * say in EHLO; a submission server does not check it.
 */
export async function sendMail(
  stream: JobTcpStream,
  tls: 'implicit' | 'starttls' | 'none',
  auth: SmtpAuth | null,
  env: Envelope,
  raw: Uint8Array,
  heloName = 'zveltio.invalid',
): Promise<void> {
  const w = new Wire(stream);
  try {
    await expect(w, [220], 'greeting');
    let ext = await say(w, `EHLO ${heloName}`, [250]);
    if (tls === 'starttls') {
      if (!ext.some((l) => l.toUpperCase() === 'STARTTLS')) throw new SmtpError('the SMTP server does not offer STARTTLS', 0);
      await say(w, 'STARTTLS', [220]);
      // Buffered plaintext would be read as if it came over TLS (response injection).
      if (w.pending) throw new SmtpError('the SMTP server sent data after STARTTLS; refusing to continue', 0);
      await w.startTls();
      ext = await say(w, `EHLO ${heloName}`, [250]);
    }
    if (auth) {
      const mechs = (ext.find((l) => /^AUTH[ =]/i.test(l)) ?? '').toUpperCase().split(/[ =]/).slice(1);
      if (auth.accessToken) {
        await say(w, `AUTH XOAUTH2 ${b64(`user=${auth.user}\x01auth=Bearer ${auth.accessToken}\x01\x01`)}`, [235], 'AUTH');
      } else if (mechs.includes('PLAIN') || !mechs.includes('LOGIN')) {
        await say(w, `AUTH PLAIN ${b64(`\0${auth.user}\0${auth.password ?? ''}`)}`, [235], 'AUTH');
      } else {
        await say(w, 'AUTH LOGIN', [334], 'AUTH');
        await say(w, b64(auth.user), [334], 'AUTH');
        await say(w, b64(auth.password ?? ''), [235], 'AUTH');
      }
    }
    await say(w, `MAIL FROM:${path(env.from)}`, [250], 'MAIL FROM');
    for (const to of env.to) await say(w, `RCPT TO:${path(to)}`, [250, 251], 'RCPT TO');
    await say(w, 'DATA', [354]);
    try {
      await w.write(dotStuff(raw));
      await expect(w, [250], 'message');
    } catch (err) {
      if (err instanceof SmtpError) throw err;
      // The message left; whether the server kept it, nobody said. Sending it
      // again may deliver it twice: the caller must not retry on its own.
      throw new SmtpError(`the SMTP server did not confirm the message: ${(err as Error).message}`, 0, true);
    }
    try {
      await say(w, 'QUIT', [221]);
    } catch {
      // Accepted already; how the server hangs up does not matter.
    }
  } finally {
    await w.close();
  }
}
