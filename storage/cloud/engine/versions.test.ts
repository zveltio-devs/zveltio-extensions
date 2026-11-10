// A new version is a stored file and a history row, committed together, as the
// caller (ADR 0034) — on the engine's real `/ext/*` chain (`onEngine`). Each
// member holds per-user grants on `cloud_file_versions`, so the engine's rules,
// not this extension, decide what is written and what is pruned.
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
    who.pruner = await member(['read', 'create', 'delete']);
    who.reader = await member(['read']);
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    const users = Object.values(who).map((u) => u.userId);
    await e.harness.asEveryTenant(e.db, (trx: any) =>
      e.sql`DELETE FROM zv_media_files WHERE created_by IN (${e.sql.join(users)})`.execute(trx),
    );
    await e.done();
  });

  const upload = async (u: { cookie: string }, path: string, name: string) => {
    const form = new FormData();
    form.append('file', new File([`bytes of ${name}`], name, { type: 'text/plain' }));
    return e.app.request(`${BASE}${path}`, { method: 'POST', headers: { cookie: u.cookie }, body: form });
  };
  /** A file of `u`'s, through the engine's own `/api/storage/upload`. */
  const original = async (u: { cookie: string }) => {
    const form = new FormData();
    form.append('file', new File(['v1'], `${tag}-orig.txt`, { type: 'text/plain' }));
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

  it('stores the version as a private file of the caller and records it after version 1', async () => {
    const fileId = await original(who.writer);
    const res = await upload(who.writer, `/files/${fileId}/versions`, `${tag}-v2.txt`);
    expect(res.status).toBe(201);
    const rows = await history(fileId);
    expect(rows.map((r) => r.version)).toEqual([1, 2]);
    expect(rows[0]!.version_file_id).toBe(fileId);
    expect(rows.every((r) => r.created_by === who.writer.userId)).toBe(true);
    expect(await fileRow(rows[1]!.version_file_id)).toEqual({ created_by: who.writer.userId, visibility: 'personal' });
  });

  it('rolls the stored file back when the history row is refused', async () => {
    const name = `${tag}-refused.txt`;
    const res = await upload(who.reader, `/files/${crypto.randomUUID()}/versions`, name);
    expect(res.status).toBe(403);
    expect(await named(name)).toBe(0);
  });

  it('restores an older version as a new one pointing at its file', async () => {
    const fileId = await original(who.writer);
    await upload(who.writer, `/files/${fileId}/versions`, `${tag}-r2.txt`);
    const [v1] = await history(fileId);
    const res = await e.app.request(`${BASE}/actions/restoreVersion`, {
      method: 'POST',
      headers: { cookie: who.writer.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ version_id: v1!.id }),
    });
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
        expect((await upload(u, `/files/${fileId}/versions`, `${tag}-${u.userId}-p${i}.txt`)).status).toBe(201);
      }
      const rows = await history(fileId);
      if (u === who.writer) {
        // No delete on the collection: nothing goes.
        expect(rows.map((r) => r.version)).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
        continue;
      }
      expect(rows.map((r) => r.version)).toEqual(Array.from({ length: 20 }, (_, i) => i + 3));
      // Version 1 is the file itself, which stays; version 2's file is gone.
      expect(await fileRow(fileId)).toBeDefined();
      expect(await named(`${tag}-${u.userId}-p2.txt`)).toBe(0);
      expect(await named(`${tag}-${u.userId}-p3.txt`)).toBe(1);
    }
  }, 120_000);
});
