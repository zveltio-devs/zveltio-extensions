// Writes need the engine object `admin`, never the bare name `traceability`:
// a bare Casbin object is a collection (ADR 0002), so a collection named
// `traceability` would hand its writers this whole API.
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('operations/traceability — writes need admin', () => {
  const post = async (opts: Parameters<typeof mountForTest>[1]) => {
    const { app } = await mountForTest(import.meta.dir, opts);
    return app.request('/suppliers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
  };

  it('a member holding write on a collection named traceability cannot write', async () => {
    const res = await post({ admin: false, grants: [{ resource: 'traceability', action: 'write' }] });
    expect(res.status).toBe(403);
  });

  it('an admin gets past the gate', async () => {
    expect((await post({ admin: true })).status).not.toBe(403);
  });

  it('a member still reads', async () => {
    const { app } = await mountForTest(import.meta.dir, { admin: false });
    expect((await app.request('/me')).status).toBe(200);
  });
});
