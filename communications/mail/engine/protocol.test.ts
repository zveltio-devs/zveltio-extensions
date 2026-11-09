// The IMAP and SMTP clients against real servers on loopback: hoodiecrow-imap
// for IMAP, a scripted SMTP peer for submission. The stream adapter stands in
// for the engine's relay (`host.egress.connect`), which hands the job exactly
// this read/write/close surface.
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import hoodiecrow from 'hoodiecrow-imap';
import type { JobTcpStream } from '@zveltio/sdk/extension';
import { Imap, decodeMailbox, encodeMailbox, parseTokens } from './lib/imap.js';
import { sendMail, dotStuff } from './lib/smtp.js';
import { buildMessage, parseMessage, cleanHtml, encodeWord } from './lib/mime.js';

const IMAP_PORT = 4031;
const SMTP_PORT = 4032;

async function tcp(port: number): Promise<JobTcpStream> {
  const queue: Uint8Array[] = [];
  let closed = false;
  let wake: (() => void) | null = null;
  const sock = await Bun.connect({
    hostname: '127.0.0.1',
    port,
    socket: {
      data(_s, d) {
        queue.push(new Uint8Array(d));
        wake?.();
      },
      close() {
        closed = true;
        wake?.();
      },
    },
  });
  return {
    async read() {
      while (!queue.length && !closed) await new Promise<void>((r) => (wake = r));
      return queue.shift() ?? null;
    },
    async write(d) {
      sock.write(d);
    },
    async startTls() {
      throw new Error('no TLS on loopback');
    },
    async close() {
      sock.end();
    },
  };
}

const RAW = [
  'From: "Ana Pop" <ana@x.test>',
  'To: me@x.test',
  'Subject: =?UTF-8?B?xIJsZcWfdGk=?=',
  'Message-ID: <m1@x.test>',
  'X-Priority: 1',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="BB"',
  '',
  '--BB',
  'Content-Type: text/html; charset=utf-8',
  '',
  '<p onclick="steal()">Hi<script>alert(1)</script><a href="javascript:x()">l</a><img src="cid:i1"></p>',
  '--BB',
  'Content-Type: application/pdf; name="a.pdf"',
  'Content-Disposition: attachment; filename="a.pdf"',
  'Content-Transfer-Encoding: base64',
  '',
  'JVBERi0xLjQKJSVFT0Y=',
  '--BB--',
  '',
].join('\r\n');

describe('IMAP client', () => {
  let server: any;
  beforeAll(async () => {
    server = hoodiecrow({
      plugins: ['LITERALPLUS', 'SPECIAL-USE', 'MOVE', 'UIDPLUS'],
      storage: {
        INBOX: { messages: [{ raw: RAW, flags: [] }, { raw: 'Subject: two\r\n\r\nbody two', flags: ['\\Seen'] }] },
        '': { folders: { Sent: { 'special-use': '\\Sent', messages: [] }, 'Gr&APYA3w-e': { messages: [] } } },
      },
    });
    await new Promise<void>((res) => server.listen(IMAP_PORT, () => res()));
  });
  afterAll(() => server?.close());

  it('logs in, lists, selects, fetches, flags, moves, appends and manages folders', async () => {
    const c = await Imap.open(await tcp(IMAP_PORT), 'none');
    await c.login('testuser', 'testpass');

    const folders = await c.list();
    const byName = new Map(folders.map((f) => [f.name, f]));
    expect(byName.get('INBOX')).toBeDefined();
    expect(byName.get('Sent')?.flags.map((f) => f.toLowerCase())).toContain('\\sent');
    expect([...byName.keys()]).toContain('Größe');

    const sel = await c.select('INBOX');
    expect(sel.exists).toBe(2);
    expect(sel.uidValidity).toBeGreaterThan(0);

    const heads = await c.headers(1);
    expect(heads.map((h) => h.uid)).toEqual([1, 2]);
    expect(heads[1]!.flags).toContain('\\Seen');
    // "n:*" past the last UID still answers the last message; it is filtered out.
    expect(await c.headers(99)).toEqual([]);

    const raw = await c.body(1);
    const parsed = await parseMessage(raw!);
    expect(parsed.subject).toBe('Ăleşti');
    expect(parsed.from).toEqual({ address: 'ana@x.test', name: 'Ana Pop' });
    expect(parsed.priority).toBe('high');
    expect(parsed.html).not.toContain('script');
    expect(parsed.html).not.toContain('onclick');
    expect(parsed.html).not.toContain('javascript:');
    expect(parsed.html).toContain('cid:i1');
    expect(parsed.attachments).toHaveLength(1);
    expect(new TextDecoder().decode(parsed.attachments[0]!.content)).toBe('%PDF-1.4\n%%EOF');
    // BODY.PEEK leaves \Seen alone.
    expect((await c.flags()).find((m) => m.uid === 1)!.flags).not.toContain('\\Seen');

    await c.store([1], '+', ['\\Seen', '\\Flagged']);
    expect((await c.flags()).find((m) => m.uid === 1)!.flags).toEqual(expect.arrayContaining(['\\Seen', '\\Flagged']));
    await c.store([1], '-', ['\\Flagged']);
    expect((await c.flags()).find((m) => m.uid === 1)!.flags).not.toContain('\\Flagged');

    await c.move([2], 'Sent');
    expect((await c.flags()).map((m) => m.uid)).toEqual([1]);
    expect((await c.status('Sent')).messages).toBe(1);

    await c.append('Sent', ['\\Seen'], new TextEncoder().encode('Subject: appended\r\n\r\nx\r\n'));
    expect((await c.status('Sent')).messages).toBe(2);

    await c.create('Arhivă');
    await c.rename('Arhivă', 'Arhivă 2026');
    expect((await c.list()).some((f) => f.name === 'Arhivă 2026')).toBe(true);
    await c.remove('Arhivă 2026');
    expect((await c.list()).some((f) => f.name.startsWith('Arhivă'))).toBe(false);

    await c.expunge([1]);
    await c.select('INBOX');
    expect(await c.flags()).toEqual([]);
    await c.logout();
  });

  it('refuses a wrong password', async () => {
    const c = await Imap.open(await tcp(IMAP_PORT), 'none');
    await expect(c.login('testuser', 'nope')).rejects.toThrow(/LOGIN failed/);
    await c.logout();
  });
});

