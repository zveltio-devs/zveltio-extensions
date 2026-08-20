import type { Database } from '@zveltio/engine-db';
import { MeiliSearchClient } from './providers/meilisearch.js';
import { TypesenseClient } from './providers/typesense.js';

let _db: Database | null = null;

/**
 * Where the search engine lives, as the deployment configured it.
 *
 * These used to be `process.env.MEILISEARCH_URL` and friends, read straight from
 * inside the extension — which in-process means the ENGINE's whole environment,
 * `DATABASE_URL` and `BETTER_AUTH_SECRET` included. They now arrive through
 * `ctx.config.vars`, the host's slice of the environment that belongs to this
 * extension: everything set as `ZVELTIO_EXT_SEARCH_<KEY>`, and nothing else.
 *
 *   ZVELTIO_EXT_SEARCH_MEILISEARCH_URL        default http://localhost:7700
 *   ZVELTIO_EXT_SEARCH_MEILISEARCH_API_KEY    default none
 *   ZVELTIO_EXT_SEARCH_TYPESENSE_HOST         default http://localhost
 *   ZVELTIO_EXT_SEARCH_TYPESENSE_PORT         default 8108
 *   ZVELTIO_EXT_SEARCH_TYPESENSE_API_KEY      default none
 */
let _vars: Readonly<Record<string, string>> = {};

function getMeiliClient(): MeiliSearchClient {
  return new MeiliSearchClient(
    _vars.MEILISEARCH_URL ?? 'http://localhost:7700',
    _vars.MEILISEARCH_API_KEY ?? '',
  );
}

function getTypesenseClient(): TypesenseClient {
  // `Number.parseInt` on an absent value is NaN, and a NaN port fails at connect
  // time with a message about the port rather than about the setting. Fall back
  // to the default when the value is not a usable port.
  const port = Number.parseInt(_vars.TYPESENSE_PORT ?? '', 10);
  return new TypesenseClient(
    _vars.TYPESENSE_HOST ?? 'http://localhost',
    Number.isFinite(port) && port > 0 ? port : 8108,
    _vars.TYPESENSE_API_KEY ?? '',
  );
}

export const SearchManager = {
  init(db: Database, vars?: Readonly<Record<string, string>>): void {
    _db = db;
    // Optional so the sync worker, which has no ctx, can still initialise the
    // handle. Whichever call passes vars wins; an absent one leaves the defaults,
    // which is a working local Meilisearch.
    if (vars) _vars = vars;
  },

  async search(
    collection: string,
    query: string,
    opts?: { limit?: number; filters?: string },
  ): Promise<any> {
    if (!_db) throw new Error('SearchManager not initialized');

    const indexConfig = await (_db as any)
      .selectFrom('zv_search_indexes')
      .selectAll()
      .where('collection', '=', collection)
      .where('status', '=', 'active')
      .executeTakeFirst();

    if (!indexConfig) {
      // Typed, so the route can answer 4xx. "No index configured" is a thing
      // the caller can fix — configure one — and answering 500 told them the
      // server had broken instead, which sends the search for the cause to the
      // wrong side entirely.
      throw Object.assign(
        new Error(`No search index configured for collection "${collection}"`),
        { code: 'NO_INDEX' },
      );
    }

    if (indexConfig.provider === 'meilisearch') {
      const client = getMeiliClient();
      return client.search(indexConfig.index_name, query, {
        limit: opts?.limit ?? 20,
        filter: opts?.filters,
      });
    } else {
      const client = getTypesenseClient();
      const queryBy = indexConfig.searchable_fields?.join(',') || 'id';
      return client.search(indexConfig.index_name, query, {
        query_by: queryBy,
        per_page: opts?.limit ?? 20,
        filter_by: opts?.filters,
      });
    }
  },

  async index(collection: string, record: Record<string, unknown>): Promise<void> {
    if (!_db) return;

    const indexConfig = await (_db as any)
      .selectFrom('zv_search_indexes')
      .selectAll()
      .where('collection', '=', collection)
      .where('status', '=', 'active')
      .executeTakeFirst();

    if (!indexConfig) return;

    if (indexConfig.provider === 'meilisearch') {
      const client = getMeiliClient();
      await client.addDocuments(indexConfig.index_name, [record]);
    } else {
      const client = getTypesenseClient();
      await client.upsertDocument(indexConfig.index_name, record);
    }
  },

  async remove(collection: string, id: string): Promise<void> {
    if (!_db) return;

    const indexConfig = await (_db as any)
      .selectFrom('zv_search_indexes')
      .selectAll()
      .where('collection', '=', collection)
      .where('status', '=', 'active')
      .executeTakeFirst();

    if (!indexConfig) return;

    if (indexConfig.provider === 'meilisearch') {
      const client = getMeiliClient();
      await client.deleteDocument(indexConfig.index_name, id);
    } else {
      const client = getTypesenseClient();
      await client.deleteDocument(indexConfig.index_name, id);
    }
  },

  async sync(collection: string): Promise<{ indexed: number }> {
    if (!_db) throw new Error('SearchManager not initialized');
    const db = _db;

    const indexConfig = await (db as any)
      .selectFrom('zv_search_indexes')
      .selectAll()
      .where('collection', '=', collection)
      .executeTakeFirst();

    if (!indexConfig) throw new Error(`No search index configured for collection "${collection}"`);

    // Read all records in batches of 100
    let offset = 0;
    let total = 0;
    const BATCH = 100;

    while (true) {
      let records: any[];
      try {
        records = await (db as any)
          .selectFrom(collection)
          .selectAll()
          .limit(BATCH)
          .offset(offset)
          .execute();
      } catch {
        // Table might not exist
        break;
      }

      if (records.length === 0) break;

      if (indexConfig.provider === 'meilisearch') {
        const client = getMeiliClient();
        await client.addDocuments(indexConfig.index_name, records);
      } else {
        const client = getTypesenseClient();
        for (const record of records) {
          await client.upsertDocument(indexConfig.index_name, record);
        }
      }

      total += records.length;
      offset += BATCH;
      if (records.length < BATCH) break;
    }

    // Update last_synced_at and record_count
    await (db as any)
      .updateTable('zv_search_indexes')
      .set({ last_synced_at: new Date(), record_count: total })
      .where('collection', '=', collection)
      .execute();

    return { indexed: total };
  },
};
