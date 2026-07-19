/**
 * Source adapters — one small, uniform surface over each SaaS API:
 *
 *   listObjects(token)          → what can be imported (tables/bases/objects)
 *   fetchRows(token, object, n) → { fields, rows } normalized to flat records
 *
 * All requests go to FIXED vendor hosts (never user-supplied URLs), so there
 * is no SSRF surface. `fetch` comes from globalThis so tests can stub it.
 */

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
  listObjects(token: string): Promise<SourceObject[]>;
  fetchRows(token: string, object: string, limit: number): Promise<FetchResult>;
}

async function getJson(url: string, headers: Record<string, string>): Promise<any> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${new URL(url).host} responded ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`${new URL(url).host} responded ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

/** Flatten one level of nesting (`properties.email` → `email`) and drop objects. */
// biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
function flat(obj: Record<string, any>): Record<string, any> {
  // biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) out[k] = v;
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : x)).join(', ');
  }
  return out;
}

// ── HubSpot (private-app token) ──────────────────────────────────────

const hubspot: SourceAdapter = {
  async listObjects() {
    // The CRM v3 standard objects every portal has.
    return [
      { id: 'contacts', label: 'Contacts' },
      { id: 'companies', label: 'Companies' },
      { id: 'deals', label: 'Deals' },
      { id: 'tickets', label: 'Tickets' },
    ];
  },
  async fetchRows(token, object, limit) {
    const auth = { Authorization: `Bearer ${token}` };
    // biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
    const rows: Array<Record<string, any>> = [];
    let after: string | undefined;
    while (rows.length < limit) {
      const page = Math.min(100, limit - rows.length);
      const url = `https://api.hubapi.com/crm/v3/objects/${encodeURIComponent(object)}?limit=${page}${after ? `&after=${encodeURIComponent(after)}` : ''}`;
      const data = await getJson(url, auth);
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
    default: return null;
  }
}

const notion: SourceAdapter = {
  async listObjects(token) {
    const data = await postJson('https://api.notion.com/v1/search', NOTION_HEADERS(token), {
      filter: { property: 'object', value: 'database' },
      page_size: 50,
    });
    // biome-ignore lint/suspicious/noExplicitAny: Notion API shapes
    return (data.results ?? []).map((d: any) => ({
      id: d.id,
      label: (d.title ?? []).map((t: any) => t.plain_text).join('') || d.id,
    }));
  },
  async fetchRows(token, object, limit) {
    // biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
    const rows: Array<Record<string, any>> = [];
    let cursor: string | undefined;
    while (rows.length < limit) {
      const data = await postJson(
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
  async listObjects(token) {
    const data = await getJson('https://api.airtable.com/v0/meta/bases', { Authorization: `Bearer ${token}` });
    const out: SourceObject[] = [];
    // biome-ignore lint/suspicious/noExplicitAny: Airtable API shapes
    for (const base of (data.bases ?? []) as any[]) {
      const tables = await getJson(
        `https://api.airtable.com/v0/meta/bases/${encodeURIComponent(base.id)}/tables`,
        { Authorization: `Bearer ${token}` },
      ).catch(() => ({ tables: [] }));
      // biome-ignore lint/suspicious/noExplicitAny: Airtable API shapes
      for (const t of (tables.tables ?? []) as any[]) {
        out.push({ id: `${base.id}/${t.id}`, label: `${base.name} → ${t.name}` });
      }
    }
    return out;
  },
  async fetchRows(token, object, limit) {
    const [baseId, tableId] = object.split('/');
    if (!baseId || !tableId) throw new Error('Airtable object must be "baseId/tableId"');
    // biome-ignore lint/suspicious/noExplicitAny: source rows are untyped JSON
    const rows: Array<Record<string, any>> = [];
    let offset: string | undefined;
    while (rows.length < limit) {
      const url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}?pageSize=${Math.min(100, limit - rows.length)}${offset ? `&offset=${encodeURIComponent(offset)}` : ''}`;
      const data = await getJson(url, { Authorization: `Bearer ${token}` });
      for (const r of data.records ?? []) rows.push({ airtable_id: r.id, ...flat(r.fields ?? {}) });
      offset = data.offset;
      if (!offset || (data.records ?? []).length === 0) break;
    }
    const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    return { fields, rows };
  },
};

export const ADAPTERS: Record<string, SourceAdapter> = { hubspot, notion, airtable };
