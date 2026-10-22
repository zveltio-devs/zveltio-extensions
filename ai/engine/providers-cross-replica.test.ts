// A provider saved on one replica is the provider on every replica.
//
// Each firm's providers are cached per process (`providersFor`). Saving one
// dropped the cache on the replica that served the request only: every other
// replica kept the old key — or a deleted provider — until it restarted. Now the
// save sends `providers.changed` on the engine's bus (`ctx.broadcast`) and every
// replica, this one included, drops that firm's providers once it commits.
//
// The other replica's message is delivered through `dispatchToWs`, as the Valkey
// / pg_notify subscriber does. The provider is a local OpenAI-compatible server
// that answers with the bearer token it was sent, so a reply names the key used.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms } from '../../testing/ext-harness';
import {
  dispatchToWs,
  EXTENSION_BROADCAST_EVENT,
  realtimeBus,
} from '../../../zveltio/packages/engine/src/lib/runtime/index.js';
import { extensionBroadcastsMissed } from '../../../zveltio/packages/engine/src/lib/extensions/broadcast.js';

const A = '00000000-0000-4000-8000-0000000a3aaa';
const B = '00000000-0000-4000-8000-0000000a3aab';

describe.skipIf(!process.env.TEST_DATABASE_URL)('ai: a provider change reaches every replica', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;
  let server: ReturnType<typeof Bun.serve>;
  const bus = realtimeBus();
  const origPublish = bus.publish;
  const sent: any[] = [];

  const chat = async (tenant: string) => {
    const res = await (await h.asGod(tenant)).request('/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    return res.status === 200 ? (await res.json()).result.content : res.status;
  };
  /** Another replica saved `tenant`'s key: the row changes, this process is not told. */
  const savedElsewhere = (tenant: string, key: string) =>
    h.pool.query(`UPDATE zv_ai_providers SET api_key = $2 WHERE tenant_id = $1`, [tenant, key]);
  const fromPeer = (tenantId: string) =>
    dispatchToWs({
      originId: 'eng-peer',
      event: EXTENSION_BROADCAST_EVENT,
      collection: 'ai',
      data: { name: 'providers.changed' },
      tenantId,
      timestamp: new Date().toISOString(),
    });

  beforeAll(async () => {
    server = Bun.serve({
      port: 0,
      fetch: (req) =>
        Response.json({
          model: 'echo',
          choices: [{ message: { content: req.headers.get('authorization') } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
    });
    bus.publish = async (payload: any) => {
      sent.push(payload);
    };
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    // Plaintext keys: `decryptApiKey` passes a value without an envelope through.
    await h.pool.query(
      `INSERT INTO zv_ai_providers (tenant_id, name, label, api_key, base_url, is_default, is_active) VALUES
         ($1, 'openai', 'A', 'sk-A', $3, true, true),
         ($2, 'openai', 'B', 'sk-B', $3, true, true)`,
      [A, B, `http://127.0.0.1:${server.port}/v1`],
    );
  });

  afterAll(async () => {
    bus.publish = origPublish;
    server?.stop(true);
    await h.pool.query(`DELETE FROM zv_ai_providers WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    await h.done();
  });

  it('another replica’s change drops the own firm’s providers here, and no other firm’s', async () => {
    expect(await chat(A)).toBe('Bearer sk-A');
    expect(await chat(B)).toBe('Bearer sk-B');
    await savedElsewhere(A, 'sk-A2');
    await savedElsewhere(B, 'sk-B2');
    // Cached: this replica has not heard of either change.
    expect(await chat(A)).toBe('Bearer sk-A');

    await fromPeer(A);
    expect(await chat(A)).toBe('Bearer sk-A2');
    expect(await chat(B)).toBe('Bearer sk-B');
  });

  it('a save here goes to the other replicas, and drops the cache here after the commit', async () => {
    sent.length = 0;
    expect(await chat(B)).toBe('Bearer sk-B');
    const res = await (await h.asGod(B)).request('/providers/openai', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label: 'B3' }),
    });
    expect(res.status).toBe(200);
    for (let i = 0; i < 100 && sent.length === 0; i++) await Bun.sleep(10);
    expect(sent).toEqual([
      expect.objectContaining({
        event: EXTENSION_BROADCAST_EVENT,
        collection: 'ai',
        tenantId: B,
        data: { name: 'providers.changed' },
      }),
    ]);
    expect(await chat(B)).toBe('Bearer sk-B2');
  });

  it('a replica that may have missed a change drops every firm’s providers', async () => {
    await savedElsewhere(A, 'sk-A4');
    await savedElsewhere(B, 'sk-B4');
    expect(await chat(A)).toBe('Bearer sk-A2');
    await extensionBroadcastsMissed();
    expect(await chat(A)).toBe('Bearer sk-A4');
    expect(await chat(B)).toBe('Bearer sk-B4');
  });
});
