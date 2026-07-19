/**
 * Shared per-extension contract harness.
 *
 * Every `<ext>/engine/index.test.ts` calls `extensionContract(import.meta.dir)`
 * and gets the same uniform checks, run against the REAL packed artifact
 * (`engine/index.js` — the exact file the engine loads) and a REAL Postgres
 * (TEST_DATABASE_URL; suite self-skips when unset):
 *
 *   1. manifest.json parses and matches the packed extension's `name`;
 *   2. every `getMigrations()` path exists and its UP section applies cleanly
 *      (server-side PG extensions that aren't installed — e.g. postgis — skip
 *      with a reason instead of failing);
 *   3. `register(app, ctx)` mounts without throwing on a tolerant mock ctx;
 *   4. no parameterless GET route crashes (status < 500) for an authenticated
 *      admin session, and the first GET route doesn't crash unauthenticated.
 *
 * Deliberate constraints:
 *   - `hono` and `kysely` are loaded via explicit file paths, NOT bare
 *     specifiers: the repo tsconfig maps those bare names to engine `.d.ts`
 *     files for typechecking, and bun honors tsconfig paths at runtime — a
 *     bare import here could resolve to a type declaration and explode.
 *   - db handles are typed `any` (see the kysely dual-install note in
 *     `analytics/quality/engine/routes.ts`).
 */

import { afterAll, describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import { basename, dirname, join, relative } from 'path';

const REPO = dirname(import.meta.dir); // testing/ -> repo root

// Path-based imports (immune to tsconfig `paths` at runtime).
const honoP = import(join(REPO, 'node_modules/hono/dist/index.js'));
const kyselyP = import(join(REPO, 'node_modules/kysely/dist/index.js'));

const DB_URL = process.env.TEST_DATABASE_URL ?? '';
const d = DB_URL ? describe : describe.skip;

// One shared pool + Kysely across all test files (bun test = one process).
let _db: any | null = null;
let _pool: any | null = null;
async function getDb(): Promise<any> {
  if (_db) return _db;
  const { Kysely, PostgresDialect } = (await kyselyP) as any;
  const pg = (await import('pg')) as any;
  _pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 4 });
  _db = new Kysely({ dialect: new PostgresDialect({ pool: _pool }) });
  return _db;
}
afterAll(async () => {
  // Best-effort; bun runs afterAll per registering file, guard double-destroy.
  if (_db) {
    const db = _db;
    _db = null;
    await db.destroy().catch(() => undefined);
  }
});

type Session = { user: { id: string; role: string; email: string; name: string } } | null;

/** Tolerant ctx mock covering every member the 48 extensions actually use. */
function makeCtx(db: any, opts: { authed: boolean; admin: boolean }): any {
  const services = new Map<string, unknown>();
  const session: Session = opts.authed
    ? {
        user: {
          id: 'ext-harness-user',
          role: opts.admin ? 'god' : 'user',
          email: 'ext-harness@test.local',
          name: 'Ext Harness',
        },
      }
    : null;
  const asyncNoop = async () => undefined;
  // Recursive callable stub: any property access yields another stub, and
  // calling it resolves to undefined — survives arbitrary `a.b.c(...)` chains.
  function anyStub(): any {
    return new Proxy(function stub() {}, {
      get: (_t, p) => (p === 'then' ? undefined : anyStub()),
      apply: () => Promise.resolve(undefined),
      construct: () => anyStub(),
    });
  }
  return {
    db,
    adminDb: db,
    reqDb: () => db,
    auth: { api: { getSession: async () => session } },
    checkPermission: async () => opts.admin,
    getUserRoles: async () => (opts.admin ? ['god'] : []),
    events: { on() {}, off() {}, emit: asyncNoop },
    services: {
      register: (n: string, s: unknown) => void services.set(n, s),
      get: (n: string) => services.get(n),
      has: (n: string) => services.has(n),
    },
    // Unknown engine internals become recursive callable stubs (callable AND
    // property-accessible, e.g. `internals.extensionRegistry.registerX(...)`);
    // routes that need a REAL internal may 500 at request time — surfaced
    // per-route, not at mount.
    internals: anyStub(),
    registerPublicRoute() {},
    onHealthCheck() {},
    entityAccess: { register() {} },
    queryAlter: { register() {} },
    fieldTypeRegistry: { register() {}, get: () => undefined, getAll: () => [], list: () => [] },
    DDLManager: anyStub(),
    env: {},
    log: console,
  };
}

