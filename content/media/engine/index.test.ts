// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { describe, expect, it } from 'bun:test';
import { extensionContract, mountForTest } from '../../../testing/ext-harness';

await extensionContract(import.meta.dir);

// Regression: uploads without S3 configured must not crash. The route used to
// instantiate an eager @aws-sdk client and PUT unconditionally, so every upload
// on a bare self-hosted install 500'd; it now mirrors the CORE media routes'
// lazy aws4fetch pattern (skip object storage when S3_ENDPOINT is unset).
const d = process.env.TEST_DATABASE_URL && !process.env.S3_ENDPOINT ? describe : describe.skip;
d('content/media bespoke', () => {
  it('POST /upload records the file without S3 configured', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const fd = new FormData();
    fd.append('file', new File(['zveltio-harness'], 'harness.txt', { type: 'text/plain' }));
    const res = await app.request('/upload', { method: 'POST', body: fd });
    if (res.status >= 300) console.error('upload →', res.status, (await res.clone().text()).slice(0, 300));
    expect([500, 502, 504]).not.toContain(res.status);
    expect(res.status).toBeLessThan(300);
  });
});
