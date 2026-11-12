// @bun
// engine/routes.ts
var SCIM_USER = "urn:ietf:params:scim:schemas:core:2.0:User";
var SCIM_LIST = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
var SCIM_ERROR = "urn:ietf:params:scim:api:messages:2.0:Error";
var SCIM_PATCH = "urn:ietf:params:scim:api:messages:2.0:PatchOp";
function scimError(status, detail, scimType) {
  return Response.json({ schemas: [SCIM_ERROR], status: String(status), scimType, detail }, { status });
}
var json = (body, status = 200) => Response.json(body, { status });
function refusal(err) {
  const { code, status, message } = err;
  if (typeof status !== "number" || status < 400 || status >= 500)
    return null;
  if (code === "no_such_user")
    return scimError(404, "User not found");
  if (code === "account_exists" || code === "email_taken")
    return scimError(409, message, "uniqueness");
  if (code === "invalid_input")
    return scimError(400, message, "invalidValue");
  return scimError(status, message);
}
function toScimUser(a) {
  return {
    schemas: [SCIM_USER],
    id: a.subject,
    userName: a.email,
    name: { formatted: a.name || a.email },
    displayName: a.name || a.email,
    emails: [{ value: a.email, primary: true }],
    active: a.active,
    meta: { resourceType: "User", created: a.createdAt, lastModified: a.updatedAt }
  };
}
function scim(run) {
  return async (request, { host, params }) => {
    const dir = host.identity;
    if (!dir?.provision)
      throw new Error("[scim] needs engine 3.0.0-beta.114 (host.identity directory)");
    let written = false;
    try {
      return await run(request, dir, params, () => {
        written = true;
      });
    } catch (err) {
      const answer = written ? null : refusal(err);
      if (!answer)
        throw err;
      return answer;
    }
  };
}
async function updateProfile(dir, subject, patch, wrote) {
  try {
    await dir.update(subject, patch);
    wrote();
  } catch (err) {
    if (err.code !== "user_not_owned")
      throw err;
    console.warn(`[scim] profile of ${subject} left unchanged: ${err.message}`);
  }
}
var serviceProviderConfig = scim(async (_request, dir) => {
  await dir.list({ limit: 0 });
  return json({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: "oauthbearertoken",
        name: "Bearer token",
        description: "A Zveltio API key (zvk_\u2026) holding $ext:auth/scim, issued by a tenant administrator"
      }
    ]
  });
});
var listUsers = scim(async (request, dir) => {
  const q = new URL(request.url).searchParams;
  const startIndex = Math.max(1, Number.parseInt(q.get("startIndex") ?? "1", 10) || 1);
  const count = Math.min(200, Math.max(0, Number.parseInt(q.get("count") ?? "100", 10) || 100));
  const m = (q.get("filter") ?? "").match(/userName\s+eq\s+"([^"]+)"/i);
  const accounts = m ? await dir.list({ email: m[1] }) : await dir.list({ limit: count, offset: startIndex - 1 });
  const resources = accounts.map(toScimUser);
  return json({
    schemas: [SCIM_LIST],
    totalResults: resources.length,
    startIndex,
    itemsPerPage: resources.length,
    Resources: resources
  });
});
var getUser = scim(async (_request, dir, params) => {
  const a = await dir.get(params.id);
  return a ? json(toScimUser(a)) : scimError(404, "User not found");
});
var createUser = scim(async (request, dir, _params, wrote) => {
  const body = await request.json().catch(() => null);
  const email = body?.userName ?? body?.emails?.[0]?.value;
  if (!email)
    return scimError(400, "userName (email) is required");
  const name = body?.name?.formatted ?? body?.displayName ?? email;
  const a = await dir.provision({ subject: crypto.randomUUID(), email, name, active: body?.active !== false });
  wrote();
  return json(toScimUser(a), 201);
});
var replaceUser = scim(async (request, dir, params, wrote) => {
  const subject = params.id;
  const body = await request.json().catch(() => null);
  if (!await dir.get(subject))
    return scimError(404, "User not found");
  if (!body || body.schemas && !body.schemas.includes(SCIM_USER)) {
    return scimError(400, "Expected a SCIM User payload");
  }
  const email = body?.userName ?? body?.emails?.[0]?.value;
  if (!email)
    return scimError(400, "userName (email) is required");
  const name = body?.name?.formatted ?? body?.displayName ?? email;
  await updateProfile(dir, subject, { name, email }, wrote);
  const after = await dir.setActive(subject, body?.active !== false);
  wrote();
  return json(toScimUser(after));
});
var patchUser = scim(async (request, dir, params, wrote) => {
  const subject = params.id;
  const body = await request.json().catch(() => null);
  if (!await dir.get(subject))
    return scimError(404, "User not found");
  if (!body?.schemas?.includes(SCIM_PATCH) || !Array.isArray(body.Operations)) {
    return scimError(400, "Expected a SCIM PatchOp payload");
  }
  const truthy = (v) => v === true || v === "True" || v === "true";
  const setActive = async (v) => {
    await dir.setActive(subject, truthy(v));
    wrote();
  };
  const rename = (v) => updateProfile(dir, subject, { name: String(v) }, wrote);
  for (const op of body.Operations) {
    const kind = String(op.op ?? "").toLowerCase();
    if (kind !== "replace" && kind !== "add")
      continue;
    const path = String(op.path ?? "").toLowerCase();
    if (path === "active")
      await setActive(op.value);
    else if (path === "displayname" || path === "name.formatted")
      await rename(op.value);
    else if (!path && op.value && typeof op.value === "object") {
      if ("active" in op.value)
        await setActive(op.value.active);
      if (typeof op.value.displayName === "string")
        await rename(op.value.displayName);
    }
  }
  const after = await dir.get(subject);
  if (!after)
    return scimError(404, "User not found");
  return json(toScimUser(after));
});
var deleteUser = scim(async (_request, dir, params) => {
  await dir.remove(params.id);
  return new Response(null, { status: 204 });
});
var listGroups = scim(async () => json({ schemas: [SCIM_LIST], totalResults: 0, startIndex: 1, itemsPerPage: 0, Resources: [] }));

// engine/index.ts
var extension = {
  name: "auth/scim",
  category: "auth",
  mountStrategy: "subapp",
  routes: {
    serviceProviderConfig,
    listUsers,
    getUser,
    createUser,
    replaceUser,
    patchUser,
    deleteUser,
    listGroups
  },
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
