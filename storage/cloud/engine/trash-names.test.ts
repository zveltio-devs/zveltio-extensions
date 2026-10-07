// The trash and a file's version history name who trashed or uploaded it. Both
// joined `"user"` through `ctx.db`, which the engine refuses since #858, so both
// lists answered 500. The names come from `ctx.internals.getUserNames` now.
import { afterAll, describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;
const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';

d('storage/cloud — trash and versions name the user', () => {
  let pg: { unsafe: (q: string, a?: unknown[]) => Promise<any>; close: () => Promise<void> };
  let fileId = '';

  afterAll(async () => {
    if (fileId) await pg.unsafe('DELETE FROM zv_media_files WHERE id = $1', [fileId]);
    await pg?.close();
  });

  it('lists a trashed file with the name of who trashed it, and its versions with the uploader', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const { SQL } = await import('bun');
    pg = new SQL(process.env.TEST_DATABASE_URL!) as unknown as typeof pg;
    const [row] = await pg.unsafe(
      `INSERT INTO zv_media_files (filename, original_name, mimetype, size, storage_path, created_by, deleted_at, deleted_by)
       VALUES ('t.txt', 't.txt', 'text/plain', 1, 'media/t.txt', $1, now(), $1) RETURNING id::text`,
      [HARNESS_USER],
    );
    fileId = row.id;
    await pg.unsafe(
      `INSERT INTO zv_media_versions (file_id, version_num, storage_path, size_bytes, mime_type, uploaded_by)
       VALUES ($1, 1, 'media/t.v1.txt', 1, 'text/plain', $2)`,
      [fileId, HARNESS_USER],
    );

    const trash = await app.request('/trash');
    expect(trash.status).toBe(200);
    const { items } = (await trash.json()) as { items: Array<{ id: string; deleted_by_name: string | null }> };
    expect(items.find((i) => i.id === fileId)?.deleted_by_name).toBe('Ext Harness');

    const versions = await app.request(`/files/${fileId}/versions`);
    expect(versions.status).toBe(200);
    const body = (await versions.json()) as { versions: Array<{ uploaded_by_name: string | null }> };
    expect(body.versions[0]?.uploaded_by_name).toBe('Ext Harness');
  });
});
