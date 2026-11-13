import { Hono } from 'hono';
import { MULTIPART_REQUIRED, readMultipart, type ExtensionContext } from '@zveltio/sdk/extension';
import { addVersion, KEEP_VERSIONS, VERSIONS } from './versions.js';

// The one thing `/api/storage`, the data API and the actions cannot do: store a
// new version's bytes and record it in the same transaction. Everything goes
// through `ctx.host(c)` as the caller (ADR 0034): the engine's size, quota,
// type and folder checks on the file, its rules on the history row. A throw
// rolls the request back, the stored bytes with it.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A refusal the engine threw (a status below 500): the caller may not, so it is left as it is. */
const refused = (err: unknown) => {
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' && status < 500;
};

export function cloudRoutes(ctx: ExtensionContext): Hono {
  const app = new Hono();

  // POST /files/:id/versions — multipart `file`, optional `note` and
  // `folder_id` (where the version's file is stored; the root without one).
  app.post('/files/:id/versions', async (c) => {
    const fileId = c.req.param('id');
    if (!UUID.test(fileId)) return c.json({ error: 'File not found' }, 404);
    const form = await readMultipart(c);
    if (!form) return c.json(MULTIPART_REQUIRED, 400);
    const file = form.get('file');
    if (!(file instanceof File)) return c.json({ error: 'No file provided' }, 400);
    const note = form.get('note');
    const folderId = form.get('folder_id');

    const { files, collections } = ctx.host(c);
    if (!files) throw new Error('storage/cloud: host.files is missing; this route runs inline only');
    const stored = await files.put(file.name, new Uint8Array(await file.arrayBuffer()), {
      ...(typeof folderId === 'string' && folderId ? { folderId } : {}),
    });
    const { row, versions } = await addVersion(
      collections,
      fileId,
      stored.id,
      typeof note === 'string' && note ? note : null,
    );

    // Past KEEP_VERSIONS, the oldest go first: the row, then its file unless the
    // file itself or a kept version is it. Each is the caller's to delete: a row
    // the engine refuses stops the pruning, a file it refuses stays.
    const kept = versions.slice(0, KEEP_VERSIONS);
    const live = new Set([fileId, ...kept.map((v) => String(v.version_file_id))]);
    for (const old of versions.slice(KEEP_VERSIONS).reverse()) {
      try {
        await collections.delete(VERSIONS, String(old.id));
      } catch (err) {
        if (refused(err)) break;
        throw err;
      }
      const oldFile = String(old.version_file_id);
      if (live.has(oldFile)) continue;
      live.add(oldFile);
      await files.delete(oldFile).catch((err) => {
        if (!refused(err)) throw err;
      });
    }

    return c.json({ version: row }, 201);
  });

  return app;
}
