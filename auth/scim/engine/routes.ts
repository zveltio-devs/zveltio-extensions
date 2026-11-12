/**
 * auth/scim — SCIM 2.0 user provisioning.
 *
 * Every route is declared in the manifest and answered by a plain function
 * (ADR 0039), as a `caller` route: the endpoints Azure AD / Entra and Okta
 * drive — ServiceProviderConfig, Users CRUD with `userName eq` filtering and
 * PatchOp `active` handling.
 *
 * The identity provider authenticates with an engine API key (`zvk_…`, ADR
 * 0045) holding `$ext:auth/scim`, sent as its bearer token: the engine checks
 * the key (tenant, expiry, revocation, issuer) before this code runs, and a
 * key acts as the person who issued it (ADR 0028). Who may provision is the
 * engine's rule too: the directory answers a caller whose author administers
 * the tenant. This extension holds no token and no authorization logic.
 *
 * The directory is the engine's (ADR 0039 decision 9): SCIM maps the protocol
 * onto `host.identity`'s `provision`, `update`, `setActive`, `remove`, `list`
 * and `get`. The engine keeps the link between an account and this provider,
 * reaches only the accounts this provider provisioned in the request's tenant,
 * enforces `active` (per tenant on a multi-tenant instance, sign-in itself on a
 * single-tenant one), refuses a membership the business ended, and audits each
 * act with `ext:auth/scim` as the actor and the key as the caller. This
 * extension holds no directory internal, writes no table and keeps no state:
 * `externalId` is not stored (RFC 7643 makes it optional).
 *
 * The SCIM `id` of a user is this provider's `subject` for the account: a
 * random id for one provisioned here, the engine user id for one provisioned
 * by 2.x (engine migration 120 carried those over).
 */

import type { DirectoryAccount, RouteHandler, RouteIdentity } from '@zveltio/sdk/extension';

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const SCIM_LIST = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';
const SCIM_ERROR = 'urn:ietf:params:scim:api:messages:2.0:Error';
const SCIM_PATCH = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';

/** The directory operations of `host.identity`, as engines from 3.0.0-beta.114 serve them. */
type Directory = Required<Pick<RouteIdentity, 'provision' | 'update' | 'setActive' | 'remove' | 'list' | 'get'>>;

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

function toScimUser(a: DirectoryAccount): object {
  return {
    schemas: [SCIM_USER],
    id: a.subject,
    userName: a.email,
    name: { formatted: a.name || a.email },
    displayName: a.name || a.email,
    emails: [{ value: a.email, primary: true }],
    active: a.active,
    meta: { resourceType: 'User', created: a.createdAt, lastModified: a.updatedAt },
  };
}

type ScimHandler = (
  request: Request,
  dir: Directory,
  params: Record<string, string>,
  wrote: () => void,
) => Promise<Response>;

/**
 * A SCIM route. The engine authenticated the caller (an API key, ADR 0045)
 * and its directory decides what the caller may do. A refusal before anything
 * was written is answered as a SCIM error (an IdP retries a bare 500 forever);
 * one after a write is thrown, so the request rolls back and the IdP never sees
 * half an update (a profile changed while the deactivation it came with was
 * refused). Call `wrote()` after each directory write.
 */
function scim(run: ScimHandler): RouteHandler {
  return async (request, { host, params }) => {
    const dir = host.identity;
    if (!dir?.provision) throw new Error('[scim] needs engine 3.0.0-beta.114 (host.identity directory)');
    let written = false;
    try {
      return await run(request, dir as Directory, params, () => {
        written = true;
      });
    } catch (err) {
      const answer = written ? null : refusal(err);
      if (!answer) throw err;
      return answer;
    }
  };
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

// The first thing an IdP's "Test Connection" calls: it answers only a caller
// the directory answers, so a key that cannot provision fails the test.
export const serviceProviderConfig = scim(async (_request, dir) => {
  await dir.list({ limit: 0 });
  return json({
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: 'oauthbearertoken',
        name: 'Bearer token',
        description: 'A Zveltio API key (zvk_…) holding $ext:auth/scim, issued by a tenant administrator',
      },
    ],
  });
});

