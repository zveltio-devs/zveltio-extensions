/**
 * A public share link is served inside the tenant the share was made in.
 *
 * `/share/:token` runs on the pool with no tenant, and `zv_media_files` is under
 * tenant RLS: a plain-role engine there sees only the default tenant's files, so
 * a link to any other firm's file answered 403 "File has been deleted". The stub
 * below answers the file lookup the way the policy does — only inside the file's
 * tenant.
 */

import { describe, expect, it } from 'bun:test';
// The packed bundle, the file the engine loads — and the only way in: the
// source imports `hono`, which this repo's tsconfig maps to type declarations.
import extension from '../index.js';

const FIRM = '11111111-1111-1111-1111-111111111111';
const FUTURE = new Date(Date.now() + 60 * 60 * 1000);

function harness(shareTenant: string | undefined) {
  let current: string | null = null;
  const share = {
    id: 's1',
    token: 'tok',
    file_id: 'f1',
    share_type: 'view',
    is_active: true,
    expires_at: FUTURE,
    ...(shareTenant ? { tenant_id: shareTenant } : {}),
  };
  const file = { id: 'f1', original_filename: 'report.pdf', tenant_id: FIRM };
  const chain = (result: () => unknown) => {
    const c: Record<string, unknown> = {};
    for (const m of ['select', 'selectAll', 'where']) c[m] = () => c;
    c.executeTakeFirst = async () => result();
    return c;
  };
  const db = {
    selectFrom: (table: string) =>
      chain(() => {
        if (table === 'zv_media_shares') return share;
        if (table === 'zv_media_files') return current === file.tenant_id ? file : undefined;
        return undefined;
      }),
  };
  let handler: ((c: unknown) => Promise<unknown>) | undefined;
  const ctx = {
    db,
    registerPublicRoute: (r: { handler: typeof handler }) => {
      handler = r.handler;
    },
    internals: {
      extensionRegistry: { registerTrashPurgeHandler: () => {} },
      withTenantIsolation: async (tenant: string, fn: () => Promise<unknown>) => {
        current = tenant;
        try {
          return await fn();
        } finally {
          current = null;
        }
      },
    },
  };
  const c = {
    req: { param: () => 'tok', query: () => undefined, header: () => undefined },
    json: (body: unknown, status = 200) => Response.json(body, { status }),
  };
  const ready = extension.register({ route: () => {} } as never, ctx as never);
  return { c, ready, get: () => handler! };
}

describe('public share link — tenant', () => {
  it('serves another firm’s file by entering the firm the share records', async () => {
    const { c, ready, get } = harness(FIRM);
    await ready;
    const res = (await get()(c)) as Response;
    expect(res.status).toBe(200);
    expect(((await res.json()) as { file: { name: string } }).file.name).toBe('report.pdf');
  });

  it('keeps the old path when the engine predates the column', async () => {
    const { c, ready, get } = harness(undefined);
    await ready;
    const res = (await get()(c)) as Response;
    expect(res.status).toBe(403);
  });
});