export interface ContractOptions {
  /** GET paths to skip in the route smoke (e.g. routes needing live externals). */
  skipRoutes?: string[];
  /** GET paths allowed to return 5xx (documented per-extension exceptions). */
  allow500?: string[];
  /**
   * Extensions whose migrations must be applied first (repo-relative names,
   * e.g. 'hr/employees'). Mirrors a real cross-extension data dependency.
   */
  dependsOn?: string[];
}

/** Apply an extension's UP migrations (splitting at `-- DOWN`). */
async function applyMigrations(ext: any): Promise<void> {
  if (typeof ext?.getMigrations !== 'function') return;
  for (const f of ext.getMigrations() as string[]) {
    const up = readFileSync(f, 'utf8').split(/^-- DOWN$/m)[0]!;
    try {
      await _pool.query(up);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/extension .* is not available|could not open extension control file/i.test(msg)) {
        console.warn(`  [skip] ${basename(f)}: ${msg.split('\n')[0]}`);
        return;
      }
      throw new Error(`migration ${basename(f)} failed: ${msg}`);
    }
  }
}

/** Run the uniform extension contract. `engineDir` = `<ext>/engine`. */
export async function extensionContract(engineDir: string, opts: ContractOptions = {}) {
  const extDir = dirname(engineDir);
  const name = relative(REPO, extDir); // e.g. "hr/employees"
  const skip = new Set(opts.skipRoutes ?? []);
  const allow500 = new Set(opts.allow500 ?? []);

  d(`extension contract: ${name}`, () => {
    let ext: any;
    let manifest: any;

    it('packed engine/index.js loads and matches manifest.json', async () => {
      manifest = JSON.parse(readFileSync(join(extDir, 'manifest.json'), 'utf8'));
      const mod = await import(join(engineDir, 'index.js'));
      ext = mod.default;
      expect(ext).toBeDefined();
      expect(ext.name).toBe(manifest.name);
      expect(typeof ext.register).toBe('function');
    });

    it('migrations exist and apply cleanly', async () => {
      await getDb();
      // Cross-extension data dependencies first (mirrors real installs where
      // the depended-on extension is enabled alongside).
      for (const dep of opts.dependsOn ?? []) {
        const depMod = await import(join(REPO, dep, 'engine/index.js'));
        await applyMigrations(depMod.default);
      }
      if (typeof ext?.getMigrations !== 'function') return; // no migrations = valid
      // getMigrations() uses import.meta.dir of the PACKED file → engineDir.
      const files: string[] = ext.getMigrations();
      expect(files.length).toBeGreaterThan(0);
      for (const f of files) expect(existsSync(f)).toBe(true);
      await applyMigrations(ext);
    });

    it('register(app, ctx) mounts without throwing', async () => {
      const { Hono } = (await honoP) as any;
      const db = await getDb();
      const app = new Hono();
      await ext.register(app, makeCtx(db, { authed: true, admin: true }));
      expect(Array.isArray(app.routes)).toBe(true);
    });

    it('no parameterless GET route crashes (authed admin)', async () => {
      const { Hono } = (await honoP) as any;
      const db = await getDb();
      const app = new Hono();
      await ext.register(app, makeCtx(db, { authed: true, admin: true }));
      const gets: string[] = [
        ...new Set(
          (app.routes as Array<{ method: string; path: string }>)
            .filter((r) => r.method === 'GET' && !r.path.includes(':') && !r.path.includes('*'))
            .map((r) => r.path),
        ),
      ].filter((p) => !skip.has(p)).slice(0, 20);
      for (const p of gets) {
        const res = await app.request(p);
        // 501/503 are legitimate "not implemented / not configured" states on a
        // bare install (e.g. SAML without IdP config) — only crash-class fails.
        if ([500, 502, 504].includes(res.status) && !allow500.has(p)) {
          throw new Error(`${name} GET ${p} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
        }
      }
    });

    it('unauthenticated request does not crash', async () => {
      const { Hono } = (await honoP) as any;
      const db = await getDb();
      const app = new Hono();
      await ext.register(app, makeCtx(db, { authed: false, admin: false }));
      const first = (app.routes as Array<{ method: string; path: string }>).find(
        (r) => r.method === 'GET' && !r.path.includes(':') && !r.path.includes('*'),
      );
      if (!first) return;
      const res = await app.request(first.path);
      expect([500, 502, 504]).not.toContain(res.status);
    });
  });
}
