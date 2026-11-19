// A new version is a stored file the caller uploaded and hands the action
// (`$files.read`, ADR 0052), recorded as a history row as the caller — on the
// engine's real `/ext/*` chain (`onEngine`). Each member holds per-user grants on
// `cloud_file_versions`, so the engine's rules, not this extension, decide what
// is written and what is pruned.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { onEngine } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const BASE = '/ext/storage/cloud';
const V = 'cloud_file_versions';

d('storage/cloud — file versions', () => {
  let e: Awaited<ReturnType<typeof onEngine>>;
  const tag = `cloudv-${Date.now()}`;
  const who: Record<'writer' | 'pruner' | 'reader', { cookie: string; userId: string }> = {} as never;

  beforeAll(async () => {
    e = await onEngine(import.meta.dir);
    const member = (actions: string[]) =>
      e.harness.createMemberSession(e.engineApp, e.db, { grants: [{ collection: V, actions }] });
    who.writer = await member(['read', 'create', 'execute']);
    who.pruner = await member(['read', 'create', 'delete', 'execute']);
    who.reader = await member(['read', 'execute']);
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    const users = Object.values(who).map((u) => u.userId);
    await e.harness.asEveryTenant(e.db, (trx: any) =>
      e.sql`DELETE FROM zv_media_files WHERE created_by IN (${e.sql.join(users)})`.execute(trx),
    );
    await e.done();
  });

  const act = (u: { cookie: string }, action: string, body: unknown) =>
    e.app.request(`${BASE}/actions/${action}`, {
      method: 'POST',
      headers: { cookie: u.cookie, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  /** Upload `name` as `u`, then hand it to `addFileVersion` as a version of `fileId`. */
  const upload = async (u: { cookie: string }, fileId: string, name: string, hand = true) => {
    const file = await original(u, name);
    return act(u, 'addFileVersion', { file_id: fileId, file, ...(hand ? { $files: { read: [file] } } : {}) });
  };
  /** A file of `u`'s, through the engine's own `/api/storage/upload`. */
  const original = async (u: { cookie: string }, name = `${tag}-orig.txt`) => {
    const form = new FormData();
    form.append('file', new File([`bytes of ${name}`], name, { type: 'text/plain' }));
    const res = await e.engineApp.request('/api/storage/upload', {
      method: 'POST',
      headers: { cookie: u.cookie },
      body: form,
    });
    expect(res.status).toBe(201);
    return ((await res.json()) as { file: { id: string } }).file.id;
  };
  const history = (fileId: string) =>
    e.harness.asEveryTenant(e.db, (trx: any) =>
      e.sql`SELECT id, version::int AS version, version_file_id, created_by FROM zvd_${e.sql.raw(V)}
             WHERE file_id = ${fileId} ORDER BY version`.execute(trx),
    ).then((r: any) => r.rows as Array<{ id: string; version: number; version_file_id: string; created_by: string }>);
  const fileRow = (id: string) =>
    e.harness.asEveryTenant(e.db, (trx: any) =>
      e.sql`SELECT created_by, visibility FROM zv_media_files WHERE id = ${id}`.execute(trx),
    ).then((r: any) => r.rows[0] as { created_by: string; visibility: string } | undefined);
  const named = (name: string) =>
    e.harness.asEveryTenant(e.db, (trx: any) =>
      e.sql`SELECT id FROM zv_media_files WHERE original_name = ${name}`.execute(trx),
    ).then((r: any) => r.rows.length as number);

  it('records the handed file as the version after version 1, as the caller', async () => {
    const fileId = await original(who.writer);
    const res = await upload(who.writer, fileId, `${tag}-v2.txt`);
    expect(res.status).toBe(200);
    const rows = await history(fileId);
    expect(rows.map((r) => r.version)).toEqual([1, 2]);
    expect(rows[0]!.version_file_id).toBe(fileId);
    expect(rows.every((r) => r.created_by === who.writer.userId)).toBe(true);
    expect(await fileRow(rows[1]!.version_file_id)).toEqual({ created_by: who.writer.userId, visibility: 'personal' });
  });

  it('refuses a file the request did not hand it, and records nothing', async () => {
    const fileId = await original(who.writer);
    const res = await upload(who.writer, fileId, `${tag}-unhanded.txt`, false);
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('file_not_granted');
    expect(await history(fileId)).toEqual([]);
  });

  it('records nothing when the caller may not create a history row', async () => {
    const fileId = crypto.randomUUID();
    expect((await upload(who.reader, fileId, `${tag}-refused.txt`)).status).toBe(403);
    expect(await history(fileId)).toEqual([]);
  });

  it('restores an older version as a new one pointing at its file', async () => {
    const fileId = await original(who.writer);
    await upload(who.writer, fileId, `${tag}-r2.txt`);
    const [v1] = await history(fileId);
    const res = await act(who.writer, 'restoreVersion', { version_id: v1!.id });
    expect(res.status).toBe(200);
    const rows = await history(fileId);
    expect(rows.map((r) => [r.version, r.version_file_id])).toEqual([
      [1, fileId],
      [2, rows[1]!.version_file_id],
      [3, fileId],
    ]);
  });

  it('prunes past 20 versions only as far as the caller may delete', async () => {
    for (const u of [who.writer, who.pruner]) {
      const fileId = await original(u);
      for (let i = 2; i <= 22; i++) {
        expect((await upload(u, fileId, `${tag}-${u.userId}-p${i}.txt`)).status).toBe(200);
      }
      const rows = await history(fileId);
      if (u === who.writer) {
        // No delete on the collection: nothing goes.
        expect(rows.map((r) => r.version)).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
        continue;
      }
      expect(rows.map((r) => r.version)).toEqual(Array.from({ length: 20 }, (_, i) => i + 3));
      // Only rows go: an action cannot delete a stored file, so a pruned version's stays the caller's.
      expect(await fileRow(fileId)).toBeDefined();
      expect(await named(`${tag}-${u.userId}-p2.txt`)).toBe(1);
    }
  }, 120_000);
});
