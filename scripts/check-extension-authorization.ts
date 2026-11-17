#!/usr/bin/env bun
/**
 * Gate: an extension that changes state must authorize the change.
 *
 * `extension-auth-gate.ts` in the engine made AUTHENTICATION the host's job —
 * a route whose author forgot a session check answers 401 rather than serving
 * an anonymous caller. Authorization stayed with the extension, and the SDK
 * gives it one line: `app.use('*', permissionGate(ctx, 'invoices'))`.
 *
 * Forty-three of forty-four extensions do exactly that. `operations/traceability`
 * did not: 55 routes behind a bare session check, so any member of a tenant
 * could create, alter and delete lots, movements and recalls. Nothing failed,
 * nothing warned; it was found by an external audit reading the code.
 *
 * One missing line among forty-four is not a reason to move authorization into
 * the host. Extensions choose resource names the host cannot know — `invoices`,
 * not `finance/invoicing` — and a host-side gate would demand a second,
 * differently-named permission on top of the one the extension already
 * enforces, breaking every deployment to solve a problem that measurement says
 * does not exist. This check is the proportionate control: it notices the
 * forty-fifth extension that forgets, and costs nothing at runtime.
 *
 * WHAT IT REQUIRES
 *   An extension whose engine code registers a state-changing HTTP route
 *   (POST/PUT/PATCH/DELETE) must reference an authorization helper somewhere in
 *   that code. Read-only extensions are exempt, as are extensions with no HTTP
 *   surface at all.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   It does not check that the right resource is named, or that every route is
 *   covered. A regex cannot know either, and pretending otherwise produces a
 *   gate people learn to satisfy rather than obey. It answers one question —
 *   "did anyone think about authorization here?" — which is the question
 *   traceability would have failed.
 *
 * Usage: bun scripts/check-extension-authorization.ts [root]
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.argv[2] ?? process.cwd();

/**
 * Engine files whose write routes are exempt from the requirement, with the
 * reason. Per file, not per extension: the extension's other files, and its
 * global-route and resource checks, are still read.
 *
 * Short on purpose. An entry here is a decision someone has to defend in
 * review, which is the only thing that keeps a list like this short.
 */
const ALLOWLIST: Record<string, string> = {
  // Its one write route, `POST /callback`, is the SAML assertion consumer: the
  // caller is a browser carrying an IdP-signed assertion, before any session
  // exists, so there is no principal to ask. The signature is the check
  // (`validateSamlResponse`); it writes only the spent-assertion claim (as the
  // system) and the session the engine creates.
  'auth/saml/engine/routes.ts': 'SAML assertion consumer, authenticated by the IdP signature',
  // Their one write route is a provider's webhook (`POST /webhook/stripe`,
  // `POST /webhook/twilio`): no principal calls it, the provider's HMAC under
  // the tenant's secret is the check, and the route writes at most the event's
  // claim before it queues a job.
  'billing/engine/index.ts': 'Stripe webhook, authenticated by the Stripe-Signature HMAC',
  'sms/engine/routes.ts': 'Twilio status callback, authenticated by the X-Twilio-Signature HMAC',
  // `POST /webhooks/receive`: a third party's delivery, authenticated by the
  // HMAC-SHA256 under the webhook's own secret; it writes nothing and queues the
  // `receive` job.
  'integrations/api-connector/engine/routes.ts': 'incoming webhook, authenticated by the per-webhook HMAC',
};

