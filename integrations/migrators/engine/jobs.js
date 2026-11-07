// engine/adapters.ts
class SourceError extends Error {
  status;
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
var isTransient = (err) => !(err instanceof SourceError) || err.status === 429 || err.status >= 500;
async function getJson(fetch, url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new SourceError(`${new URL(url).host} responded ${res.status}: ${body.slice(0, 200)}`, res.status);
  }
  return res.json();
}
async function postJson(fetch, url, headers, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new SourceError(`${new URL(url).host} responded ${res.status}: ${t.slice(0, 200)}`, res.status);
  }
  return res.json();
}
function flat(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (v === null || ["string", "number", "boolean"].includes(typeof v))
      out[k] = v;
    else if (Array.isArray(v))
      out[k] = v.map((x) => typeof x === "object" ? JSON.stringify(x) : x).join(", ");
    else
      out[k] = JSON.stringify(v);
  }
  return out;
}
var hubspot = {
  async listObjects(_fetch) {
    return [
      { id: "contacts", label: "Contacts" },
      { id: "companies", label: "Companies" },
      { id: "deals", label: "Deals" },
      { id: "tickets", label: "Tickets" }
    ];
  },
  async fetchRows(fetch, token, object, limit) {
    const auth = { Authorization: `Bearer ${token}` };
    const defs = await getJson(fetch, `https://api.hubapi.com/crm/v3/properties/${encodeURIComponent(object)}`, auth);
    const props = (defs.results ?? []).map((p) => encodeURIComponent(String(p.name))).join(",");
    const rows = [];
    let after;
    while (rows.length < limit) {
      const page = Math.min(100, limit - rows.length);
      const url = `https://api.hubapi.com/crm/v3/objects/${encodeURIComponent(object)}?limit=${page}${props ? `&properties=${props}` : ""}${after ? `&after=${encodeURIComponent(after)}` : ""}`;
      const data = await getJson(fetch, url, auth);
      for (const r of data.results ?? [])
        rows.push({ hubspot_id: r.id, ...flat(r.properties ?? {}) });
      after = data.paging?.next?.after;
      if (!after || (data.results ?? []).length === 0)
        break;
    }
    const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    return { fields, rows };
  }
};
var NOTION_HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  "Notion-Version": "2022-06-28"
});
function notionValue(prop) {
  if (!prop)
    return null;
  switch (prop.type) {
    case "title":
      return (prop.title ?? []).map((t) => t.plain_text).join("");
    case "rich_text":
      return (prop.rich_text ?? []).map((t) => t.plain_text).join("");
    case "number":
      return prop.number;
    case "checkbox":
      return prop.checkbox;
    case "select":
      return prop.select?.name ?? null;
    case "multi_select":
      return (prop.multi_select ?? []).map((s) => s.name).join(", ");
    case "date":
      return prop.date?.start ?? null;
    case "email":
      return prop.email;
    case "phone_number":
      return prop.phone_number;
    case "url":
      return prop.url;
    case "status":
      return prop.status?.name ?? null;
    case "people":
      return (prop.people ?? []).map((p) => p.name ?? p.id).join(", ");
    default:
      return prop[prop.type] === undefined ? null : JSON.stringify(prop[prop.type]);
  }
}
var notion = {
  async listObjects(fetch, token) {
    const out = [];
    let cursor;
    do {
      const data = await postJson(fetch, "https://api.notion.com/v1/search", NOTION_HEADERS(token), {
        filter: { property: "object", value: "database" },
        page_size: 100,
        ...cursor ? { start_cursor: cursor } : {}
      });
      for (const d of data.results ?? []) {
        out.push({ id: d.id, label: (d.title ?? []).map((t) => t.plain_text).join("") || d.id });
      }
      cursor = data.has_more ? data.next_cursor ?? undefined : undefined;
    } while (cursor);
    return out;
  },
  async fetchRows(fetch, token, object, limit) {
    const rows = [];
    let cursor;
    while (rows.length < limit) {
      const data = await postJson(fetch, `https://api.notion.com/v1/databases/${encodeURIComponent(object)}/query`, NOTION_HEADERS(token), { page_size: Math.min(100, limit - rows.length), ...cursor ? { start_cursor: cursor } : {} });
      for (const page of data.results ?? []) {
        const row = { notion_id: page.id };
        for (const [name, prop] of Object.entries(page.properties ?? {}))
          row[name] = notionValue(prop);
        rows.push(row);
      }
      cursor = data.next_cursor ?? undefined;
      if (!data.has_more)
        break;
    }
    const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    return { fields, rows };
  }
};
var airtable = {
  async listObjects(fetch, token) {
    const auth = { Authorization: `Bearer ${token}` };
    const bases = [];
    let offset;
    do {
      const data = await getJson(fetch, `https://api.airtable.com/v0/meta/bases${offset ? `?offset=${encodeURIComponent(offset)}` : ""}`, auth);
      bases.push(...data.bases ?? []);
      offset = data.offset;
    } while (offset);
    const out = [];
    for (const base of bases) {
      const tables = await getJson(fetch, `https://api.airtable.com/v0/meta/bases/${encodeURIComponent(base.id)}/tables`, auth);
      for (const t of tables.tables ?? []) {
        out.push({ id: `${base.id}/${t.id}`, label: `${base.name} → ${t.name}` });
      }
    }
    return out;
  },
  async fetchRows(fetch, token, object, limit) {
    const [baseId, tableId] = object.split("/");
    if (!baseId || !tableId)
      throw new Error('Airtable object must be "baseId/tableId"');
    const rows = [];
    let offset;
    while (rows.length < limit) {
      const url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}?pageSize=${Math.min(100, limit - rows.length)}${offset ? `&offset=${encodeURIComponent(offset)}` : ""}`;
      const data = await getJson(fetch, url, { Authorization: `Bearer ${token}` });
      for (const r of data.records ?? [])
        rows.push({ airtable_id: r.id, ...flat(r.fields ?? {}) });
      offset = data.offset;
      if (!offset || (data.records ?? []).length === 0)
        break;
    }
    const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    return { fields, rows };
  }
};
var ADAPTERS = { hubspot, notion, airtable };

// engine/migrators.ts
var CONNECTIONS = "migrator_connections";
var FETCHES = "migrator_fetches";
function toColumn(field) {
  const c = field.normalize("NFD").replace(/\p{M}+/gu, "").trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
  return /^[a-z_]/.test(c) ? c : `f_${c}`;
}
function inferType(values) {
  const present = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (present.length === 0)
    return "text";
  if (present.every((v) => typeof v === "boolean"))
    return "boolean";
  if (present.every((v) => typeof v === "number"))
    return "decimal";
  if (present.every((v) => typeof v === "string" && !Number.isNaN(Date.parse(v)) && /\d{4}-\d{2}-\d{2}/.test(v))) {
    return "datetime";
  }
  return "text";
}

// engine/jobs.ts
function fetchOf(host) {
  if (!host.fetch)
    throw new Error("This engine runs jobs without fetch; migrators need 3.0.0-beta.103 or later.");
  return host.fetch;
}
var OPEN = ["pending", "fetching"];
var message = (err) => (err instanceof Error ? err.message : String(err)).slice(0, 2000);
var discover = async (input, host) => {
  const { id } = input;
  const conn = await host.collections.read(CONNECTIONS, id);
  if (!conn)
    return;
  const adapter = ADAPTERS[conn.source];
  if (!adapter)
    throw new Error(`Unknown source ${String(conn.source)}`);
  const at = new Date().toISOString();
  try {
    const objects = await adapter.listObjects(fetchOf(host), String(conn.token));
    await host.collections.update(CONNECTIONS, id, { objects, objects_error: null, objects_at: at });
  } catch (err) {
    await host.collections.update(CONNECTIONS, id, { objects_error: message(err), objects_at: at });
    if (isTransient(err))
      throw err;
  }
};
var fetch = async (input, host) => {
  const { id } = input;
  const f = await host.collections.read(FETCHES, id);
  if (!f || !OPEN.includes(f.status))
    return;
  const conn = await host.collections.read(CONNECTIONS, String(f.connection_id));
  await host.collections.update(FETCHES, id, { status: "fetching" }, { expect: { status: OPEN } });
  const expect = { status: ["fetching"] };
  const fail = (error) => host.collections.update(FETCHES, id, { status: "failed", error, fetched_at: new Date().toISOString() }, { expect });
  const adapter = conn ? ADAPTERS[conn.source] : undefined;
  if (!conn || !adapter)
    return void await fail("The connection is gone.");
  let result;
  try {
    result = await adapter.fetchRows(fetchOf(host), String(conn.token), String(f.object), Number(f.row_limit));
  } catch (err) {
    if (!isTransient(err))
      return void await fail(message(err));
    await host.collections.update(FETCHES, id, { error: `Retrying: ${message(err)}` }, { expect });
    throw err;
  }
  const { fields, rows } = result;
  const columns = fields.map((field) => ({
    source_field: field,
    column: toColumn(field),
    type: inferType(rows.map((r) => r[field]))
  }));
  await host.collections.update(FETCHES, id, { status: "ready", columns, rows, total_rows: rows.length, error: null, fetched_at: new Date().toISOString() }, { expect });
};
var jobs_default = { discover, fetch };
export {
  jobs_default as default
};
