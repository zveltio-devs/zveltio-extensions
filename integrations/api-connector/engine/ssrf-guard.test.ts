/**
 * `POST /connections` takes a `base_url` and the connector later fetches it, so
 * the URL is a server-side request to an address the caller chose.
 *
 * The route calls `ctx.internals.assertPublicUrl`, which refuses by THROWING.
 * That is the shape the contract harness could not test: unknown `ctx.internals`
 * members became callable stubs returning `undefined`, so the guard resolved
 * silently and every URL was accepted. A test written to prove the refusal would
 * have passed with the guard deleted from the route.
 *
 * There was no such test, which is why nothing showed. These exist so that the
 * next change to that route has something to break.
 *
 * They pass only because `testing/ext-harness.ts` now hands this extension the
 * ENGINE's real `assertPublicUrl`. Verified by removing that line: the refusals
 * below turn into 201s.
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;

const body = (base_url: string) => ({
  name: `probe-${Math.random().toString(36).slice(2, 8)}`,
  base_url,
  auth_type: 'none',
});

describe.skipIf(!DB_URL)('api-connector: POST /connections refuses an unsafe base_url', () => {
  let app: any;

  beforeAll(async () => {
    app = (await mountForTest(import.meta.dir)).app;
  });

  const create = (base_url: string) =>
    app.request('/connections', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body(base_url)),
    });

  it('refuses the cloud-metadata address', async () => {
    const res = await create('http://169.254.169.254/latest/meta-data/');
    expect(res.status).toBe(400);
  });

  it('refuses loopback and private ranges — this connector calls out to the internet', async () => {
    // Unlike a mail server or an Ollama endpoint, an API connector has no
    // legitimate reason to point inside the network, so the guard here is the
    // full public-URL one rather than the metadata-only one.
    for (const url of ['http://127.0.0.1:6379/', 'http://10.0.0.5/admin', 'http://192.168.1.1/']) {
      const res = await create(url);
      expect(res.status).toBe(400);
    }
  });

  it('refuses a non-http scheme', async () => {
    for (const url of ['file:///etc/passwd', 'gopher://evil.test/']) {
      const res = await create(url);
      expect(res.status).toBe(400);
    }
  });

  it('accepts an ordinary public URL — the control', async () => {
    // Without this, "everything is refused" would satisfy every assertion above
    // while making the extension useless.
    const res = await create('https://api.example.com/v1');
    expect(res.status).toBe(201);
  });
});