describe('IMAP parsing', () => {
  it('reads nested lists, quoted strings, NIL, bracketed atoms and literals', () => {
    const lit = new Uint8Array([1, 2]);
    expect(parseTokens('* 1 FETCH (UID 5 FLAGS (\\Seen) BODY[] \u00010\u0001 X NIL "a \\"b\\"")', [lit])).toEqual([
      '*', '1', 'FETCH', ['UID', '5', 'FLAGS', ['\\Seen'], 'BODY[]', lit, 'X', null, 'a "b"'],
    ]);
    expect(parseTokens('* OK [UIDVALIDITY 3] ok', [])).toEqual(['*', 'OK', '[UIDVALIDITY 3]', 'ok']);
  });

  it('round-trips modified UTF-7 mailbox names', () => {
    for (const n of ['INBOX', 'Größe', 'a&b', '日本語', 'Arhivă/2026']) expect(decodeMailbox(encodeMailbox(n))).toBe(n);
    expect(encodeMailbox('a&b')).toBe('a&-b');
  });
});

describe('SMTP client', () => {
  let listener: ReturnType<typeof Bun.listen> | null = null;
  const seen: string[] = [];
  let data = '';
  beforeAll(() => {
    listener = Bun.listen({
      hostname: '127.0.0.1',
      port: SMTP_PORT,
      socket: {
        open(s) {
          (s as any).inData = false;
          (s as any).buf = '';
          s.write('220 test ESMTP\r\n');
        },
        data(s, d) {
          const st = s as any;
          st.buf += new TextDecoder().decode(d);
          let i: number;
          while ((i = st.buf.indexOf('\r\n')) >= 0) {
            const line = st.buf.slice(0, i);
            st.buf = st.buf.slice(i + 2);
            if (st.inData) {
              if (line === '.') {
                st.inData = false;
                s.write('250 queued\r\n');
              } else data += line + '\n';
              continue;
            }
            seen.push(line);
            if (line.startsWith('EHLO')) s.write('250-test\r\n250 AUTH PLAIN LOGIN\r\n');
            else if (line.startsWith('AUTH PLAIN')) s.write(line.endsWith(btoa('\0u\0p')) ? '235 ok\r\n' : '535 no\r\n');
            else if (line.startsWith('MAIL') || line.startsWith('RCPT')) s.write(line.includes('bad@') ? '550 no such user\r\n' : '250 ok\r\n');
            else if (line === 'DATA') {
              st.inData = true;
              s.write('354 go\r\n');
            } else if (line === 'QUIT') {
              s.write('221 bye\r\n');
              s.end();
            }
          }
        },
      },
    });
  });
  afterAll(() => listener?.stop(true));

  it('submits a message with auth, envelope and dot-stuffed data', async () => {
    const { raw } = buildMessage({
      from: { address: 'me@x.test', name: 'Eu' },
      to: [{ address: 'a@x.test' }],
      cc: [],
      bcc: [{ address: 'hidden@x.test' }],
      subject: 'Salut ș',
      text: 'line\n.dot line\n',
      attachments: [],
    });
    await sendMail(await tcp(SMTP_PORT), 'none', { user: 'u', password: 'p' }, { from: 'me@x.test', to: ['a@x.test', 'hidden@x.test'] }, raw);
    expect(seen).toContain('MAIL FROM:<me@x.test>');
    expect(seen).toContain('RCPT TO:<hidden@x.test>');
    expect(data).not.toMatch(/^Bcc:/m);
    expect(data).toContain('Subject: =?UTF-8?B?');
    const back = await parseMessage(new TextEncoder().encode(data.replace(/\n/g, '\r\n')));
    expect(back.text).toBe('line\n.dot line\n');
    expect(back.subject).toBe('Salut ș');
  });

  it('reports a refused recipient with its code', async () => {
    const { raw } = buildMessage({ from: { address: 'me@x.test' }, to: [{ address: 'bad@x.test' }], cc: [], bcc: [], subject: 's', text: 't', attachments: [] });
    await expect(
      sendMail(await tcp(SMTP_PORT), 'none', { user: 'u', password: 'p' }, { from: 'me@x.test', to: ['bad@x.test'] }, raw),
    ).rejects.toMatchObject({ code: 550 });
  });

  it('refuses CR/LF in an address instead of injecting a command', async () => {
    await expect(
      sendMail(await tcp(SMTP_PORT), 'none', null, { from: 'me@x.test>\r\nRCPT TO:<evil@x.test', to: [] }, new Uint8Array()),
    ).rejects.toThrow(/invalid address/);
  });
});

