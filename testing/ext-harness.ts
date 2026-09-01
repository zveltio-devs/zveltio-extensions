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
 *      admin session, and the first GET route doesn't crash unauthenticated;
 *   5. no parameterless POST route crashes on an empty body.
 *
 * Check 5 exists because checks 1-4 never touched a write path. Across 57
 * extensions this suite was green while `created_by` was being stripped from
 * every insert, `tenant_id` was being taken from the request body, and a POS
 * sale could not be written at all — none of which a GET can see. An empty body
 * is the one request that can be sent to any route without knowing what it
 * wants, and a 5xx answer to it means the handler either does not validate
 * before it reaches SQL, or reaches SQL that does not match the schema. Both
 * were live defects found by hand in this audit.
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
import { createHmac } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { basename, dirname, join, relative } from 'path';

// ── Host crypto ──────────────────────────────────────────────────────────────
//
// The engine's real keyring, imported by path, NOT reproduced.
//
// This file used to carry a byte-identical copy with a comment saying it was
// kept in step by hand. It was not: the copy knew `field` and `mail`, and when a
// third keyring (`ai`) arrived with its own envelope, `keyring === 'mail' ?
// 'mail' : 'field'` silently encrypted AI provider keys under the FIELD key.
// The round trip still worked inside the harness, so nothing failed — it just
// tested something the product does not do.
//
// A contract harness whose idea of the contract is its own copy is worth
// nothing. There is one implementation now.
// Resolved on first use, not at module load: this block sits above `REPO`, and
// a top-level `import(join(REPO, …))` here reads it in the temporal dead zone.
let _keyringP: Promise<any> | null = null;
function keyring(): Promise<any> {
  _keyringP ??= import(
    join(REPO, '..', 'zveltio', 'packages', 'engine', 'src', 'lib', 'security', 'keyring.js')
  );
  return _keyringP;
}

async function harnessEncrypt(plaintext: string, keyringName: string): Promise<string> {
  const { encryptWithKeyring } = (await keyring()) as any;
  return encryptWithKeyring(plaintext, keyringName);
}

async function harnessDecrypt(value: string, keyringName: string): Promise<string> {
  const { decryptWithKeyring } = (await keyring()) as any;
  return decryptWithKeyring(value, keyringName);
}

const FORMULA_START = /^[=+\-@\t\r]/;
const NUMERIC = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

function harnessCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const raw =
    value instanceof Date
      ? value.toISOString()
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
  const safe = FORMULA_START.test(raw) && !NUMERIC.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}



const REPO = dirname(import.meta.dir); // testing/ -> repo root

// Path-based imports (immune to tsconfig `paths` at runtime).
const honoP = import(join(REPO, 'node_modules/hono/dist/index.js'));
const kyselyP = import(join(REPO, 'node_modules/kysely/dist/index.js'));

/**
 * The engine's OWN restriction code, not a copy of it.
 *
 * `ctx.db` here used to be the raw Kysely handle. In production it is a proxy
 * from `createRestrictedDb` that throws on any `zv_*` table outside the
 * extension's own namespace, and `ctx.internals` is a proxy from `gateInternals`
 * that throws on any member whose capability the manifest does not declare. So
 * the suite ran every extension with strictly more power than it has in the
 * product, and could not fail on either boundary — the `ai` extension had been
 * calling `encryptSecret` without declaring `secrets` for as long as the code
 * existed, and this suite was green on it.
 *
 * Imported by path from the sibling engine checkout, the way `hono` and `kysely`
 * are. Reimplementing either check here would produce a second copy that drifts,
 * and a contract harness whose idea of the contract is its own is worth nothing.
 */
const ENGINE_LIB = join(REPO, '..', 'zveltio', 'packages', 'engine', 'src', 'lib', 'extensions');
const restrictP = import(join(ENGINE_LIB, 'extension-context.js'));
const capsP = import(join(ENGINE_LIB, 'capabilities.js'));
const registerP = import(join(ENGINE_LIB, 'register.js'));

