import { describe, expect, test } from 'bun:test';
import { loadMenus, loadPage, loadSite } from './load.js';
import { filterJson, listUrl } from './query.js';

/** A data API double: `collection -> rows`, filtered by equality (a scalar, or an `eq` operator). */
function api(data: Record<string, Record<string, unknown>[]>, status = 200): typeof fetch {
  return (async (input: string) => {
    const url = new URL(input, 'http://x');
    const collection = url.pathname.split('/').pop() as string;
    const filter = JSON.parse(url.searchParams.get('filter') ?? '{}');
    const records = (data[collection] ?? []).filter((r) =>
      Object.entries(filter).every(([k, v]) =>
        v && typeof v === 'object' ? !('eq' in v) || r[k] === (v as { eq: unknown }).eq : r[k] === v,
      ),
    );
    return new Response(JSON.stringify(status === 200 ? { records } : { error: 'Forbidden' }), { status });
  }) as unknown as typeof fetch;
}

const site = { id: 's1', name: 'Shop', site_name: 'The Shop', slug: 'shop', is_active: true };
const pub = (over: Record<string, unknown>) => ({
  id: 'p', page_id: 'pg', site_id: 's1', kind: 'page', slug: 'about', title: 'About', is_homepage: false,
  content: { blocks: [{ type: 'text' }] }, ...over,
});

describe('listUrl', () => {
  test('a block becomes one data API read', () => {
    const url = listUrl({ collection: 'products', limit: 500, sort_field: 'name', sort_dir: 'asc',
      filters: [{ field: 'price', op: 'gt', value: 5 }, { field: 'sku', op: 'not_null' }] }, 2);
    const q = new URL(url as string, 'http://x').searchParams;
    expect(q.get('limit')).toBe('100');
    expect(q.get('page')).toBe('2');
    expect(q.get('order')).toBe('asc');
    expect(JSON.parse(q.get('filter') as string)).toEqual({ price: { gt: 5 }, sku: { not_null: true } });
  });

  test('a name that is not a collection or field name asks nothing', () => {
    expect(listUrl({ collection: '../users' })).toBeNull();
    expect(filterJson([{ field: 'a b', op: 'eq', value: 1 }])).toBeNull();
  });
});

describe('loadPage', () => {
  test('the homepage is the flagged publication, with site branding and its popups', async () => {
    const f = api({
      page_publications: [
        pub({ is_homepage: true, slug: 'start' }),
        pub({ id: 'x', kind: 'popup', slug: 'promo', content: { popup_config: { targets: ['other'] }, blocks: [] } }),
        pub({ id: 'y', kind: 'popup', slug: 'hello', content: { popup_config: {}, blocks: [] } }),
      ],
      page_sites: [site],
    });
    const out = await loadPage(f, '');
    expect(out?.page.slug).toBe('start');
    expect(out?.site?.name).toBe('The Shop');
    expect(out?.popups.map((p) => p.id)).toEqual(['y']);
  });

  test('a record page needs its record, and a plain page refuses a key', async () => {
    const f = api({
      page_publications: [pub({ slug: 'product', content: { record_collection: 'products', record_field: 'sku', blocks: [] } }), pub({})],
      page_sites: [site],
      products: [{ sku: 'A1', name: 'Anvil' }],
    });
    expect((await loadPage(f, 'product', { recordKey: 'A1' }))?.record?.name).toBe('Anvil');
    expect(await loadPage(f, 'product', { recordKey: 'B2' })).toBeNull();
    expect(await loadPage(f, 'product')).toBeNull();
    expect(await loadPage(f, 'about', { recordKey: 'A1' })).toBeNull();
  });

  test('what the visitor may not read is not found', async () => {
    expect(await loadPage(api({ page_publications: [pub({})] }, 403), 'about')).toBeNull();
    expect(await loadPage(api({ page_publications: [pub({})], page_sites: [] }), 'about', { site: 'shop' })).toBeNull();
  });
});

test('loadMenus reads main and footer, empty when unreadable', async () => {
  const f = api({ page_menus: [{ menu_key: 'main', items: [{ label: 'Home', href: '/' }] }] });
  expect(await loadMenus(f)).toEqual({ main: [{ label: 'Home', href: '/' }], footer: [] });
  expect(await loadMenus(api({}, 403))).toEqual({ main: [], footer: [] });
});

test('loadSite nests published pages under their parent, and is null for an unreadable site', async () => {
  const f = api({
    page_sites: [site],
    page_publications: [
      pub({ page_id: 'a', slug: 'docs', title: 'Docs', sort_order: 0 }),
      pub({ page_id: 'b', slug: 'docs/start', title: 'Start', parent_slug: 'docs', sort_order: 1 }),
      pub({ page_id: 'c', slug: 'promo', kind: 'popup' }),
    ],
  });
  const out = await loadSite(f, 'shop');
  expect(out?.site.id).toBe('s1');
  expect(out?.nav.map((n) => [n.slug, n.children.map((c) => c.slug)])).toEqual([['docs', ['docs/start']]]);
  expect(await loadSite(api({ page_sites: [] }), 'shop')).toBeNull();
});

test("a record page's key joins the author's filter on the same field, and a site switched off is not drawn", async () => {
  const seen: string[] = [];
  const base = api({
    page_publications: [pub({ slug: 'p', content: { record_collection: 'products', record_field: 'sku',
      record_filter: [{ field: 'sku', op: 'neq', value: 'HIDDEN' }], blocks: [] } })],
    page_sites: [site],
    products: [{ sku: 'A1' }],
  });
  const f = (async (u: string, i?: RequestInit) => (seen.push(u), base(u, i))) as typeof fetch;
  await loadPage(f, 'p', { recordKey: 'A1' });
  const products = new URL(seen.find((u) => u.includes('/products')) as string, 'http://x');
  expect(JSON.parse(products.searchParams.get('filter') as string)).toEqual({ sku: { neq: 'HIDDEN', eq: 'A1' } });
  expect(await loadPage(api({ page_publications: [pub({})], page_sites: [{ ...site, is_active: false }] }), 'about')).toBeNull();
});
