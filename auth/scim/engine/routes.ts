/**
 * auth/scim — SCIM 2.0 user provisioning.
 *
 * Every route is declared in the manifest and answered by a plain function
 * (ADR 0039):
 *   • `POST /tokens` (`caller`): mint the bearer token an IdP uses. The raw
 *     token is returned exactly once; the row goes in through the data API as
 *     the caller, so who may mint is the engine's rule on `scim_tokens`.
 *   • `/v2/*` (`public`, bearer-auth'd): the endpoints Azure AD / Entra and Okta
 *     drive — ServiceProviderConfig, Users CRUD with `userName eq` filtering and
 *     PatchOp `active` handling.
 *
 * The directory is the engine's (ADR 0039 decision 9): SCIM maps the protocol
 * onto `host.identity`'s `provision`, `update`, `setActive`, `remove`, `list`
 * and `get`. The engine keeps the link between an account and this provider,
 * reaches only the accounts this provider provisioned in the request's tenant,
 * enforces `active` (per tenant on a multi-tenant instance, sign-in itself on a
 * single-tenant one), refuses a membership the business ended, and audits each
 * act with `ext:auth/scim` as the actor. This extension holds no directory
 * internal and writes no engine table.
 *
 * The SCIM `id` of a user is this provider's `subject` for the account: a
 * random id for one provisioned here, the engine user id for one provisioned
 * by 2.x (engine migration 120 carried those over).
 */

import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import type {
  DeclaredRouteHost,
  DirectoryAccount,
  ExtensionContext,
  RouteHandler,
  RouteIdentity,
} from '@zveltio/sdk/extension';

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const SCIM_LIST = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';
const SCIM_ERROR = 'urn:ietf:params:scim:api:messages:2.0:Error';
const SCIM_PATCH = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';

/** The directory operations of `host.identity`, as engines from 3.0.0-beta.114 serve them. */
type Directory = Required<Pick<RouteIdentity, 'provision' | 'update' | 'setActive' | 'remove' | 'list' | 'get'>>;

/**
 * What the handlers keep from `register`: reading `scim_tokens` / `scim_users`
 * as the system (`data:system`) — the IdP has no principal for collection
 * permissions to answer, and a public route reads as the tenant's `public`
 * role, which holds no grant on them (ADR 0020).
 */
let kept: Pick<ExtensionContext, 'internals'> | undefined;

export function keepContext(ctx: ExtensionContext): void {
  kept = ctx;
}

/**
 * A token's fingerprint: SHA-256, hex. The token is 192 random bits, so a plain
 * hash is enough to store it — no instance secret is involved, and nothing
 * here can be turned back into a token.
 */
