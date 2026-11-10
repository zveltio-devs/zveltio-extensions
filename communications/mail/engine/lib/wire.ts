// A line- and literal-oriented reader over the engine's relayed TCP stream
// (`host.egress.connect`, ADR 0026 amendment). IMAP and SMTP are both "a line,
// sometimes followed by N raw bytes"; this is the one place that buffers.

import type { JobTcpStream } from '@zveltio/sdk/extension';

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Longest line accepted from a server; a longer one is a broken or hostile peer. */
const MAX_LINE = 1024 * 1024;

export class Wire {
  private buf = new Uint8Array(0);
  /** Bytes read from the server so far: the relay's per-run budget is counted against it. */
  bytesIn = 0;

  constructor(private readonly stream: JobTcpStream) {}

  private async fill(): Promise<void> {
    const chunk = await this.stream.read();
    if (chunk === null) throw new Error('the mail server closed the connection');
    this.bytesIn += chunk.length;
    const next = new Uint8Array(this.buf.length + chunk.length);
    next.set(this.buf);
    next.set(chunk, this.buf.length);
    this.buf = next;
  }

  /** One line without its CRLF (a bare LF is accepted too). */
  async line(): Promise<string> {
    for (;;) {
      const i = this.buf.indexOf(10);
      if (i >= 0) {
        const end = i > 0 && this.buf[i - 1] === 13 ? i - 1 : i;
        const text = dec.decode(this.buf.subarray(0, end));
        this.buf = this.buf.slice(i + 1);
        return text;
      }
      if (this.buf.length > MAX_LINE) throw new Error('the mail server sent a line longer than 1 MiB');
      await this.fill();
    }
  }

  /** Exactly `n` raw bytes (an IMAP literal). */
  async bytes(n: number): Promise<Uint8Array> {
    while (this.buf.length < n) await this.fill();
    const out = this.buf.slice(0, n);
    this.buf = this.buf.slice(n);
    return out;
  }

  /** True when bytes the server sent are still unread (STARTTLS must not begin then). */
  get pending(): boolean {
    return this.buf.length > 0;
  }

  write(data: string | Uint8Array): Promise<void> {
    return this.stream.write(typeof data === 'string' ? enc.encode(data) : data);
  }

  startTls(): Promise<void> {
    return this.stream.startTls();
  }

  async close(): Promise<void> {
    try {
      await this.stream.close();
    } catch {
      // Already closed by the server or the engine: nothing left to release.
    }
  }
}
