/**
 * Source adapters — one small, uniform surface over each SaaS API:
 *
 *   listObjects(fetch, token)        → what can be imported (tables/bases/objects)
 *   fetchRows(fetch, token, obj, n)  → { fields, rows } normalized to flat records
 *
 * All requests go to FIXED vendor hosts (never user-supplied URLs): the jobs'
 * manifest `egress` lists exactly these three. `fetch` is the job host's
 * (`host.fetch`, ADR 0022): the engine performs every request.
 */

export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

/** The source answered with an error status. */
export class SourceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Worth another attempt: a rate limit, a server error, or no answer at all. */
export const isTransient = (err: unknown) =>
  !(err instanceof SourceError) || err.status === 429 || err.status >= 500;

export interface SourceObject {
  id: string;
  label: string;
}

export interface FetchResult {
  fields: string[];
  // biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
  rows: Array<Record<string, any>>;
}

export interface SourceAdapter {
  listObjects(fetch: Fetch, token: string): Promise<SourceObject[]>;
  fetchRows(fetch: Fetch, token: string, object: string, limit: number): Promise<FetchResult>;
}

async function getJson(fetch: Fetch, url: string, headers: Record<string, string>): Promise<any> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new SourceError(`${new URL(url).host} responded ${res.status}: ${body.slice(0, 200)}`, res.status);
  }
  return res.json();
}

async function postJson(fetch: Fetch, url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new SourceError(`${new URL(url).host} responded ${res.status}: ${t.slice(0, 200)}`, res.status);
  }
  return res.json();
}

/** Flatten one level of nesting (`properties.email` → `email`); a nested value is kept as JSON text. */
// biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
function flat(obj: Record<string, any>): Record<string, any> {
  // biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) out[k] = v;
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : x)).join(', ');
    else out[k] = JSON.stringify(v);
  }
  return out;
}

// ── HubSpot (private-app token) ──────────────────────────────────────

const hubspot: SourceAdapter = {
  async listObjects(_fetch) {
    // The CRM v3 standard objects every portal has.
    return [
      { id: 'contacts', label: 'Contacts' },
      { id: 'companies', label: 'Companies' },
      { id: 'deals', label: 'Deals' },
      { id: 'tickets', label: 'Tickets' },
    ];
  },
  async fetchRows(fetch, token, object, limit) {
    const auth = { Authorization: `Bearer ${token}` };
    // Without `properties` the list answers only HubSpot's defaults: every custom property is asked for by name.
    // ponytail: names in the query string; a portal with thousands of properties needs the batch-read POST.
    const defs = await getJson(fetch, `https://api.hubapi.com/crm/v3/properties/${encodeURIComponent(object)}`, auth);
    // biome-ignore lint/suspicious/noExplicitAny: HubSpot API shapes
    const props = ((defs.results ?? []) as any[]).map((p) => encodeURIComponent(String(p.name))).join(',');
    // biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
    const rows: Array<Record<string, any>> = [];
    let after: string | undefined;
    while (rows.length < limit) {
      const page = Math.min(100, limit - rows.length);
      const url = `https://api.hubapi.com/crm/v3/objects/${encodeURIComponent(object)}?limit=${page}${props ? `&properties=${props}` : ''}${after ? `&after=${encodeURIComponent(after)}` : ''}`;
      const data = await getJson(fetch, url, auth);
      for (const r of data.results ?? []) rows.push({ hubspot_id: r.id, ...flat(r.properties ?? {}) });
      after = data.paging?.next?.after;
      if (!after || (data.results ?? []).length === 0) break;
    }
    const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    return { fields, rows };
  },
};

// ── Notion (integration token; objects = databases) ──────────────────

const NOTION_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Notion-Version': '2022-06-28',
});