async function tokenHash(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function scimError(status: number, detail: string, scimType?: string): Response {
  return Response.json({ schemas: [SCIM_ERROR], status: String(status), scimType, detail }, { status });
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

/**
 * A refusal the engine's rules answered, said as a SCIM error the IdP can act
 * on rather than a bare 500 it would retry forever. Anything else is a bug and
 * propagates.
 */
function refusal(err: unknown): Response | null {
  const { code, status, message } = err as { code?: string; status?: number; message: string };
  if (typeof status !== 'number' || status < 400 || status >= 500) return null;
  if (code === 'no_such_user') return scimError(404, 'User not found');
  if (code === 'account_exists' || code === 'email_taken') return scimError(409, message, 'uniqueness');
  if (code === 'invalid_input') return scimError(400, message, 'invalidValue');
  return scimError(status, message);
}

function toScimUser(a: DirectoryAccount, externalId?: string | null): object {
  return {
    schemas: [SCIM_USER],
    id: a.subject,
    userName: a.email,
    externalId: externalId ?? undefined,
    name: { formatted: a.name || a.email },
    displayName: a.name || a.email,
    emails: [{ value: a.email, primary: true }],
    active: a.active,
    meta: { resourceType: 'User', created: a.createdAt, lastModified: a.updatedAt },
  };
}

/** The SCIM handlers' common start: the context, the directory, the bearer token. */
async function gate(request: Request, host: DeclaredRouteHost): Promise<Directory | Response> {
  const ctx = kept;
  const identity = host.identity;
  if (!ctx || !identity?.provision) throw new Error('[scim] needs engine 3.0.0-beta.114 (host.identity directory)');
  const header = request.headers.get('authorization') ?? '';
  const raw = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!raw) return scimError(401, 'Bearer token required');
  const hash = await tokenHash(raw);
  // In the request's tenant (per-tenant hostname or `x-tenant-slug`), as the
  // system: the IdP has no principal. A token another tenant issued is not
  // found here, and the directory operations act in this same tenant.
  const token = await ctx.internals.asSystem(
    ['scim_tokens'],
    async () => {
      const { records } = (await host.collections.list('scim_tokens', {
        filter: { token_hash: { eq: hash } },
        limit: 1,
      })) as { records: Array<{ id: string }> };
      const found = records[0];
      if (found) {
        await host.collections.update('scim_tokens', found.id, { last_used_at: new Date().toISOString() });
      }
      return found;
    },
    // The audit row names the token that called, not only "system".
    { reason: 'SCIM bearer token', actor: (t) => (t ? `scim:${t.id}` : undefined) },
  );
  if (!token) return scimError(401, 'Invalid bearer token');
  return identity as Directory;
}

/** `externalId` by engine user id: the one SCIM attribute the engine does not keep. */
async function externalIds(host: DeclaredRouteHost, userIds: string[]): Promise<Map<string, string | null>> {
  if (userIds.length === 0) return new Map();
  const { records } = (await kept!.internals.asSystem(['scim_users'], () =>
    host.collections.list('scim_users', { filter: { user_id: { in: userIds } }, limit: userIds.length }),
  )) as { records: Array<{ user_id: string; external_id: string | null }> };
  return new Map(records.map((r) => [r.user_id, r.external_id]));
}

async function saveExternalId(host: DeclaredRouteHost, userId: string, externalId: unknown): Promise<void> {
  if (typeof externalId !== 'string') return;
  await kept!.internals.asSystem(['scim_users'], async () => {
    const { records } = (await host.collections.list('scim_users', {
      filter: { user_id: { eq: userId } },
      limit: 1,
    })) as { records: Array<{ id: string; external_id: string | null }> };
    const row = records[0];
    if (!row) await host.collections.insert('scim_users', { user_id: userId, external_id: externalId });
    else if (row.external_id !== externalId) {
      await host.collections.update('scim_users', row.id, { external_id: externalId });
    }
  });
}

async function scimUser(host: DeclaredRouteHost, a: DirectoryAccount): Promise<object> {
  return toScimUser(a, (await externalIds(host, [a.id])).get(a.id));
}

/**
 * Run a request's directory writes. A refusal before anything was written is
 * answered as a SCIM error; one after a write is thrown, so the request rolls
 * back and the IdP never sees half an update (a profile changed while the
 * deactivation it came with was refused).
 */
async function writes(run: (wrote: () => void) => Promise<Response>): Promise<Response> {
  let written = false;
  try {
    return await run(() => {
      written = true;
    });
  } catch (err) {
    const answer = written ? null : refusal(err);
    if (!answer) throw err;
    return answer;
  }
}

/**
 * Rename / re-address. An account this tenant does not ALONE hold — a member of
 * another tenant, an instance admin — is not this IdP's to rename or
 * re-address: its password reset would follow the address. The rest of the
 * request (the `active` flag above all) still applies.
 */
async function updateProfile(
  dir: Directory,
  subject: string,
  patch: { name?: string; email?: string },
  wrote: () => void,
): Promise<void> {
  try {
    await dir.update(subject, patch);
    wrote();
  } catch (err) {
    if ((err as { code?: string }).code !== 'user_not_owned') throw err;
    console.warn(`[scim] profile of ${subject} left unchanged: ${(err as Error).message}`);
  }
}

// Minting is the one thing the data API cannot do: the raw token exists only
// here, and only its hash is stored. Listing and revoking tokens is
// `GET`/`DELETE /api/data/scim_tokens`.
const TokenBody = z.object({ name: z.string().min(1).max(120) });

export const mintToken: RouteHandler = async (request, { host }) => {
  const parsed = TokenBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues }, 400);
  const raw = `zvscim_${randomBytes(24).toString('hex')}`;
  // As the caller: no default grants on `scim_tokens`, so tenant
  // administrators mint, other roles only when granted. A refusal throws with
  // the data API's status.
  const row = await host.collections.insert('scim_tokens', {
    name: parsed.data.name,
    token_hash: await tokenHash(raw),
  });
  // Shown exactly once — paste it into the IdP's provisioning config.
  return json({ id: row.id, token: raw, base_url: '/ext/auth/scim/v2' }, 201);
};

export const serviceProviderConfig: RouteHandler = async (request, { host }) => {
  const dir = await gate(request, host);
  if (dir instanceof Response) return dir;
  return json({
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      { type: 'oauthbearertoken', name: 'Bearer token', description: 'Long-lived bearer token configured in Zveltio Studio' },
    ],
  });
};

// GET /Users — this provider's users in this tenant; supports the
// `userName eq "email"` probe every IdP does.
export const listUsers: RouteHandler = async (request, { host }) => {
  const dir = await gate(request, host);
  if (dir instanceof Response) return dir;
  const q = new URL(request.url).searchParams;
  const startIndex = Math.max(1, Number.parseInt(q.get('startIndex') ?? '1', 10) || 1);
  const count = Math.min(200, Math.max(0, Number.parseInt(q.get('count') ?? '100', 10) || 100));
  const m = (q.get('filter') ?? '').match(/userName\s+eq\s+"([^"]+)"/i);
  const accounts = m ? await dir.list({ email: m[1]! }) : await dir.list({ limit: count, offset: startIndex - 1 });
  const ext = await externalIds(
    host,
    accounts.map((a) => a.id),
  );
  const resources = accounts.map((a) => toScimUser(a, ext.get(a.id)));
  return json({
    schemas: [SCIM_LIST],
    totalResults: resources.length,
    startIndex,
    itemsPerPage: resources.length,
    Resources: resources,
  });
};