// GET /Users — this provider's users in this tenant; supports the
// `userName eq "email"` probe every IdP does.
export const listUsers = scim(async (request, dir) => {
  const q = new URL(request.url).searchParams;
  const startIndex = Math.max(1, Number.parseInt(q.get('startIndex') ?? '1', 10) || 1);
  const count = Math.min(200, Math.max(0, Number.parseInt(q.get('count') ?? '100', 10) || 100));
  const m = (q.get('filter') ?? '').match(/userName\s+eq\s+"([^"]+)"/i);
  const accounts = m ? await dir.list({ email: m[1]! }) : await dir.list({ limit: count, offset: startIndex - 1 });
  const resources = accounts.map(toScimUser);
  return json({
    schemas: [SCIM_LIST],
    totalResults: resources.length,
    startIndex,
    itemsPerPage: resources.length,
    Resources: resources,
  });
});

// 404 for an account another provider or tenant holds: whether it exists is
// not this caller's to learn.
export const getUser = scim(async (_request, dir, params) => {
  const a = await dir.get(params.id!);
  return a ? json(toScimUser(a)) : scimError(404, 'User not found');
});

// POST /Users — provision a NEW account into this tenant. An e-mail that
// already has an account answers 409 `uniqueness` and changes nothing: joining
// an existing account to a tenant is a tenant administrator's act (invitation),
// not something an IdP can do by naming an e-mail.
export const createUser = scim(async (request, dir, _params, wrote) => {
  // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
  const body = (await request.json().catch(() => null)) as any;
  const email: string | undefined = body?.userName ?? body?.emails?.[0]?.value;
  if (!email) return scimError(400, 'userName (email) is required');
  const name: string = body?.name?.formatted ?? body?.displayName ?? email;
  const a = await dir.provision({ subject: crypto.randomUUID(), email, name, active: body?.active !== false });
  wrote();
  return json(toScimUser(a), 201);
});

/**
 * PUT /Users/:id — full replace (RFC 7644 §3.5.1). Okta's profile push uses
 * PUT. Replace semantics: absent `active` means `true`, because in a PUT the
 * absence of a field is an assertion about its value. A membership the
 * business ended answers 403 (`not_in_force`): read and remove only.
 */
export const replaceUser = scim(async (request, dir, params, wrote) => {
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
  await updateProfile(dir, subject, { name, email }, wrote);
  const after = await dir.setActive(subject, body?.active !== false);
  wrote();
  return json(toScimUser(after));
});

// PATCH /Users/:id — Azure/Okta PatchOp; honours `active` (the operation that
// matters for offboarding) and name/displayName replaces. RFC 7644 §3.5.2: the
// operations are applied as a set — one transaction.
export const patchUser = scim(async (request, dir, params, wrote) => {
  const subject = params.id!;
  // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
  const body = (await request.json().catch(() => null)) as any;
  if (!(await dir.get(subject))) return scimError(404, 'User not found');
  if (!body?.schemas?.includes(SCIM_PATCH) || !Array.isArray(body.Operations)) {
    return scimError(400, 'Expected a SCIM PatchOp payload');
  }
  const truthy = (v: unknown) => v === true || v === 'True' || v === 'true';
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
  return json(toScimUser(after));
});

// DELETE /Users/:id — deprovision from THIS tenant. The engine removes the
// membership, ends the sessions when no tenant is left in force, and deletes
// the account only when nothing else holds it.
export const deleteUser = scim(async (_request, dir, params) => {
  await dir.remove(params.id!);
  return new Response(null, { status: 204 });
});

// Groups: not supported — advertise emptiness instead of erroring.
export const listGroups = scim(async () =>
  json({ schemas: [SCIM_LIST], totalResults: 0, startIndex: 1, itemsPerPage: 0, Resources: [] }),
);
