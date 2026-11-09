# Changelog

## 2.0.1 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.0.0 (2026-11-07)

Rebuilt on the engine's extension model (phase D): no own tables, no own SQL,
no authorization of its own.

- **Breaking.** Connections, fetches and import runs are the declared
  collections `migrator_connections`, `migrator_fetches` and `migrator_runs`,
  served by the data API under the engine's rules (no default grants). The 1.x
  tables `zv_migrator_connections` and `zv_migrator_runs` are left as they are
  and no longer read: save each connection again.
- **Breaking.** The source token is a `secret` field: the engine seals it and
  the data API never serves it. The routes `/connections`, `/preview`, `/run`
  and `/runs` are gone.
- **Breaking.** Reading a source is two actions that queue jobs in the engine's
  Deno runner: `discover` (what the source can export, written onto the
  connection) and `fetch` (up to 1,000 rows of one object, with the fields
  inferred from them, into a `migrator_fetches` row to review). An
  administrator approves the egress capabilities `egress:api.hubapi.com`,
  `egress:api.notion.com` and `egress:api.airtable.com`.
- **Breaking.** `POST /ext/integrations/migrators/fetches/:id/import`
  `{ target_collection, mapping? }` writes a ready fetch into a collection, every
  row through the data API as the caller, all or nothing, and records the run.
  Without `mapping` each source field goes to the field inferred for it; a
  field the target lacks now refuses the import instead of being skipped
  silently, so map or leave out the fields you do not want. A fetch imports
  once (a second request answers 409). The importer needs `create` on the
  target, `read` on `migrator_fetches` and `migrator_runs`, and `create` on
  `migrator_runs`; the collections have no default grants.
- HubSpot rows carry every property of the object, custom ones included (1.x
  read only HubSpot's defaults). A Notion or Airtable value the adapters do not
  flatten (relation, formula, rollup, files…) is kept as JSON text instead of
  being dropped. Listing reads every page of Notion databases and Airtable
  bases (1.x stopped at the first), and a base whose tables cannot be read
  fails the listing instead of vanishing from it.
- A rate limit, a server error or a lost connection is retried by the job
  queue; a fetch whose run died is picked up again by the retry.

## 1.0.7 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.6 (2026-10-07)

- fix(migrators): target columns come from ctx.DDLManager.introspectTable (1.0.6) (#185)

## 1.0.5 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.4 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.3 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.2 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.1 (2026-08-25)

- feat(sdui): Studio pages for auth/scim and integrations/migrators
- refactor(extensions): delegate crypto to the host keyring
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(migrators, validation): rulările în lot și `catch`-urile care mint

## 1.0.0 (2026-07-19)

- feat(integrations/migrators): HubSpot / Notion / Airtable → Zveltio importers
