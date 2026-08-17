/**
 * Root-level public SEO endpoints — registered via `ctx.registerPublicRoute`
 * so crawlers find them where they expect them (`/sitemap.xml`, `/robots.txt`)
 * instead of under the extension's /ext/... prefix.
 */

import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

// biome-ignore lint/suspicious/noExplicitAny: Hono context via PublicRouteSpec
type Ctx = any;

function baseUrl(c: Ctx): string {
  const proto = c.req.header('x-forwarded-proto') || 'https';
  const host = c.req.header('host') || 'example.com';
  return `${proto}://${host}`;
}

export function registerPublicSeoRoutes(ctx: ExtensionContext): void {
  const { db } = ctx;

  ctx.registerPublicRoute({
    method: 'GET',
    path: '/sitemap.xml',
    handler: async (c: Ctx) => {
      const result = await sql<{
        slug: string;
        updated_at: string;
        change_freq: string | null;
        priority: number | null;
        record_collection: string | null;
        record_field: string | null;
        public_collections: string[] | null;
      }>`
        SELECT p.slug, p.updated_at, sc.change_freq, sc.priority,
               p.record_collection, p.record_field, s.public_collections
        FROM zv_pages p
        JOIN zv_page_sites s ON s.id = p.site_id
        LEFT JOIN zv_page_sitemap_config sc ON sc.page_id = p.id
        WHERE p.status = 'published'
          AND COALESCE(p.is_noindex, false) = false
          -- A sitemap is a list of URLs for anyone to fetch. Pages behind a role
          -- or on a non-public site do not belong in one: publishing their slugs
          -- hands an anonymous crawler the shape of a private portal, and the
          -- pages themselves 401 when it follows them.
          AND COALESCE(p.auth_required, false) = false
          -- A popup has a slug but no address. Listing it would send crawlers
          -- to a page that is only ever drawn over another one.
          AND COALESCE(p.kind, 'page') = 'page'
          AND s.is_public = true
          AND s.is_active = true
          AND (sc.include_in_sitemap = true OR sc.page_id IS NULL)
      `
        // Not caught. An empty sitemap and a failed sitemap look identical to a
        // crawler, and the first one tells it to forget every URL it knows.
        // Better a 500 the operator sees than a silent de-indexing.
        .execute(db);

      const base = baseUrl(c);

      /**
       * A record page has one address per record, and a sitemap listing only
       * `/products` while every product lives at `/products/<slug>` tells a
       * crawler the catalogue does not exist.
       *
       * Two rules keep this honest. The collection must be one the site
       * PUBLISHES anonymously — the same gate a data block passes, because a
       * sitemap is read by anyone and a slug is data. And the count is capped:
       * a sitemap is a hint, not a dump, and an unbounded query here would let
       * one large collection decide how long an anonymous request takes.
       */
      const RECORD_CAP = 500;
      async function addressesFor(row: (typeof result.rows)[number]): Promise<string[]> {
        if (!row.record_collection) return [row.slug === 'home' ? '' : row.slug];
        const published = row.public_collections ?? [];
        if (!published.includes(row.record_collection)) return [];

        const field = row.record_field || 'slug';
        // The collection name came from the published list, and the column from
        // the page — both are checked against the catalog before they reach a
        // query, exactly as `resolveRecord` checks them.
        const cols = await sql<{ column_name: string }>`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${`zvd_${row.record_collection}`}
        `.execute(db);
        const names = new Set(cols.rows.map((r) => r.column_name));
        if (!names.has(field)) return [];

        const keys = await sql<{ k: string }>`
          SELECT ${sql.id(field)}::text AS k
          FROM ${sql.id(`zvd_${row.record_collection}`)}
          WHERE ${sql.id(field)} IS NOT NULL
          LIMIT ${RECORD_CAP}
        `.execute(db);
        return keys.rows.map((r) => `${row.slug}/${r.k}`);
      }

      const urls = (
        await Promise.all(
          result.rows.map(async (p) => {
            const paths = await addressesFor(p);
            const lastmod = new Date(p.updated_at).toISOString().split('T')[0];
            return paths
              .map(
                (path) => `
  <url>
    <loc>${base}/${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.change_freq || 'weekly'}</changefreq>
    <priority>${p.priority ?? 0.5}</priority>
  </url>`,
              )
              .join('');
          }),
        )
      ).join('');

      c.header('Content-Type', 'application/xml');
      return c.body(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`);
    },
  });

  ctx.registerPublicRoute({
    method: 'GET',
    path: '/robots.txt',
    handler: (c: Ctx) => {
      c.header('Content-Type', 'text/plain');
      return c.body(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /ext/

Sitemap: ${baseUrl(c)}/sitemap.xml
`);
    },
  });
}
