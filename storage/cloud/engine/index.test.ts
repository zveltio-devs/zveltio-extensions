// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { describe, expect, it } from 'bun:test';
import { extensionContract, mountForTest } from '../../../testing/ext-harness';

await extensionContract(import.meta.dir);

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

/**
 * The drive (browse / upload / delete / download) is the extension's whole
 * point and none of it existed: the page called GET /files and POST /upload
 * against routes that were never registered, and GET /files only *looked*
 * reachable because GET /:token swallows any single path segment.
 *
 * These run with NO S3 configured — the state a fresh install is in, and the
 * exact configuration that made content/media 500 on every upload.
 */
d('storage/cloud drive', () => {
  it('lists the root as an empty directory rather than 404ing', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const res = await app.request('/files?path=%2F');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { path: string; data: unknown[] };
    expect(body.path).toBe('/');
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('uploads without object storage configured, and the file then appears', async () => {
    expect(process.env.S3_ENDPOINT).toBeUndefined();
    const { app } = await mountForTest(import.meta.dir);

    const name = `probe-${Date.now()}.txt`;
    const fd = new FormData();
    fd.append('file', new File(['hello drive'], name, { type: 'text/plain' }));
    fd.append('path', '/');
    const up = await app.request('/upload', { method: 'POST', body: fd });
    expect(up.status).toBe(201);
    const { file } = (await up.json()) as { file: { id: string; original_name: string } };
    expect(file.original_name).toBe(name);

    const list = await app.request('/files?path=%2F');
    const body = (await list.json()) as { data: Array<{ name: string; is_folder: boolean }> };
    const found = body.data.find((e) => e.name === name);
    expect(found).toBeDefined();
    expect(found?.is_folder).toBe(false);
  });

  it('creates the folder path on upload and browses into it', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const dir = `dir-${Date.now()}`;

    const fd = new FormData();
    fd.append('file', new File(['nested'], 'nested.txt', { type: 'text/plain' }));
    fd.append('path', `/${dir}`);
    expect((await app.request('/upload', { method: 'POST', body: fd })).status).toBe(201);

    // The new folder shows up at the root...
    const root = (await (await app.request('/files?path=%2F')).json()) as {
      data: Array<{ name: string; is_folder: boolean }>;
    };
    expect(root.data.some((e) => e.name === dir && e.is_folder)).toBe(true);

    // ...and the file lives inside it, not at the root.
    const inside = (await (
      await app.request(`/files?path=${encodeURIComponent(`/${dir}`)}`)
    ).json()) as { data: Array<{ name: string }> };
    expect(inside.data.map((e) => e.name)).toContain('nested.txt');
    expect(root.data.map((e) => e.name)).not.toContain('nested.txt');
  });

  it('404s an unknown folder path instead of silently listing the root', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const res = await app.request('/files?path=%2Fdoes-not-exist');
    expect(res.status).toBe(404);
  });

  it('delete soft-deletes, so the file leaves the listing', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const name = `del-${Date.now()}.txt`;
    const fd = new FormData();
    fd.append('file', new File(['bye'], name, { type: 'text/plain' }));
    fd.append('path', '/');
    const { file } = (await (
      await app.request('/upload', { method: 'POST', body: fd })
    ).json()) as { file: { id: string } };

    expect((await app.request(`/files/${file.id}`, { method: 'DELETE' })).status).toBe(200);

    const body = (await (await app.request('/files?path=%2F')).json()) as {
      data: Array<{ name: string }>;
    };
    expect(body.data.map((e) => e.name)).not.toContain(name);
  });

  it('download reports storage is unconfigured rather than 500ing', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const fd = new FormData();
    fd.append('file', new File(['dl'], `dl-${Date.now()}.txt`, { type: 'text/plain' }));
    fd.append('path', '/');
    const { file } = (await (
      await app.request('/upload', { method: 'POST', body: fd })
    ).json()) as { file: { id: string } };

    const res = await app.request(`/files/${file.id}/download`);
    expect(res.status).toBe(503);

    expect((await app.request('/files/00000000-0000-4000-8000-0000000000ff/download')).status).toBe(
      404,
    );
  });

  it('requires auth on every drive route', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false });
    expect((await app.request('/files?path=%2F')).status).toBe(401);
    expect((await app.request('/upload', { method: 'POST', body: new FormData() })).status).toBe(
      401,
    );
    const id = '00000000-0000-4000-8000-0000000000ff';
    expect((await app.request(`/files/${id}`, { method: 'DELETE' })).status).toBe(401);
    expect((await app.request(`/files/${id}/download`)).status).toBe(401);
  });
});
