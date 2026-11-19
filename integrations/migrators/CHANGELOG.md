# Changelog

## 3.0.0 (2026-11-14)

- feat!: the import route is an action (ADR 0039, ADR 0047): `POST /fetches/:id/import` `{ target_collection, mapping? }` is `POST /ext/integrations/migrators/actions/importFetch` `{ fetch_id, target_collection, mapping? }`. It needs `execute` on `migrator_runs`, granted to `tenant_member` at install, and answers `{ result: { run, imported_rows, skipped_fields } }` with 200 (was the same object, unwrapped, with 201). It lists `"*"` in `writes`, because the target is the collection the caller names: it reaches it only as the caller, under their grants, row rules and column rules, as the route did through `ctx.internals.createRecord`; install consent shows it as `collections:any:write`, and an engine from 3.0.0-beta.121 is required
- feat!: refusals are the engine's problem answers with a `code`, not `{ error }`: an unknown fetch 404 `fetch_not_found` (was the data API's 404 body), a fetch not ready 409 `fetch_not_ready`, an imported fetch 409 `already_imported`, a mapping naming a field the fetch lacks 400 `unknown_source_field`, a mapping naming a target field twice 400 `duplicate_target_field`. A bad `target_collection`, a `mapping` that is not an object of strings, a missing `fetch_id` or an unknown key are refused by the input schema with 400 (the route ignored unknown keys)
- feat!: the import still keeps every row or none (the action is the request's transaction; a throw rolls back every row it wrote), but stops at the first row the data API refuses and answers with that refusal's status, `code` and `errors` (422, 403, ...). The route went on checking after a 422 and answered `{ error, errors: [{ row, status, error }] }` with up to 100 rows: a database-raised 422 aborts the transaction, so the rows after it cannot be checked in it
- feat!: no Hono route and no `ctx.internals` left; the bundle carries neither hono nor zod
- feat: the page is a `view/2` of three tabs (connections, fetches, runs): connections are created and deleted through the data API's own form, discover and fetch run per connection, and import runs per ready fetch (the target collection prompted). It called the import route by address; the fetch form on the fetches tab is gone (fetch runs from its connection)

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
