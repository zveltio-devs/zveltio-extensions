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

// ── Host crypto, reproduced for the harness ──────────────────────────────────
// Kept byte-identical to packages/engine/src/lib/security/keyring.ts so a
// contract test exercises what production does. If those envelopes change,
// the engine's keyring-compat tests fail first and point here.

function harnessKeyHex(keyring: 'field' | 'mail'): string {
  const raw = keyring === 'mail' ? process.env.MAIL_ENCRYPTION_KEY : process.env.FIELD_ENCRYPTION_KEY;
  return (raw ?? '').trim().slice(0, 64);
}

function hexToBytes(hex: string): Uint8Array {
  const pairs = hex.match(/../g) ?? [];
  const out = new Uint8Array(pairs.length);
  for (let i = 0; i < pairs.length; i++) out[i] = Number.parseInt(pairs[i], 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function harnessKey(keyring: 'field' | 'mail', usage: KeyUsage[]): Promise<CryptoKey> {
  const hex = harnessKeyHex(keyring);
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      `${keyring === 'mail' ? 'MAIL' : 'FIELD'}_ENCRYPTION_KEY must be 64 hex chars for the harness`,
    );
  }
  return crypto.subtle.importKey('raw', hexToBytes(hex), { name: 'AES-GCM' }, false, usage);
}

async function harnessEncrypt(plaintext: string, keyring: 'field' | 'mail'): Promise<string> {
  const key = await harnessKey(keyring, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)),
  );
  if (keyring === 'mail') return `aes256gcm:${bytesToHex(iv)}:${bytesToHex(ct)}`;
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return `enc:v1:${btoa(String.fromCharCode(...combined))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')}`;
}

async function harnessDecrypt(value: string, keyring: 'field' | 'mail'): Promise<string> {
  if (typeof value !== 'string') return value;
  if (value.startsWith('aes256gcm:')) {
    const [, ivHex, ctHex] = value.split(':');
    const key = await harnessKey('mail', ['decrypt']);
    return new TextDecoder().decode(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: hexToBytes(ivHex) }, key, hexToBytes(ctHex)),
    );
  }
  if (value.startsWith('enc:v1:')) {
    const b64 = value.slice(7).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const combined = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) combined[i] = bin.charCodeAt(i);
    const key = await harnessKey(keyring, ['decrypt']);
    return new TextDecoder().decode(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(combined.slice(0, 12)) },
        key,
        new Uint8Array(combined.slice(12)),
      ),
    );
  }
  // Unknown envelope (or plaintext predating encryption) passes through.
  return value;
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
  await _pool
    .query(
      `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt", "twoFactorEnabled")
       VALUES ('00000000-0000-4000-8000-00000000e001', 'Ext Harness', 'ext-harness-uuid@test.local', true, 'god', NOW(), NOW(), false)
       ON CONFLICT (id) DO NOTHING`,
    )
    .catch(() => undefined);
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
function makeCtx(db: any, opts: { authed: boolean; admin: boolean }, publicRoutes?: any[]): any {
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
  return {
    db,
    adminDb: db,
    reqDb: () => db,
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
    internals: realInternals({
      encryptSecret: async (plaintext: string, o?: { keyring?: string }) =>
        harnessEncrypt(plaintext, o?.keyring === 'mail' ? 'mail' : 'field'),
      decryptSecret: async (value: string, o?: { keyring?: string }) =>
        harnessDecrypt(value, o?.keyring === 'mail' ? 'mail' : 'field'),
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
    }),
    registerPublicRoute(spec: any) {
      publicRoutes?.push(spec);
    },
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
  await mod.default.register(app, makeCtx(db, { authed, admin }, publicRoutes));
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
      await ext.register(app, makeCtx(db, { authed: true, admin: true }));
      expect(Array.isArray(app.routes)).toBe(true);
    });

    it('no parameterless GET route crashes (authed admin)', async () => {
      if (envUnsupported) return; // migrations env-skipped → tables absent by design
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

    it('no parameterless POST route crashes on an empty body', async () => {
      if (envUnsupported) return; // migrations env-skipped → tables absent by design
      const { Hono } = (await honoP) as any;
      const db = await getDb();
      const app = new Hono();
      await ext.register(app, makeCtx(db, { authed: true, admin: true }));
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