// 404 for an account another provider or tenant holds: whether it exists is
// not this caller's to learn.
export const getUser: RouteHandler = async (request, { host, params }) => {
  const dir = await gate(request, host);
  if (dir instanceof Response) return dir;
  const a = await dir.get(params.id!);
  return a ? json(await scimUser(host, a)) : scimError(404, 'User not found');
};

// POST /Users — provision a NEW account into this tenant. An e-mail that
// already has an account answers 409 `uniqueness` and changes nothing: joining
// an existing account to a tenant is a tenant administrator's act (invitation),
// not something an IdP can do by naming an e-mail.
export const createUser: RouteHandler = async (request, { host }) => {
  const dir = await gate(request, host);
  if (dir instanceof Response) return dir;
  // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
  const body = (await request.json().catch(() => null)) as any;
  const email: string | undefined = body?.userName ?? body?.emails?.[0]?.value;
  if (!email) return scimError(400, 'userName (email) is required');
  const name: string = body?.name?.formatted ?? body?.displayName ?? email;
  return writes(async (wrote) => {
    const a = await dir.provision({ subject: crypto.randomUUID(), email, name, active: body?.active !== false });
    wrote();
    await saveExternalId(host, a.id, body?.externalId);
    return json(toScimUser(a, typeof body?.externalId === 'string' ? body.externalId : null), 201);
  });
};

/**
 * PUT /Users/:id — full replace (RFC 7644 §3.5.1). Okta's profile push uses
 * PUT. Replace semantics: absent `active` means `true`, because in a PUT the
 * absence of a field is an assertion about its value. A membership the
 * business ended answers 403 (`not_in_force`): read and remove only.
 */
export const replaceUser: RouteHandler = async (request, { host, params }) => {
  const dir = await gate(request, host);
  if (dir instanceof Response) return dir;
  const subject = params.id!;
  // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
  const body = (await request.json().catch(() => null)) as any;
  if (!(await dir.get(subject))) return scimError(404, 'User not found');
  if (!body || (body.schemas && !body.schemas.includes(SCIM_USER))) {
    return scimError(400, 'Expected a SCIM User payload');
  }
  const email: string | undefined = body?.userName ?? body?.emails?.[0]?.value;
  if (!email) return scimError(400, 'userName (email) is required');
  const name: string = body?.name?.formatted ?? body?.displayName ?? email;
  return writes(async (wrote) => {
    await updateProfile(dir, subject, { name, email }, wrote);
    const after = await dir.setActive(subject, body?.active !== false);
    wrote();
    await saveExternalId(host, after.id, body?.externalId);
    return json(await scimUser(host, after));
  });
};

// PATCH /Users/:id — Azure/Okta PatchOp; honours `active` (the operation that
// matters for offboarding) and name/displayName replaces. RFC 7644 §3.5.2: the
// operations are applied as a set — one transaction.
export const patchUser: RouteHandler = async (request, { host, params }) => {
  const dir = await gate(request, host);
  if (dir instanceof Response) return dir;
  const subject = params.id!;
  // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
  const body = (await request.json().catch(() => null)) as any;
  if (!(await dir.get(subject))) return scimError(404, 'User not found');
  if (!body?.schemas?.includes(SCIM_PATCH) || !Array.isArray(body.Operations)) {
    return scimError(400, 'Expected a SCIM PatchOp payload');
  }
  const truthy = (v: unknown) => v === true || v === 'True' || v === 'true';
  return writes(async (wrote) => {
    const setActive = async (v: unknown) => {
      await dir.setActive(subject, truthy(v));
      wrote();
    };
    const rename = (v: unknown) => updateProfile(dir, subject, { name: String(v) }, wrote);
    for (const op of body.Operations) {
      const kind = String(op.op ?? '').toLowerCase();
      if (kind !== 'replace' && kind !== 'add') continue;
      const path = String(op.path ?? '').toLowerCase();
      if (path === 'active') await setActive(op.value);
      else if (path === 'displayname' || path === 'name.formatted') await rename(op.value);
      else if (!path && op.value && typeof op.value === 'object') {
        if ('active' in op.value) await setActive(op.value.active);
        if (typeof op.value.displayName === 'string') await rename(op.value.displayName);
      }
    }
    const after = await dir.get(subject);
    if (!after) return scimError(404, 'User not found');
    return json(await scimUser(host, after));
  });
};

// DELETE /Users/:id — deprovision from THIS tenant. The engine removes the
// membership, ends the sessions when no tenant is left in force, and deletes
// the account only when nothing else holds it.
export const deleteUser: RouteHandler = async (request, { host, params }) => {
  const dir = await gate(request, host);
  if (dir instanceof Response) return dir;
  return writes(async () => {
    await dir.remove(params.id!);
    return new Response(null, { status: 204 });
  });
};

// Groups: not supported — advertise emptiness instead of erroring.
export const listGroups: RouteHandler = async (request, { host }) => {
  const dir = await gate(request, host);
  if (dir instanceof Response) return dir;
  return json({ schemas: [SCIM_LIST], totalResults: 0, startIndex: 1, itemsPerPage: 0, Resources: [] });
};