// biome-ignore lint/suspicious/noExplicitAny: Notion property values are polymorphic
function notionValue(prop: any): any {
  if (!prop) return null;
  switch (prop.type) {
    case 'title': return (prop.title ?? []).map((t: any) => t.plain_text).join('');
    case 'rich_text': return (prop.rich_text ?? []).map((t: any) => t.plain_text).join('');
    case 'number': return prop.number;
    case 'checkbox': return prop.checkbox;
    case 'select': return prop.select?.name ?? null;
    case 'multi_select': return (prop.multi_select ?? []).map((s: any) => s.name).join(', ');
    case 'date': return prop.date?.start ?? null;
    case 'email': return prop.email;
    case 'phone_number': return prop.phone_number;
    case 'url': return prop.url;
    case 'status': return prop.status?.name ?? null;
    case 'people': return (prop.people ?? []).map((p: any) => p.name ?? p.id).join(', ');
    // relation, formula, rollup, files, created_time…: kept as their JSON, not lost.
    default: return prop[prop.type] === undefined ? null : JSON.stringify(prop[prop.type]);
  }
}

const notion: SourceAdapter = {
  async listObjects(fetch, token) {
    const out: SourceObject[] = [];
    let cursor: string | undefined;
    do {
      const data = await postJson(fetch, 'https://api.notion.com/v1/search', NOTION_HEADERS(token), {
        filter: { property: 'object', value: 'database' },
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });
      // biome-ignore lint/suspicious/noExplicitAny: Notion API shapes
      for (const d of (data.results ?? []) as any[]) {
        out.push({ id: d.id, label: (d.title ?? []).map((t: any) => t.plain_text).join('') || d.id });
      }
      cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return out;
  },
  async fetchRows(fetch, token, object, limit) {
    // biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
    const rows: Array<Record<string, any>> = [];
    let cursor: string | undefined;
    while (rows.length < limit) {
      const data = await postJson(
        fetch,
        `https://api.notion.com/v1/databases/${encodeURIComponent(object)}/query`,
        NOTION_HEADERS(token),
        { page_size: Math.min(100, limit - rows.length), ...(cursor ? { start_cursor: cursor } : {}) },
      );
      for (const page of data.results ?? []) {
        // biome-ignore lint/suspicious/noExplicitAny: Notion API shapes
        const row: Record<string, any> = { notion_id: page.id };
        for (const [name, prop] of Object.entries(page.properties ?? {})) row[name] = notionValue(prop);
        rows.push(row);
      }
      cursor = data.next_cursor ?? undefined;
      if (!data.has_more) break;
    }
    const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    return { fields, rows };
  },
};

// ── Airtable (PAT; object = "baseId/tableIdOrName") ──────────────────

const airtable: SourceAdapter = {
  async listObjects(fetch, token) {
    const auth = { Authorization: `Bearer ${token}` };
    // biome-ignore lint/suspicious/noExplicitAny: Airtable API shapes
    const bases: any[] = [];
    let offset: string | undefined;
    do {
      const data = await getJson(
        fetch,
        `https://api.airtable.com/v0/meta/bases${offset ? `?offset=${encodeURIComponent(offset)}` : ''}`,
        auth,
      );
      bases.push(...(data.bases ?? []));
      offset = data.offset;
    } while (offset);
    const out: SourceObject[] = [];
    for (const base of bases) {
      // A base whose tables cannot be read fails the listing: a base left out silently reads as "not there".
      const tables = await getJson(fetch, `https://api.airtable.com/v0/meta/bases/${encodeURIComponent(base.id)}/tables`, auth);
      // biome-ignore lint/suspicious/noExplicitAny: Airtable API shapes
      for (const t of (tables.tables ?? []) as any[]) {
        out.push({ id: `${base.id}/${t.id}`, label: `${base.name} → ${t.name}` });
      }
    }
    return out;
  },
  async fetchRows(fetch, token, object, limit) {
    const [baseId, tableId] = object.split('/');
    if (!baseId || !tableId) throw new Error('Airtable object must be "baseId/tableId"');
    // biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
    const rows: Array<Record<string, any>> = [];
    let offset: string | undefined;
    while (rows.length < limit) {
      const url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}?pageSize=${Math.min(100, limit - rows.length)}${offset ? `&offset=${encodeURIComponent(offset)}` : ''}`;
      const data = await getJson(fetch, url, { Authorization: `Bearer ${token}` });
      for (const r of data.records ?? []) rows.push({ airtable_id: r.id, ...flat(r.fields ?? {}) });
      offset = data.offset;
      if (!offset || (data.records ?? []).length === 0) break;
    }
    const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    return { fields, rows };
  },
};

export const ADAPTERS: Record<string, SourceAdapter> = { hubspot, notion, airtable };