/** Any helper that represents an authorization decision. */
const AUTHORIZATION = [
  /\bpermissionGate\s*\(/,
  /\bcheckPermission\s*\(/,
  /\brequirePermission\s*\(/,
  /\brequireAdmin\s*\(/,
  /\bisAdmin\b/,
  /\bisGodUser\s*\(/,
  /\bisTenantAdmin\s*\(/,
  /\bhasCapability\s*\(/,
  // A write through the data API as the caller (`ctx.internals.createRecord`
  // and its siblings) is authorized by the engine's own rules for that caller:
  // the wave model, where an extension carries no authorization of its own.
  /\b(?:createRecord|updateRecord|deleteRecord)\s*\(/,
  // So is a write through the route's host (`ctx.host(c)`: its `collections`,
  // ADR 0025, and `files`, ADR 0034), which acts as the caller.
  /\bhost\s*\(\s*c\s*\)/,
];

/** A route that changes state. GET/HEAD alone never trip this gate. */
const WRITE_ROUTE = /\b(?:app|router|routes)\s*\.\s*(?:post|put|patch|delete)\s*\(/i;

/**
 * Strip comments so a docstring ABOUT permissions is not mistaken for one.
 *
 * Line-anchored on purpose. The obvious version — `/\/\*[\s\S]*?\*\//g` —
 * treats the `/*` inside a route pattern as the start of a block comment:
 * `app.use('/admin/*', permissionGate(ctx, 'store'))` begins a "comment" at
 * `/*` that runs to the next `*​/` somewhere below, swallowing the very call
 * being looked for. It reported `ecommerce/store` as having no authorization
 * when the line was three characters from the match, and would have done the
 * same to every extension using a wildcard path.
 *
 * A comment in this codebase starts its line. A string literal does not, so
 * requiring the delimiter at the start of a line separates them without
 * needing a parser.
 */
function stripComments(src: string): string {
  const out: string[] = [];
  let inBlock = false;
  for (const line of src.split('\n')) {
    const trimmed = line.trimStart();
    if (inBlock) {
      if (trimmed.includes('*/')) inBlock = false;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlock = true;
      continue;
    }
    if (trimmed.startsWith('*') || trimmed.startsWith('//')) continue;
    out.push(line);
  }
  return out.join('\n');
}

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

/**
 * Every directory holding a manifest.json next to an engine/ directory, at any
 * depth. A fixed two-level walk missed `compliance/ro/*` — the gate never read
 * efactura, saft, etransport and the other Romanian extensions.
 */
function findExtensions(root: string, depth = 0, found: string[] = []): string[] {
  if (depth > 4) return found;
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return found;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const dir = join(root, name);
    try {
      if (!statSync(dir).isDirectory()) continue;
      statSync(join(dir, 'manifest.json'));
      statSync(join(dir, 'engine'));
      found.push(dir);
    } catch {
      /* not an extension */
    }
    findExtensions(dir, depth + 1, found);
  }
  return found;
}

/**
 * Extensions that mount routes on the GLOBAL app must say so in the manifest.
 *
 * `ctx.registerPublicRoute` puts a path at the ROOT of the operator's instance,
 * outside `/ext/<name>` and therefore outside the auth gate. That is by design —
 * an IdP posting SCIM carries a bearer token, not a session — but the manifest
 * gave no sign of it, so installing an extension could open `/scim/v2/*` with
 * nothing in the file a reviewer reads to say so. An audit flagged the absence
 * as an oversight; it was documented design with no declaration behind it.
 *
 * `globalRoutes` is informational: the engine does not gate on it. This check is
 * what keeps it honest.
 *
 * It originally accepted any non-empty array, and `developer/edge-functions`
 * passed it with `["<operator-defined>"]` — which satisfied the check while
 * declaring nothing. The intent behind that was not dishonest: the paths come
 * from rows in a table, chosen by the operator after install, so the extension
 * genuinely cannot list them. But a gate that accepts a placeholder is a gate
 * that anyone can pass by typing angle brackets.
 *
 * So the dynamic case gets a declaration of its own: `"globalRoutesDynamic":
 * true`, alongside an empty `globalRoutes`. It says something true and
 * checkable — this extension mounts global routes whose paths live in data —
 * and a placeholder inside the array form is refused by name.
 *
 * The first attempt at this put the sentinel in `globalRoutes` itself, as the
 * string `"operator-defined"`. That made the manifest fail the ENGINE's schema,
 * where the field is `z.array(z.string())`, so the extension could no longer be
 * enabled at all — 422 on install, and this gate still green, because nothing
 * ran the manifest through the schema the engine actually parses. Both halves
 * are fixed: the declaration is a boolean the schema knows about, and
 * `validate-all-extensions.ts` now checks every manifest against
 * `ManifestSchema`.
 */
function checkGlobalRouteDeclaration(extDir: string, code: string): string | null {
  if (!/\bregisterPublicRoute\s*\(/.test(code)) return null;
  try {
    const manifest = JSON.parse(readFileSync(join(extDir, 'manifest.json'), 'utf8'));
    const declared = manifest.globalRoutes;
    if (manifest.globalRoutesDynamic === true) return null;
    if (Array.isArray(declared) && declared.length > 0) {
      const placeholder = declared.map(String).find((p) => p.includes('<') || p.includes('>'));
      if (placeholder) {
        return `declares the placeholder global route '${placeholder}' — list the real paths, or set "globalRoutesDynamic": true if they come from data`;
      }
      return null;
    }
  } catch {
    /* unreadable manifest — reported below as undeclared */
  }
  return 'registers global routes without declaring them in manifest.globalRoutes';
}

/**
 * A resource nobody declared is a resource nobody can be granted.
 *
 * The engine denies by default: `permissionGate(ctx, 'invoices')` passes only
 * for a role holding an explicit grant on `invoices`. Grants for the resources
 * that existed when that landed were written by migration 034, and new ones are
 * materialized from what an extension declares here. So an extension that
 * guards a resource without declaring it installs cleanly, starts cleanly, and
 * answers 403 to everyone except administrators — with nothing in any log
 * saying why, because from the engine's side nothing went wrong.
 *
 * That is the failure this check exists to prevent, and it is worth saying why
 * it is a separate field from `permissions`. That one lists CAPABILITIES —
 * database, network, ddl — which the host grants to the extension. This lists
 * the resources the extension guards, which an operator grants to their staff.
 * The same English word pointing in opposite directions; folding them together
 * would quietly break the capability contract.
 *
 * Placeholders are rejected by name: `<resource>` is what the developer guide's
 * template contains, and a gate that accepts it teaches authors to paste rather
 * than think.
 */
function checkResourceDeclaration(extDir: string, code: string): string | null {
  const named = new Set<string>();
  for (const m of code.matchAll(/permissionGate\s*\(\s*ctx\s*,\s*['"]([^'"]+)['"]/g)) {
    named.add(m[1]);
  }
  if (named.size === 0) return null;

  const placeholder = [...named].find((n) => n.startsWith('<') || n.includes(' '));
  if (placeholder) return `guards the placeholder resource '${placeholder}'`;

  let declared: unknown;
  try {
    declared = JSON.parse(readFileSync(join(extDir, 'manifest.json'), 'utf8')).resources;
  } catch {
    /* unreadable manifest — reported below as undeclared */
  }
  const list = new Set(Array.isArray(declared) ? declared.map(String) : []);
  const missing = [...named].filter((n) => !list.has(n)).sort();
  if (missing.length > 0) {
    return `guards ${missing.map((m) => `'${m}'`).join(', ')} without declaring it in manifest.resources`;
  }

  // `sensitiveResources` withholds the automatic default grant, so a name in it
  // that the extension does not actually guard withholds nothing and reads, to
  // anyone auditing the manifest, as a protection that is in place. A typo here
  // is silent in exactly the direction that matters.
  let sensitive: unknown;
  try {
    sensitive = JSON.parse(readFileSync(join(extDir, 'manifest.json'), 'utf8')).sensitiveResources;
  } catch {
    /* already reported above */
  }
  const stray = (Array.isArray(sensitive) ? sensitive.map(String) : [])
    .filter((s) => !list.has(s))
    .sort();
  if (stray.length > 0) {
    return `declares ${stray.map((s) => `'${s}'`).join(', ')} as sensitive, but does not guard it — the name must appear in manifest.resources too`;
  }
  return null;
}

/**
 * First-party reach beyond the declared model (ADR 0056 d2, closes DR-14).
 *
 * A first-party extension uses nothing a third party does not have — host
 * collections, actions, the data API as the caller — except what this list
 * names. The names are the raw handles the declared model replaces: `ctx.db`
 * (a SQL handle, row policies only), the authorization helpers the wave retired
 * (`checkPermission`, `getUserRoles`), and each `ctx.internals.<method>` (most
 * of them engine-side shortcuts, several of them `asSystem`).
 *
 * An extension reaching for a handle it is not listed for fails the gate. A
 * listed handle it no longer uses is reported so the entry can go: this list
 * only shrinks. Adding an entry is a decision against ADR 0056 d2 — the reason
 * must say why the declared model cannot do it yet, and what replaces it.
 *
 * Lexical, like the rest of this file: it sees `ctx.db`, a destructure from
 * `ctx`, and `internals.<method>` under that name. A handle renamed on the way
 * (`const h = ctx; h.db`) passes unseen. Hygiene gate, not a boundary — the
 * boundary is that third-party code runs on the runner, where `ctx.db` and
 * `ctx.internals` do not exist.
 */
const FIRST_PARTY_REACH: Record<string, { reach: string[]; why: string }> = {
  'analytics/dashboard': {
    reach: ['db', 'checkPermission', 'getUserRoles', 'internals.listRoles'],
    why: 'legacy widget queries over raw SQL; replaced by the aggregate route (ADR 0050) and view/2 `chart` (ADR 0051)',
  },
  'auth/ldap': {
    reach: ['internals.asSystem', 'internals.isTenantAdmin'],
    why: 'directory sync writes users and memberships outside any caller session (ADR 0039 directory)',
  },
  'auth/saml': {
    reach: ['internals.asSystem'],
    why: 'assertion consumer: records the spent assertion before any session exists',
  },
  billing: {
    reach: ['internals.asSystem', 'internals.isSingleTenantInstance'],
    why: 'Stripe webhook: no caller, the signature is the check; claims the event as the system',
  },
  'compliance/gdpr': {
    reach: ['internals.exportUserData'],
    why: 'Art. 15 export spans engine-owned identity tables no collection exposes',
  },
  'compliance/ro/efactura': {
    reach: ['internals.asSystem'],
    why: 'ANAF upload/poll jobs run without a caller; ported after RFC phase D',
  },
  'content/document-templates': {
    reach: ['internals.createRecord', 'internals.readRecord', 'internals.generatePDFAsync'],
    why: 'routes write as the caller through the data API and render PDFs on the engine renderer; actions pending',
  },
  'content/documents': {
    reach: [
      'internals.createRecord',
      'internals.readRecord',
      'internals.listRecords',
      'internals.updateRecord',
      'internals.generatePDFAsync',
    ],
    why: 'routes write as the caller through the data API and render PDFs on the engine renderer; actions pending',
  },
  'data/export': {
    reach: ['internals.listRecords', 'internals.recordsToCsv', 'internals.audit'],
    why: 'reads a collection the caller names at call time, as the caller; becomes an action with `"*"` reads (ADR 0047 d1)',
  },
  'data/import': {
    reach: ['internals.createRecord', 'internals.readRecord', 'internals.updateRecord', 'internals.deleteRecord'],
    why: 'writes a collection the caller names at call time, as the caller; becomes an action (ext#387, ADR 0047 d1)',
  },
  'developer/byod': {
    reach: [
      'db',
      'internals.introspectSchema',
      'internals.requireInstanceAdmin',
      'internals.createRecord',
      'internals.readRecord',
      'internals.updateRecord',
    ],
    why: 'introspects an external database, instance admin only; replaced by `zveltio adopt` (ADR 0054)',
  },
  'developer/graphql': {
    reach: [
      'db',
      'internals.caller',
      'internals.checkAccess',
      'internals.readScope',
      'internals.isTenantAdmin',
      'internals.createRecord',
      'internals.updateRecord',
      'internals.deleteRecord',
    ],
    why: 'resolvers read every collection through the caller\'s row-policy handle and write through the data API; declared routes until ADR 0039 slice 5/6',
  },
  'integrations/api-connector': {
    reach: ['internals.asSystem'],
    why: 'incoming webhook: no caller, the per-webhook HMAC is the check',
  },
  sms: {
    reach: ['internals.asSystem'],
    why: 'Twilio status callback: no caller, the signature is the check',
  },
};

const REACH_MEMBERS = new Set(['db', 'checkPermission', 'getUserRoles']);

/** The raw handles one extension's engine code reaches for. */
function reachOf(code: string): Set<string> {
  const found = new Set<string>();
  for (const m of code.matchAll(/\bctx\.(db|checkPermission|getUserRoles)\b/g)) found.add(m[1]);
  for (const m of code.matchAll(/\{([^{}]*)\}\s*=\s*ctx\b/g)) {
    for (const part of m[1].split(',')) {
      const name = part.split(':')[0].trim();
      if (REACH_MEMBERS.has(name)) found.add(name);
    }
  }
  for (const m of code.matchAll(/\binternals\.([A-Za-z_$][\w$]*)/g)) found.add(`internals.${m[1]}`);
  return found;
}

const findings: string[] = [];
const globalFindings: string[] = [];
const resourceFindings: string[] = [];
const reachFindings: string[] = [];
const reachStale: string[] = [];
let checked = 0;
let exempt = 0;

const extensions = findExtensions(ROOT).sort();
for (const extDir of extensions) {
  const rel = relative(ROOT, extDir) || extDir;

  let source = '';
  // What the write-route requirement reads: every file but an allowlisted one.
  let guarded = '';
  for (const file of walk(join(extDir, 'engine'))) {
    try {
      const text = `${readFileSync(file, 'utf8')}\n`;
      source += text;
      if (ALLOWLIST[relative(ROOT, file)]) exempt++;
      else guarded += text;
    } catch {
      /* unreadable — nothing to assert about it */
    }
  }
  const code = stripComments(source);

  const globalIssue = checkGlobalRouteDeclaration(extDir, code);
  if (globalIssue) globalFindings.push(rel);

  const resourceIssue = checkResourceDeclaration(extDir, code);
  if (resourceIssue) resourceFindings.push(`${rel} — ${resourceIssue}`);

  const allowed = new Set(FIRST_PARTY_REACH[rel]?.reach ?? []);
  const reach = reachOf(code);
  const extra = [...reach].filter((r) => !allowed.has(r)).sort();
  if (extra.length > 0) reachFindings.push(`${rel} — ${extra.join(', ')}`);
  const unused = [...allowed].filter((r) => !reach.has(r)).sort();
  if (unused.length > 0) reachStale.push(`${rel} — ${unused.join(', ')}`);

  if (!WRITE_ROUTE.test(stripComments(guarded))) continue;

  checked++;
  if (!AUTHORIZATION.some((re) => re.test(code))) findings.push(rel);
}

if (globalFindings.length > 0) {
  console.error(
    `\n❌ extension-authorization: ${globalFindings.length} extension(s) mount routes on the global app without declaring them.\n`,
  );
  for (const f of globalFindings) console.error(`  ${f}`);
  console.error(
    '\n  `ctx.registerPublicRoute` puts a path at the ROOT of the instance, outside\n' +
      '  the /ext/* auth gate. That is allowed; leaving it invisible is not.\n\n' +
      '  Add the paths to manifest.globalRoutes.\n',
  );
}

if (resourceFindings.length > 0) {
  console.error(
    `\n❌ extension-authorization: ${resourceFindings.length} extension(s) guard resources they do not declare.\n`,
  );
  for (const f of resourceFindings) console.error(`  ${f}`);
  console.error(
    '\n  The engine denies by default, and grants for a resource are created from\n' +
      '  this declaration. Undeclared, the guard still runs and still refuses —\n' +
      '  everyone but an administrator gets a 403 and no log line explains it.\n\n' +
      '  Add the names to manifest.resources (an array of strings). This is NOT\n' +
      '  manifest.permissions, which lists host capabilities.\n',
  );
}

for (const name of Object.keys(FIRST_PARTY_REACH)) {
  if (!extensions.some((d) => relative(ROOT, d) === name)) reachStale.push(`${name} — no such extension`);
}

if (reachStale.length > 0) {
  console.log(`extension-authorization: FIRST_PARTY_REACH lists ${reachStale.length} handle set(s) no longer used — remove them:`);
  for (const f of reachStale) console.log(`  ${f}`);
}

if (reachFindings.length > 0) {
  console.error(
    `\n❌ extension-authorization: ${reachFindings.length} extension(s) reach past the declared model without a FIRST_PARTY_REACH entry.\n`,
  );
  for (const f of reachFindings) console.error(`  ${f}`);
  console.error(
    '\n  ADR 0056 d2: a first-party extension uses what a third party has — host\n' +
      '  collections, actions, the data API as the caller. Use those. An entry in\n' +
      '  FIRST_PARTY_REACH is a decision the owner takes, with its reason.\n',
  );
}

if (findings.length > 0 || globalFindings.length > 0 || resourceFindings.length > 0 || reachFindings.length > 0) {
  if (findings.length === 0) process.exit(1);
}

if (findings.length > 0) {
  console.error(
    `❌ extension-authorization: ${findings.length} extension(s) register state-changing routes with no authorization anywhere.\n`,
  );
  for (const f of findings) console.error(`  ${f}`);
  console.error(
    '\n  A session check proves the caller is somebody. It does not say they may\n' +
      '  change this data — without a permission check, every member of a tenant can.\n\n' +
      "  Add one line where the router is built:  app.use('*', permissionGate(ctx, '<resource>'))\n" +
      '  (import from @zveltio/sdk/extension), or a per-route check where the\n' +
      '  granularity differs.\n',
  );
  process.exit(1);
}

console.log(
  `✅ extension-authorization: all ${checked} extension(s) with state-changing routes authorize them` +
    `${exempt > 0 ? ` (${exempt} allowlisted)` : ', with no exceptions'}.`,
);
