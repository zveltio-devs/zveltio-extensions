import { ActionRefusal, type ExtensionAction, isReservedPath } from '@zveltio/sdk/extension';
import { sanitizeBlocksForWrite } from './sanitize.js';

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

async function one(host: Host, collection: string, id: string, what: string): Promise<Row> {
  const row = await host.collections.read(collection, id);
  if (!row) throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}

async function first(host: Host, collection: string, filter: Row): Promise<Row | null> {
  const page = await host.collections.list(collection, { filter, limit: 1, sort: 'id', count: 'none' });
  return ((page.records as Row[]) ?? [])[0] ?? null;
}

/**
 * Publish a page: what the public reads is `page_publications`, a snapshot
 * made here, never the draft in `pages`. The blocks are sanitized on the way
 * in, because they reach `{@html}`. Each publish also keeps a revision, which
 * `restoreRevision` puts back into the draft.
 */
const publish: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const page = await one(host, 'pages', id, 'page');
  const slug = String(page.slug);
  if (!/^[a-z0-9/-]+$/.test(slug) || isReservedPath(slug)) {
    throw new ActionRefusal(
      400,
      'reserved_slug',
      'The slug must be lowercase letters, digits, "-" and "/", and not start with a path the engine reserves (api, ext, admin, app, auth, …).',
    );
  }
  const parent = page.parent_id ? await host.collections.read('pages', String(page.parent_id)) : null;

  const content = {
    blocks: sanitizeBlocksForWrite(Array.isArray(page.blocks) ? page.blocks : []),
    meta: page.meta ?? {},
    layout: page.layout,
    description: page.description ?? null,
    locale: page.locale,
    popup_config: page.popup_config ?? {},
    record_collection: page.record_collection ?? null,
    record_field: page.record_field ?? null,
    record_filter: page.record_filter ?? [],
    meta_title: page.meta_title ?? null,
    meta_description: page.meta_description ?? null,
    og_image: page.og_image ?? null,
  };
  const snapshot = {
    site_id: page.site_id,
    slug,
    kind: page.kind,
    title: page.title,
    icon: page.icon ?? null,
    parent_slug: parent?.slug ?? null,
    is_homepage: page.is_homepage,
    is_noindex: page.is_noindex,
    include_in_sitemap: page.include_in_sitemap,
    change_freq: page.change_freq,
    priority: page.priority,
    sort_order: page.sort_order,
    content,
    published_at: new Date().toISOString(),
  };

  const existing = await first(host, 'page_publications', { page_id: id });
  const publication = existing
    ? await host.collections.update('page_publications', String(existing.id), snapshot)
    : await host.collections.insert('page_publications', { page_id: id, ...snapshot });
  await host.collections.insert('page_revisions', { page_id: id, content });
  return publication;
};

/** Put a revision's content back into its page's draft. Publishing is a separate step. */
const restoreRevision: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const revision = await one(host, 'page_revisions', id, 'revision');
  const c = (revision.content ?? {}) as Row;
  return host.collections.update('pages', String(revision.page_id), {
    blocks: Array.isArray(c.blocks) ? c.blocks : [],
    meta: c.meta ?? {},
    ...(c.layout ? { layout: c.layout } : {}),
    description: c.description ?? null,
    popup_config: c.popup_config ?? {},
    meta_title: c.meta_title ?? null,
    meta_description: c.meta_description ?? null,
    og_image: c.og_image ?? null,
  });
};

export const pagesActions: Record<string, ExtensionAction> = { publish, restoreRevision };
