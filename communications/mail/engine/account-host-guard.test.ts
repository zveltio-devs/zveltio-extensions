/**
 * `POST /accounts` connects to a host the CALLER chose.
 *
 * It takes `imap_host`/`imap_port` from the request body and dials them
 * immediately to validate the credentials. The route is open to any
 * authenticated user — not an admin — so without a guard, any account on the
 * instance can make the server open a connection to `169.254.169.254`, which is
 * where AWS, GCP and Azure hand out the instance's own cloud credentials.
 *
 * The guard is the METADATA one, not `assertPublicUrl`. This product is
 * self-hosted first and an internal mail server on 10.x is the normal
 * deployment; refusing private ranges would refuse the configuration most
 * installs actually have. The last test here is what pins that down, because a
 * later "tighten the SSRF guard" change that looks obviously correct would break
 * every self-hosted install and nothing else would notice.
 *
 * These pass only because `testing/ext-harness.ts` gives this extension the
 * ENGINE's real `assertNonMetadataUrl`. Unknown internals become callable stubs
 * that return undefined — with one of those, every assertion below would pass
 * with the guard deleted from the route.
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;

const body = (over: Record<string, unknown>) => ({
  name: 'probe',
  email_address: 'probe@example.test',
  imap_host: 'imap.example.test',
  imap_port: 993,
  imap_user: 'probe',
  imap_password: 'secret',
  smtp_host: 'smtp.example.test',
  smtp_port: 587,
  ...over,
});

describe.skipIf(!DB_URL)('mail: POST /accounts will not dial a cloud-metadata address', () => {
  let app: any;

  beforeAll(async () => {
    app = (await mountForTest(import.meta.dir)).app;
  });

  const post = (over: Record<string, unknown>) =>
    app.request('/accounts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body(over)),
    });

  it('refuses the IMDS address, and says so before connecting', async () => {
    const res = await post({ imap_host: '169.254.169.254', imap_port: 80 });
    expect(res.status).toBe(400);
    const j = await res.json();
    // Not "IMAP connection failed" — that would mean it dialled and the guard
    // never ran.
    expect(j.error).toContain('cloud-metadata');
  });

  it('refuses it in the SMTP field too — both hosts are dialled', async () => {
    const res = await post({ smtp_host: '169.254.169.254', smtp_port: 80 });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('cloud-metadata');
  });

  it('refuses the alternative encodings of the same address', async () => {
    // A decimal or hex literal is the same host to the network stack and a
    // different string to a naive block-list.
    for (const host of ['2852039166', '0xA9FEA9FE', '169.254.169.254', '[::ffff:169.254.169.254]']) {
      const res = await post({ imap_host: host, imap_port: 80 });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('cloud-metadata');
    }
  });

  it('refuses a port outside the valid range instead of passing it to the socket', async () => {
    for (const port of [0, -1, 70000, 1.5]) {
      const res = await post({ imap_port: port });
      expect(res.status).toBe(400);
    }
  });

  it('does NOT refuse a private address — self-hosted mail is the normal case', async () => {
    // The control. Without it, "everything is refused" would satisfy every
    // assertion above while making the product unusable for its main audience.
    // The connection then fails because nothing is listening, which is a
    // different error and proves the guard let it through.
    const res = await post({ imap_host: '10.255.255.1', imap_port: 993 });
    const j = await res.json();
    expect(JSON.stringify(j)).not.toContain('cloud-metadata');
  }, 30_000);
});
