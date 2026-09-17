/**
 * What this extension hands the engine's edge-function runner.
 *
 * Both call sites passed a `Request` where the runner takes an `EdgeRequest` —
 * a plain `{ method, headers, query, body, path }` object. The runner serialises
 * that into the sandbox with `JSON.stringify`, and `JSON.stringify(request)` for
 * a `Request` is `{}`. So every function invoked through this extension ran
 * against an empty object: no method, no body, no headers, no query.
 *
 * Both sites then read `result.status` and `result.body` off a `RunResult`,
 * whose shape is `{ ok, response, logs, duration_ms }`. Neither field exists.
 * `status` is NOT NULL in `zv_edge_function_logs`, so the insert failed every
 * time and an empty `.catch(() => {})` hid it — that table has never held a row
 * written by this route.
 *
 * Nothing about this was visible in a type: `ctx.internals.runEdgeFunction` is
 * untyped at this boundary and both call sites carried `as any`.
 *
 * Runs against the PACKED `engine/index.js`, for the reason the contract harness
 * gives: this repo's tsconfig maps bare `hono` to an engine `.d.ts` and bun
 * honours tsconfig paths at runtime, so importing `routes.ts` here resolves a
 * type declaration and explodes. The packed bundle is also the artifact the
 * engine actually loads — a source-level test would pass while the shipped
 * bundle stayed stale.
 *
 * And it runs against the REAL `ctx.internals`, which is the correction this
 * file needed. Its first version stubbed `internals.runEdgeFunction` with the
 * shapes the repair assumed, so it proved the repair agreed with itself. The
 * engine had two functions of that name with incompatible signatures, internals
 * exported the other one, and the extension shipped throwing
 * `request.headers.forEach is not a function` on every invocation — green test
 * included. A stub at the boundary under test is not a test of that boundary.
 */

import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';

const ENGINE_DIR = import.meta.dir;
const REPO = join(ENGINE_DIR, '../../..');
const { Hono } = (await import(join(REPO, 'node_modules/hono/dist/index.js'))) as any;
const packed = (await import(join(ENGINE_DIR, 'index.js'))) as any;
// The engine's real internals — the object the engine hands an extension.
const { buildExtensionInternals } = (await import(
  '@zveltio/engine/lib/extensions/internals.js'
)) as any;

const FN = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'probe',
  path: '/probe',
  http_method: 'POST',
  code: 'async function handler(request, env) { return { status: 200, body: {} }; }',
  env_vars: { WHO: 'test' },
  timeout_ms: 5000,
  is_active: true,
};

/** Just enough Kysely to answer the chains these routes build. */
function stubDb(inserted: Record<string, unknown>[], code: string) {
  const chain: Record<string, unknown> = {};
  for (const method of ['selectFrom', 'select', 'selectAll', 'where', 'orderBy', 'limit']) {
    chain[method] = () => chain;
  }
  const fn = { ...FN, code };
  chain.executeTakeFirst = async () => fn;
  chain.execute = async () => [fn];
  return {
    ...chain,
    insertInto: () => ({
      values: (row: Record<string, unknown>) => {
        inserted.push(row);
        return { execute: async () => undefined };
      },
    }),
  };
}

async function invoke(code: string) {
  const calls: unknown[][] = [];
  const inserted: Record<string, unknown>[] = [];
  const internals = buildExtensionInternals();
  const ctx: any = {
    db: stubDb(inserted, code),
    auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    checkPermission: async () => true,
    // Real internals, with one member wrapped only to RECORD the call. The
    // wrapper forwards to the real implementation, so the shapes asserted below
    // are the shapes the engine actually accepts and returns.
    internals: {
      ...internals,
      runEdgeFunction: async (...args: unknown[]) => {
        calls.push(args);
        return (internals.runEdgeFunction as (...a: unknown[]) => unknown)(...args);
      },
    },
    logger: { warn() {}, error() {}, info() {} },
    // The extension also mounts each function's CUSTOM root path at boot; this
    // test is about the admin invoke route, so collect them and assert nothing.
    registerPublicRoute: () => {},
  };

  const app = new Hono();
  await packed.default.register(app, ctx);

  // `register` mounts these routes at '/' on the app it is given; the engine is
  // what prefixes them with /api/ext/<name> in production.
  const res = await app.request(`/${FN.id}/invoke?tenant=acme&debug=1`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"a":1}',
  });
  return { res, call: calls[0], inserted };
}

const HANDLER = `async function handler(request, env) {
  return { status: 201, body: { method: request.method, a: request.body?.a, tenant: request.query?.tenant, who: env.WHO } };
}`;

describe('POST /:id/invoke — what reaches the runner, and what comes back', () => {
  it('passes an EdgeRequest the real runner can use', async () => {
    const { res, call } = await invoke(HANDLER);
    expect(res.status).toBe(200);

    const request = call?.[1] as Record<string, unknown>;
    // The defect in one line: a Request survives JSON as nothing at all, and
    // the real runner throws on it rather than quietly losing the body.
    expect(JSON.stringify(request)).not.toBe('{}');
    expect(request.method).toBe('POST');
    expect(request.body).toEqual({ a: 1 });
    expect(request.path).toBe('/probe');
    expect(request.query).toEqual({ tenant: 'acme', debug: '1' });
  }, 20_000);

  it('the handler actually receives what was sent', async () => {
    // The end of the contract the stub could not check: the sandbox ran, and
    // what it saw is what the route put on the wire.
    const { res } = await invoke(HANDLER);
    const payload = (await res.json()) as { result: { ok: boolean; response: { body: unknown } } };

    expect(payload.result.ok).toBe(true);
    expect(payload.result.response.body).toEqual({
      method: 'POST',
      a: 1,
      tenant: 'acme',
      who: 'test',
    });
  }, 20_000);

  it('logs the status the run actually produced', async () => {
    const { inserted } = await invoke(HANDLER);

    expect(inserted).toHaveLength(1);
    // `status` is NOT NULL; undefined here means a failed insert, not a log row.
    expect(inserted[0].status).toBe(201);
    expect(inserted[0].duration_ms).toBeGreaterThanOrEqual(0);
  }, 20_000);

  it('records 500 when the handler throws, instead of undefined', async () => {
    const { inserted } = await invoke(
      `async function handler() { throw new Error('boom in handler'); }`,
    );

    expect(inserted[0].status).toBe(500);
    expect(String(inserted[0].error)).toContain('boom in handler');
  }, 20_000);
});