describe('MIME', () => {
  it('dot-stuffs and terminates', () => {
    expect(new TextDecoder().decode(dotStuff(new TextEncoder().encode('a\n.b')))).toBe('a\r\n..b\r\n.\r\n');
  });

  it('builds a multipart message with an attachment that parses back', async () => {
    const { raw, messageId } = buildMessage({
      from: { address: 'me@x.test' },
      to: [{ address: 'a@x.test', name: 'Ăna' }],
      cc: [],
      bcc: [],
      subject: 'Factura',
      text: 'vezi',
      html: '<p>vezi</p>',
      inReplyTo: '<m1@x.test>',
      attachments: [{ filename: 'f.pdf', mimeType: 'application/pdf', content: new Uint8Array([37, 80, 68, 70]) }],
    });
    const p = await parseMessage(raw);
    expect(p.messageId).toBe(messageId);
    expect(p.inReplyTo).toBe('<m1@x.test>');
    expect(p.to).toEqual([{ address: 'a@x.test', name: 'Ăna' }]);
    expect(p.html).toBe('<p>vezi</p>');
    expect(p.attachments.map((a) => [a.filename, a.size])).toEqual([['f.pdf', 4]]);
  });

  it('refuses header injection through an address', () => {
    expect(() => buildMessage({ from: { address: 'me@x.test' }, to: [{ address: 'a@x.test\r\nBcc: e@x.test' }], cc: [], bcc: [], subject: 's', text: 't', attachments: [] })).toThrow(/invalid address/);
  });

  it('encodes long non-ASCII words under 76 columns and strips scripts', () => {
    for (const w of encodeWord('ș'.repeat(80)).split(' ')) expect(w.length).toBeLessThanOrEqual(75);
    expect(cleanHtml('<a href="https://x.test">x</a><iframe src="https://e"></iframe>')).toBe(
      '<a href="https://x.test" target="_blank" rel="noopener noreferrer">x</a>',
    );
  });
});

describe('STARTTLS', () => {
  /** A peer that answers STARTTLS and, in the same packet, injects a plaintext reply. */
  function stream(script: (line: string) => string): JobTcpStream {
    const out: Uint8Array[] = [];
    let first = true;
    return {
      async read() {
        if (first) {
          first = false;
          return new TextEncoder().encode(script(''));
        }
        return out.shift() ?? null;
      },
      async write(d) {
        const line = typeof d === 'string' ? d : new TextDecoder().decode(d);
        out.push(new TextEncoder().encode(script(line.trim())));
      },
      async startTls() {
        throw new Error('must not upgrade');
      },
      async close() {},
    };
  }

  it('SMTP refuses plaintext buffered behind the STARTTLS reply', async () => {
    const s = stream((l) =>
      l === '' ? '220 hi\r\n' : l.startsWith('EHLO') ? '250-x\r\n250 STARTTLS\r\n' : l === 'STARTTLS' ? '220 go\r\n250 AUTH PLAIN\r\n' : '250 ok\r\n',
    );
    await expect(sendMail(s, 'starttls', null, { from: 'a@x.test', to: ['b@x.test'] }, new Uint8Array())).rejects.toThrow(/after STARTTLS/);
  });

  it('IMAP refuses plaintext buffered behind the STARTTLS reply', async () => {
    const s = stream((l) => {
      if (l === '') return '* OK hi\r\n';
      const tag = l.split(' ')[0];
      if (l.endsWith('CAPABILITY')) return `* CAPABILITY IMAP4rev1 STARTTLS\r\n${tag} OK done\r\n`;
      if (l.endsWith('STARTTLS')) return `${tag} OK go\r\n* CAPABILITY IMAP4rev1 AUTH=PLAIN\r\n`;
      return `${tag} OK\r\n`;
    });
    await expect(Imap.open(s, 'starttls')).rejects.toThrow(/after STARTTLS/);
  });
});