/**
 * The wiring production gives an extension: its name, the tables it may touch,
 * and the capabilities its manifest declares.
 *
 * `buildAllowedTables` is the engine's own — it reads the extension's migrations
 * for `CREATE TABLE` and adds whatever `EXTENSION_TABLE_GRANTS` allows it to
 * reach in the engine's own schema. Deriving that here instead would be a third
 * copy of a rule that already has two consumers.
 */
async function productionWiring(
  extDir: string,
  extName: string,
  ext: any,
): Promise<{ extName: string; allowedTables: Set<string>; capabilities: readonly string[] }> {
  const { buildAllowedTables, EXTENSION_TABLE_GRANTS } = (await registerP) as any;
  const paths: string[] = typeof ext?.getMigrations === 'function' ? ext.getMigrations() : [];
  let allowedTables = new Set<string>();
  try {
    allowedTables = await buildAllowedTables(paths, extName);
    // The second step, and it is not optional: `buildAllowedTables` only returns
    // tables it finds in the extension's OWN migrations, so a grant for a table
    // the extension does not itself declare — which is most of them, since these
    // are features that started in the engine — never comes out of it. `load.ts`
    // adds the grant list separately right after the call. Reproducing only the
    // first half made four extensions fail here on tables they are allowed to
    // read in production.
    for (const t of (EXTENSION_TABLE_GRANTS?.[extName] ?? []) as string[]) allowedTables.add(t);
  } catch {
    // buildAllowedTables reads the engine's own schema to decide what an
    // extension may NOT create. Without a database it cannot, and refusing to
    // run the whole suite over that would be worse than running it with the
    // prefix rules alone — which are the ones that matter here.
  }
  let capabilities: readonly string[] = [];
  try {
    const manifest = JSON.parse(readFileSync(join(extDir, 'manifest.json'), 'utf8'));
    capabilities = Array.isArray(manifest?.permissions) ? manifest.permissions : [];
  } catch {
    /* a manifest that will not parse fails its own check, one test up */
  }
  return { extName, allowedTables, capabilities };
}

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
  // Seed the mock session's user as a REAL row: extension tables commonly carry
  // FK constraints to "user"(id), so writes from route tests would otherwise
  // fail on a foreign-key violation that has nothing to do with the extension.
  //
  // ── Stands the incumbent god down first, and does NOT swallow failure ──
  //
  // This used to insert `role = 'god'` with `.catch(() => undefined)`. Engine
  // migration 008 then made "one god per instance" a database trigger, so the
  // insert started being REFUSED — and the catch ate the refusal. The user was
  // never created, and the suite failed dozens of lines later with foreign-key
  // violations on `zv_ai_chats`, `zv_media_files`, `zv_mail_accounts`: three
  // symptoms, none of them naming the cause.
  //
  // A swallowed failure that turns into a distant, differently-shaped error is
  // the most expensive kind. So: demote the incumbent the way the engine's own
  // `createGodSession` does, then insert, then let a failure THROW.
  await _pool.query(
    `UPDATE "user" SET role = 'member'
       WHERE role = 'god' AND id <> '00000000-0000-4000-8000-00000000e001'`,
  );
  await _pool.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt", "twoFactorEnabled")
     VALUES ('00000000-0000-4000-8000-00000000e001', 'Ext Harness', 'ext-harness-uuid@test.local', true, 'god', NOW(), NOW(), false)
     ON CONFLICT (id) DO UPDATE SET role = 'god'`,
  );
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
async function makeCtx(
  db: any,
  opts: { authed: boolean; admin: boolean },
  publicRoutes?: any[],
  wiring?: { extName?: string; allowedTables?: Set<string>; capabilities?: readonly string[] },
): Promise<any> {
  const services = new Map<string, unknown>();
  const session: Session = opts.authed
    ? {
        user: {
          id: '00000000-0000-4000-8000-00000000e001',
          role: opts.admin ? 'god' : 'user',
          email: 'ext-harness@test.local',
          name: 'Ext Harness',
        },
      }
    : null;
  const asyncNoop = async () => undefined;
  // Recursive callable stub: any property access yields another stub, and
  // calling it resolves to undefined — survives arbitrary `a.b.c(...)` chains.
  /**
   * An internals bag where the named members are REAL and everything else is a
   * tolerant stub. Wrapping rather than assigning matters: anyStub()'s `get`
   * trap never consults its target, so properties assigned onto it are never
   * seen.
   */
  // biome-ignore lint/suspicious/noExplicitAny: mock ctx surface
  function realInternals(real: Record<string, any>): any {
    return new Proxy(real, {
      get: (t, p) => (p in t ? (t as Record<string | symbol, unknown>)[p] : anyStub()),
    });
  }

  function anyStub(): any {
    return new Proxy(function stub() {}, {
      get: (_t, p) => (p === 'then' ? undefined : anyStub()),
      apply: () => Promise.resolve(undefined),
      construct: () => anyStub(),
    });
  }
  const { createRestrictedDb } = (await restrictP) as any;
  const { gateInternals } = (await capsP) as any;
  const extName = wiring?.extName ?? 'harness';
  const allowedTables = wiring?.allowedTables ?? new Set<string>();
  const capabilities = wiring?.capabilities ?? [];

  // The same proxy production hands over: `zvd_*` and this extension's own
  // `zv_<name>_*` namespace, plus whatever its migrations created. Anything else
  // throws here exactly as it would in the engine.
  const restrictedDb = createRestrictedDb(db, extName, allowedTables);

  return {
    db: restrictedDb,
    // `adminDb` is the deliberate cross-tenant handle. Production gates it on
    // the `db:admin` capability; an extension without it gets the restricted
    // handle rather than a second unrestricted one.
    adminDb: capabilities.includes('db:admin') ? db : restrictedDb,
    reqDb: () => restrictedDb,
    auth: {
      api: {
        getSession: async () => session,
        // In-process signup mirror (real INSERT) so provisioning-style
        // extensions (SCIM) exercise their create path against the real DB.
        signUpEmail: async (args: { body: { email: string; name?: string } }) => {
          const id = crypto.randomUUID();
          await _pool.query(
            `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt", "twoFactorEnabled")
             VALUES ($1, $2, $3, true, 'member', NOW(), NOW(), false)`,
            [id, args.body.name ?? args.body.email, args.body.email],
          );
          return { user: { id, email: args.body.email } };
        },
      },
    },
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
    // Crypto internals get REAL implementations, not stubs. Extensions that
    // used to hold key material now delegate here, and a stub returning
    // undefined turns "encrypt this token" into a NULL insert that fails far
    // from the cause. These reproduce the host's envelopes exactly — see
    // packages/engine/src/lib/security/keyring.ts and its compatibility tests.
    // NOTE: anyStub()'s `get` trap ignores its target, so Object.assign onto it
    // is invisible. The real members have to be consulted BEFORE falling back.
    internals: gateInternals(extName, realInternals({
      encryptSecret: async (plaintext: string, o?: { keyring?: string }) =>
        harnessEncrypt(plaintext, o?.keyring ?? 'field'),
      decryptSecret: async (value: string, o?: { keyring?: string }) =>
        harnessDecrypt(value, o?.keyring ?? 'field'),
      deriveTokenHash: async (raw: string) =>
        createHmac('sha256', process.env.BETTER_AUTH_SECRET ?? '').update(raw).digest('hex'),
      csvCell: harnessCsvCell,
      recordsToCsv: (records: Record<string, unknown>[]) => {
        if (records.length === 0) return '';
        const keys: string[] = [];
        const seen = new Set<string>();
        for (const r of records) {
          for (const k of Object.keys(r)) {
            if (!seen.has(k)) {
              seen.add(k);
              keys.push(k);
            }
          }
        }
        const header = keys.map(harnessCsvCell).join(',');
        const rows = records.map((r) => keys.map((k) => harnessCsvCell(r[k])).join(','));
        return [header, ...rows].join('\r\n');
      },
    }), capabilities, []),
    registerPublicRoute(spec: any) {
      publicRoutes?.push(spec);
    },
    onHealthCheck() {},
    entityAccess: { register() {} },
    queryAlter: { register() {} },
    fieldTypeRegistry: { register() {}, get: () => undefined, getAll: () => [], list: () => [] },
    DDLManager: anyStub(),
    /**
     * The host builds this on every load, so an extension that reads
     * `ctx.config.vars.SOMETHING` is reading a real object in production. The
     * mock had no `config` at all, which is why several extensions reach for it
     * as `ctx.config?.x` — defensiveness against a shape only this file ever
     * produced. Giving it the real shape means those can stop, and means an
     * extension that reads `ctx.config.vars` is exercised rather than throwing
     * on the first line of `register()`.
     *
     * `vars` is empty on purpose: the contract suite runs an extension as an
     * instance that has configured nothing, which is the state a fresh install
     * is in and the one where "not configured" handling has to be right.
     */
    config: Object.freeze({
      vars: Object.freeze({}),
      env: 'test' as const,
      isProduction: false,
      publicUrl: undefined,
      encryptionConfigured: Boolean(process.env.FIELD_ENCRYPTION_KEY),
      crossDomainAuth: false,
      allowInsecureLdap: false,
      objectStorage: undefined,
    }),
    env: {},
    log: console,
  };
}

export interface ContractOptions {
  /** GET paths to skip in the route smoke (e.g. routes needing live externals). */
  skipRoutes?: string[];
  /** GET paths allowed to return 5xx (documented per-extension exceptions). */
  allow500?: string[];
  /** POST paths allowed to return 5xx on an empty body (documented exceptions). */
  allow500Post?: string[];
  /** POST paths to skip entirely in the write smoke (e.g. ones that call out). */
  skipPostRoutes?: string[];
  /**
   * Extensions whose migrations must be applied first (repo-relative names,
   * e.g. 'hr/employees'). Mirrors a real cross-extension data dependency.
   */
  dependsOn?: string[];
}

/**
 * Apply an extension's UP migrations (splitting at `-- DOWN`).
 * Returns false when the ENVIRONMENT can't support them (a server-side PG
 * extension like postgis isn't installed) — callers must then skip the route
 * smoke too, since the extension's tables never materialized.
 */
async function applyMigrations(ext: any): Promise<boolean> {
  if (typeof ext?.getMigrations !== 'function') return true;
  for (const f of ext.getMigrations() as string[]) {
    const up = readFileSync(f, 'utf8').split(/^-- DOWN$/m)[0]!;
    try {
      await _pool.query(up);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/extension .* is not available|could not open extension control file/i.test(msg)) {
        console.warn(`  [skip] ${basename(f)}: ${msg.split('\n')[0]}`);
        return false;
      }
      throw new Error(`migration ${basename(f)} failed: ${msg}`);
    }
  }
  return true;
}

/**
 * Mount an extension's packed engine on a fresh app with a mock ctx — for
 * bespoke per-extension regression tests beyond the uniform contract.
 *
 * Defaults to an authed ADMIN. Pass `{ admin: false }` / `{ authed: false }` to
 * assert authorization gates (e.g. that a non-admin cannot publish content that
 * lands on the public website).
 */
export async function mountForTest(
  engineDir: string,
  opts: { authed?: boolean; admin?: boolean } = {},
): Promise<{ app: any; publicRoutes: any[]; migrated: boolean }> {
  const { authed = true, admin = true } = opts;
  const { Hono } = (await honoP) as any;
  const db = await getDb();
  const mod = await import(join(engineDir, 'index.js'));
  // Apply the extension's OWN migrations so DB-backed routes have their tables,
  // mirroring a real mount. Needed for bespoke tests that live in a SEPARATE
  // file from the extension's index.test.ts (whose extensionContract applies
  // them) — e.g. geospatial/postgis/authz.test.ts, which bun runs before
  // index.test.ts, so without this its /geofences query hit a missing table.
  // Idempotent (CREATE ... IF NOT EXISTS). `migrated=false` means the DB server
  // can't support them (e.g. postgis not installed) → the extension's tables
  // never materialised and DB-backed assertions must be skipped by the caller.
  const migrated = await applyMigrations(mod.default);
  const app = new Hono();
  const publicRoutes: any[] = [];
  // `mountForTest` receives the ENGINE dir; the extension is its parent, which
  // is what names it and where its manifest lives.
  const extDir = dirname(engineDir);
  const wiring = await productionWiring(extDir, relative(REPO, extDir), mod.default);
  await mod.default.register(app, await makeCtx(db, { authed, admin }, publicRoutes, wiring));
  // Mount collected root-level public routes on the same app so tests can hit
  // them at their absolute paths (mirrors the engine mounting them globally).
  for (const spec of publicRoutes) app.on(spec.method, spec.path, spec.handler);
  return { app, publicRoutes, migrated };
}

/** Run the uniform extension contract. `engineDir` = `<ext>/engine`. */
export async function extensionContract(engineDir: string, opts: ContractOptions = {}) {
  const extDir = dirname(engineDir);
  const name = relative(REPO, extDir); // e.g. "hr/employees"
  const skip = new Set(opts.skipRoutes ?? []);
  const allow500 = new Set(opts.allow500 ?? []);
  const allow500Post = new Set(opts.allow500Post ?? []);
  const skipPost = new Set(opts.skipPostRoutes ?? []);

  d(`extension contract: ${name}`, () => {
    let ext: any;
    let manifest: any;
    // True when the DB server can't support this extension's migrations (e.g.
    // postgis not installed in the CI image) — route smoke must skip too.
    let envUnsupported = false;

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
      envUnsupported = !(await applyMigrations(ext));
    });

    it('register(app, ctx) mounts without throwing', async () => {
      const { Hono } = (await honoP) as any;
      const db = await getDb();
      const app = new Hono();
      await ext.register(app, await makeCtx(db, { authed: true, admin: true }, undefined, await productionWiring(extDir, name, ext)));
      expect(Array.isArray(app.routes)).toBe(true);
    });

    it('no parameterless GET route crashes (authed admin)', async () => {
      if (envUnsupported) return; // migrations env-skipped → tables absent by design
      const { Hono } = (await honoP) as any;
      const db = await getDb();
      const app = new Hono();
      await ext.register(app, await makeCtx(db, { authed: true, admin: true }, undefined, await productionWiring(extDir, name, ext)));
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

    it('no parameterless POST route crashes on an empty body', async () => {
      if (envUnsupported) return; // migrations env-skipped → tables absent by design
      const { Hono } = (await honoP) as any;
      const db = await getDb();
      const app = new Hono();
      await ext.register(app, await makeCtx(db, { authed: true, admin: true }, undefined, await productionWiring(extDir, name, ext)));
      const posts: string[] = [
        ...new Set(
          (app.routes as Array<{ method: string; path: string }>)
            .filter((r) => r.method === 'POST' && !r.path.includes(':') && !r.path.includes('*'))
            .map((r) => r.path),
        ),
      ]
        .filter((p) => !skipPost.has(p))
        .slice(0, 20);
      const broken: string[] = [];
      for (const p of posts) {
        if (allow500Post.has(p)) continue;
        const res = await app.request(p, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        });
        // 400/422 is the CORRECT answer here — the body is empty on purpose, and
        // a route that says so is a route that validates. 401/403/404/409 are
        // fine too. Only a crash is a defect: it means the missing fields
        // travelled as far as the database.
        if (res.status >= 500 && res.status !== 501 && res.status !== 503) {
          broken.push(`POST ${p} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
        }
      }
      if (broken.length > 0) {
        throw new Error(`${name} does not survive an empty body:\n  ${broken.join('\n  ')}`);
      }
    });

    it('unauthenticated request does not crash', async () => {
      if (envUnsupported) return; // migrations env-skipped → tables absent by design
      const { Hono } = (await honoP) as any;
      const db = await getDb();
      const app = new Hono();
      await ext.register(app, await makeCtx(db, { authed: false, admin: false }, undefined, await productionWiring(extDir, name, ext)));
      const first = (app.routes as Array<{ method: string; path: string }>).find(
        (r) => r.method === 'GET' && !r.path.includes(':') && !r.path.includes('*'),
      );
      if (!first) return;
      const res = await app.request(first.path);
      expect([500, 502, 504]).not.toContain(res.status);
    });
  });
}
