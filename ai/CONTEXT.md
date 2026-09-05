# ai — context

**Status 2026-09-05: `reviewed` for `engine/`.** Every file under `engine/` read
end to end, every guard exercised, every write demonstrated on a two-tenant
database, all eight migrations applied to a virgin database. The Studio side
(`studio/schemas/ai.json`, `studio/src/`) is NOT covered — that belongs to a
Studio review. See "Section 3 of the review campaign" below for what that pass
found and fixed; everything under it is the earlier August pass, kept because it
records traps that are still live.

The August note below said "not `verified`" because section G needed a working
embedder. That is still true of the *quality* of answers. It is no longer true of
the code paths, which are what a review can settle.

---

# Section 3 of the review campaign — 2026-09-05

Nine defects. The shape that produced most of them is one shape: **this
extension has two of everything, and the repairs only ever landed on one copy.**
Two raw-SQL surfaces, two DDL paths, two embedding call sites, two auth gates.
Every time, the hardened one is the one someone was looking at when they found
the bug, and its twin kept the original defect — usually with a comment on the
fixed copy describing precisely the problem the other one still had.

## 1. The text-to-SQL allowlist could be walked around with a comma

`routes/ai-query.ts` builds an allowlist of the caller's own collections and
refuses any table outside it. The comment above it says what it is for:

> Better-Auth keeps `user`, `session`, `account`, `verification` and `twoFactor`,
> none of them with RLS. Any authenticated user with read on ONE collection could
> ask, in natural language, for session tokens or password hashes.

`tableReferences` collected identifiers with
`\b(?:from|join)\s+(IDENT)` — the FIRST identifier after each `FROM` or `JOIN`.
A comma-separated FROM list is a join, and the second item was never seen.
Measured, permitted set `{ zvd_products }`:

```
SELECT * FROM zvd_products p CROSS JOIN "user" u       refused
SELECT * FROM zvd_products WHERE id IN (SELECT id ...) refused
SELECT u.email FROM zvd_products p, "user" u           ALLOWED   refs=[zvd_products]
SELECT s.token FROM zvd_products p, session s          ALLOWED   refs=[zvd_products]
SELECT * FROM zvd_products, account, verification      ALLOWED   refs=[zvd_products]
```

Any authenticated user with read on one collection, through a sentence.

**Why nobody saw it.** The soundness argument in the doc comment was backwards,
and it is the kind of backwards that reads as correct:

> a reference it fails to recognise is simply not on the permitted list, so the
> query is refused rather than allowed.

True of a reference the function RETURNS. One it fails to recognise is not
returned, so it is never compared against anything — the loop iterates what came
back. Unrecognised meant unexamined, not refused.

**Fixed** by reading the FROM clause as the list it is: `splitTopLevel` splits on
top-level commas, `fromClauseBody` stops at the keyword that ends the clause,
each item contributes its leading identifier. And the recognition argument is now
true rather than only stated: `unresolvedTablePosition` reports a table position
the scanner cannot read, and `validateGeneratedSQL` refuses on it. The next form
nobody thought of costs a refused query instead of a silent hole.

`engine/lib/sql-guard.test.ts` covers it — 16 tests. Verified the way this
campaign requires: reverting `tableReferences` to its old form turns exactly the
five bypass tests red and leaves the other eleven green.

## 2. The assistant had the same tool with none of that

`execute_sql` and `text_to_sql` in `lib/zveltio-ai/engine.ts` ran model-written
SQL behind `startsWith('SELECT')` and `normalized.includes(kw)` over seven
keywords. No allowlist, no `pg_*` block, no `information_schema` block, no
multi-statement check. `SELECT token FROM session` passes all of it.

Admin-gated, so this is a bound rather than an open door — but the gate is
`checkPermission(userId, 'admin', '*')`, which a **tenant** administrator passes,
and `user`/`session`/`account` are instance-wide with no policy. A tenant admin
could read every other company's password hashes by asking for them in a chat
window.

`includes` is not word-bounded either, so a column named `updated_at` tripped the
UPDATE rule and refused a legitimate query. Wrong in both directions at once.

**Fixed:** both tools now call the same `validateGeneratedSQL`, moved into
`engine/lib/sql-guard.ts` so there is one implementation to get right. Extracting
it was also the only way to test it: `ai-query.ts` imports Hono, and importing
that from a test in this repository fails in module resolution before any
assertion runs — a decent explanation for why the most security-relevant
branching in this extension had no unit test at all.

`text_to_sql` had a third defect of its own: the schema it showed the model was
the first ten collections on the instance, unfiltered by what the caller may
read. The schema context IS the allowlist now — one derivation feeds both what
the model is told and what the validator permits, so they cannot drift.

And its system prompt told the model that collection `orders` becomes table
`zv_orders`. It is `zvd_orders`; `zv_` is the engine's namespace, where api keys
and sessions live. Every generated query named a table that does not exist, and
the one shape that would have hit a real table pointed at engine data.

## 3. The read-only window leaked into the whole request — twice

Both tools wrapped their query in:

```ts
await this.db.transaction().execute(async (trx) => {
  await sql`SET TRANSACTION READ ONLY`.execute(trx);
  return sql.raw(query).execute(trx);
});
```

`ctx.db.transaction()` JOINS the request's tenant transaction rather than
nesting — `extension-context.ts` returns `execute: (fn) => fn(target)`, no
`BEGIN`, same handle. So the flag applied from there to the end of the request.
Measured on Postgres 18 in exactly that shape:

```
the tool's own SELECT            -> ran
saveConversation, same request   -> cannot execute INSERT in a read-only transaction
anything after that              -> current transaction is aborted (25P02)
```

An admin who asked the assistant anything that made it reach for SQL got the
answer, and then the conversation was never saved, `remember_fact` could not
write, and the request's COMMIT quietly became a ROLLBACK.

**This is the third instance of this exact defect in this extension.** The doc
comment on `runReadOnly` in `ai-query.ts` describes it in full — it was written
when the same bug was fixed on the route in an earlier pass — and the two copies
in `engine.ts` were never touched. Both now use that same helper. The savepoint
form is measured both ways: a write inside the window is refused, a write after
it commits and survives the COMMIT.

## 4. `remember_fact` failed on every call, and blamed migrations

`AIProvider.embed()` returns `{ embedding: number[]; model: string }`. Both call
sites in `engine.ts` stored `JSON.stringify` of the **whole object** into a
`vector` column:

```
JSON.stringify(embedResult)   -> invalid input syntax for type vector:
                                 "{"embedding":[0.01,…],"model":"…"}"
JSON.stringify(.embedding)    -> accepted
```

`ai.ts` and `ai-embed-hook.ts` do it correctly (`vec.embedding`); the assistant's
two call sites do not. Fourth pair.

Then the `.catch` reported it as **"Memory service not available. Run migrations
first."** — sending the operator to look at migrations that are fine, for an
error that is a malformed literal. And the failing INSERT aborts the request's
transaction, so `saveConversation` went down with it.

The failure mode is worth keeping: with **Anthropic** as the default provider
there is no `embed`, the branch is skipped and the tool works. With **OpenAI or
Ollama** it fails every time. Whether the assistant could remember anything
depended on which provider was default.

## 5. `recall_facts` never worked, and tier 3 was unreachable

Three tiers: vector search, full-text, then plain importance ordering. Tier 2 was

```ts
.where((this.db as any).raw(`... plainto_tsquery('english', ?)`, [query]))
```

Kysely has had no `db.raw` since 0.23; this repository is on 0.29.5, where
`Kysely.prototype.raw` is `undefined`. And `.raw(...)` is called while BUILDING
the query, so the TypeError is thrown synchronously — past the `.catch` on the
promise, straight into the function's outer catch. Tier 3 was unreachable.
Measured through the real restricted handle:

```
tier 2: (this.db as any).raw(...)   -> TypeError: db.raw is not a function
tier 3: the plain fallback          -> ok, returns the rows
```

So `recall_facts` answered **"Memory service not available."** on every call ever
made — with or without an embedding provider, with or without memories stored —
while the system prompt instructs the model to "use recall_facts at the start of
conversations about preferences". The `?` placeholder was wrong too; Postgres
wants `$1`, so it could not have run even with a `raw` to call it on. Tier 1 had
the same EmbedResult defect as §4.

## 6. `create_collection` and `add_field` were refused by the table guard

Both wrote `ctx.db.insertInto('zv_ddl_jobs')`. That is an engine table and this
extension has no grant for it. Measured through the real restricted handle built
from the real allowlist:

```
insertInto('zv_ddl_jobs')      -> ExtensionSecurityError: Extension "ai"
                                  attempted to access table "zv_ddl_jobs"
selectFrom('zvd_collections')  -> ok       (control)
```

Two of the fourteen tools the system prompt advertises threw on every call.

Broken twice over: the engine moved DDL onto pg-boss, and `zv_ddl_jobs` is now
"preserved for historical queries" (`ddl-queue.ts:21`) with no consumer at all.
**Granting the table would have been the wrong repair** — it turns a refusal into
a row nothing reads, which is a create_collection that reports success and never
happens. Worse than the exception.

`ai-schema-gen.ts` enqueues the same two job types through
`internals.enqueueDDLJob`, on the host's own handle, and always did. Fifth pair.
Both tools now go through it. The payload is passed as an object, not a JSON
string: `enqueueDDLJob` serialises it itself, and a string produced a
double-encoded payload.

## 7. `recentActivity` was empty on every installation

`buildContext` read `zv_audit_log` — another engine table with no grant — under a
bare `catch {}`, which turned the refusal into `[]`. So the model's context
carried "no recent activity" as a fact, on every install, for a reason no log
recorded.

`toolGetSystemStats` had already reached the same conclusion about the same two
tables and says so out loud instead of reporting zero. This follows it. Restoring
the query needs `zv_audit_log` in `EXTENSION_TABLE_GRANTS`, which is a decision
about what an assistant may see, not a repair — so it is **not** made here.

## 8. One router's `use('*')` was the gate for five others

`buildAIRoutes` mounts every sub-router at `/`, and Hono's `route()` copies a
sub-app's middleware into the parent at the mount prefix. `ai-chats.ts` had
`app.use('*', requireAuth)`, which therefore registered at `/*` for the whole
extension. Measured with Hono 4.13.5 and the real mount order:

```
/providers                    200   ai.ts          registered BEFORE, not gated
/search                       200   ai.ts          registered BEFORE, not gated
/chats                        401   ai-chats
/generate-schema/field-types  401   ai-schema-gen  gated by ai-chats
/query/history                401   ai-query       gated by ai-chats
/analytics/summary            401   ai-analytics   gated by ai-chats
```

Whether a router was authenticated depended on its POSITION in `buildAIRoutes`.
No route relied on it — each of those declares its own auth — so the visible cost
was a second `auth.api.getSession()` on every request to five sub-routers. The
invisible cost is that reordering that list would have moved the gate silently.

This is the same mechanism that once made the entire extension admin-only; the
note in `ai-schema-gen.ts` records it, and that router was narrowed for exactly
this reason. This one was left on `'*'`. Sixth pair.

Now bound to its own six paths, and verified: all nine `ai-chats` routes still
gated, the siblings gated by their own middleware.

## 9. Smaller, with the reason each was worth changing

- **`/search`'s ILIKE fallback did `SELECT *`.** The other two branches of the
  same endpoint return `{ record_id, content, score }`. `checkPermission(user,
  collection, 'read')` is collection-level; the product also ships column-level
  permissions, which `/api/data` applies and this did not — so a role forbidden
  from seeing `salary` got it back by searching for a substring in it. Narrowed
  to the shared shape, which closes it without needing role plumbing here.
- **`logUsage`'s bare `SAVEPOINT`.** Legal only inside a transaction block; off a
  pool handle Postgres answers `SAVEPOINT can only be used in transaction blocks`
  (measured), the catch logs it and the INSERT never runs. There is nothing to
  protect there anyway — with no enclosing transaction a failed statement damages
  only itself. Now checks `isTransaction` first.
- **`chart_config` was written with a single `::jsonb`.** A no-op under Bun.SQL;
  the column held a JSON string scalar. Nothing reads it today (`/history`
  selects nine columns and that is not one), so this stored a malformed value
  nobody looked at — corrected rather than left, because the first reader would
  inherit the bug and would look for it in their own code.
- **Two references to "migration 009".** This extension has eight. The RLS the
  comments credit to 009 is in `001_initial.sql` (`zvd_ai_embeddings`) and
  `004_tenant_rls.sql` (everything else). Verified in the files.
- **A Romanian comment** in `ai-embed-hook.ts`, in a repository whose stated
  convention is English.
- **Silent catch on `collectionCount`.** That number goes into the system prompt
  as "The platform has N collections", so a swallowed failure tells the model
  there are none and the model tells the user so. Named now.

## Deliberately NOT changed

- **`ai.providers` is still a process-wide singleton keyed only by provider
  name**, while `zv_ai_providers` is tenant-scoped. Company B's
  `PUT /providers/openai` still replaces the object company A is using. Unchanged
  for the reason the August note gives: `getDefault()` is synchronous, has four
  consumers in other extensions plus the flow executor, and the host exposes no
  synchronous current-tenant. Needs `ctx.tenantId` first. **This is the largest
  thing still open in this extension.**
- **`endpoint-guard.ts` does not resolve DNS.** A hostname that resolves to
  169.254.169.254 passes. Closing it means an async lookup inside a zod
  `superRefine`, and the guard deliberately permits private ranges (Ollama), so
  the check has to be "resolves to a metadata address" rather than "resolves to a
  private one". Worth doing; not worth doing blind at the end of a review.
- **The alchemist session cache key is `alchemist:${id}`, not tenant-prefixed.**
  The id is 16 chars of CSPRNG (~95 bits), and the routes are admin-only, so this
  is exposure only if an id leaks. But the cache is instance-wide and holds up to
  5000 characters of every uploaded document. Flagged, not changed: whether the
  engine's cache namespaces by tenant is an engine question.
- **`/alchemist/execute` never compares its `session_id` against the cached
  proposal.** `collections` and `extracted_data` come from the request body, so
  the "user confirms the schema" step confirms nothing and `session_id` is used
  only to delete the cache entry. Admin-only, so it grants nothing they lack —
  but it is not the flow the endpoint documents.
- **The 13 remaining `::jsonb` sites** in other extensions. See
  `docs/private/CAMPAIGN-PROGRESS.md`; each needs its consumer read first, and
  that is those extensions' sections.

## Engine-side, handed to the session working there

- **`EXTENSION_TABLE_GRANTS` is inert for 13 of its 18 entries**, including
  `ai: ['zv_flows']`. A grant only ever suppresses a warning about a `CREATE
  TABLE` the extension already wrote; it is never added to the allowlist. Six
  extensions are 500ing on install because of it. Measured end to end with two
  positive controls and sent to `zveltio-9f`. `ai`'s own entry is inert and costs
  nothing — it only ALTERs `zv_flows`, in a migration, on a different handle.
- **The transaction-join shim's `setIsolationLevel` and `setAccessMode` are
  silent no-ops** (`extension-context.ts`). An extension calling
  `.setAccessMode('read only')` gets read-write and no error. Worth a throw.

## What was verified, and how

- **All eight migrations on a virgin database** (`zv_ai_s1`, engine schema via
  the migrate CLI, then each extension migration with the `-- DOWN` section cut).
  All eight apply.
- **Two-tenant write scoping**, as `zveltio_rls` (NOSUPERUSER, NOBYPASSRLS) with
  the tenant GUC set — not as superuser, which has BYPASSRLS implicitly and would
  have proved nothing:

  ```
  all 11 owned tables:  relrowsecurity=true  relforcerowsecurity=true  1 policy
  scoped to tenant A    READ: 1 of 2 conversations visible
  UPDATE tenant B    -> 0 rows
  DELETE tenant B    -> 0 rows
  INSERT into B      -> new row violates row-level security policy
  control, own tenant-> UPDATE 1, INSERT accepted, DELETE 1
  recall_facts sees  -> a-secret only (1 of 2 memories)
  ```

  The control is the half that makes the rest mean anything.
- **652 pass / 2 skip / 0 fail** on a database built from scratch, all three
  environment flags set. Eight repo gates green.
- **The bundle repacked and checked**: `check-bundle-sources` green, and the
  packed `engine/index.js` verified to carry the new guard, one `SET TRANSACTION
  READ ONLY` (the shared helper, not the two leaking copies) and zero references
  to `zv_ddl_jobs`.

---

Reviewed 2026-08-10/11. **Status then: not `verified`.** The three checks in section G
of `REVIEW-CHECKLIST.md` all need a working embedding provider (OpenAI key or a
local Ollama), which nobody has had here yet. What follows was verified against a
real Postgres 18 + pgvector, the extension's own migrations, and the packed
`engine/index.js` — not by pressing buttons in the UI.

## What was broken, and why nobody saw it

**The API key was never decrypted at boot.** `PUT /providers/:name` encrypts on
write and the same route hot-reloads the provider it just saved, decrypting as it
goes. `initAIProviders` — the *other* reader of that column, the one that runs on
every start — did not decrypt, so every provider was constructed with
`aes256gcm:<iv>:<ct>` as its bearer token.

This is the shape worth remembering: **configuring a key worked, and kept working
for the rest of the process lifetime.** Only the next restart broke it, and then it
broke everything at once with a 401 from the provider. No dev session that never
restarted could see it. Now covered by `engine/lib/ai-provider.test.ts`, which was
checked both ways — it fails against the old code.

**Conversation history returned the questions and not the answers.**
`saveConversation` writes the assistant's turn with no `user_id` (the column is
nullable *because* a model reply has no user). `GET /zveltio/conversations/:id`
filtered messages by `user_id`, so every answer was invisible; `DELETE` on the same
path deleted only the user's turns, orphaned every assistant row, and never touched
`zv_ai_conversations` — so "clear" reported success and the thread stayed listed.

The trap was already written down, in the doc comment on
`getConversationHistory` (`engine/lib/zveltio-ai/engine.ts`), by whoever fixed the
same bug on the internal path. Ownership belongs on the conversation row, which is
`NOT NULL`; messages are then filtered by `conversation_id` alone.

**A dead duplicate of prompt templates.** `ai.ts` had `/prompts`, `/prompts/:id/run`
and friends writing `system` + `template`; the table has `system_prompt` (NOT NULL)
+ `user_template`. Verified: `ERROR: column "system" of relation
"zv_prompt_templates" does not exist`. `ai-chats.ts` has the working surface
(`/templates`, `/templates/:id/run`, `/admin/templates`) — with admin gates the
duplicate lacked — and it is what the Studio page calls. The duplicate was deleted,
not repaired.

**Text-to-SQL recorded only the queries it refused.** `ctx.db.transaction()` JOINS
the request's tenant transaction instead of nesting, so `SET TRANSACTION READ ONLY`
applied to the whole request; the `logQuery` INSERT afterwards then failed with
`cannot execute INSERT in a read-only transaction`, and its `.catch(() => {})` ate
it. The one log call that *did* work sits on the validation-failure path, before
the flag is set. So `/query/history` was permanently empty and `PATCH /:id/save`
could never find a row.

The guard is still there — a regex allowlist must not be the only thing between a
model and a `DELETE` — but scoped to a SAVEPOINT, so the read-only window is the
untrusted statement and nothing else. Verified both directions in psql: an INSERT
inside the window is refused, an INSERT after it commits.

**`/query/:id/rerun` asked for a resource no policy has.** It checked
`data:<collection>`; the generate path two functions up, and migration 034, use the
bare collection name. Nothing matched, so for every non-`god` user re-running a
query they had just run answered `No access to table "zvd_…"`.

## Ownership and schema

- `zvd_collections.ai_search_enabled`, `.ai_search_field`,
  `.ai_embed_excluded_fields` are added by **this extension** to an **engine
  table**. So is dropping and re-adding `zv_flows_trigger_type_check` to admit
  `ai_task`. Both are the open extension-vs-engine question — deliberately left
  alone. Do not "clean this up" without that decision.
- `zvd_ai_search_config` is written by nobody and read by nobody. Confirmed by grep
  across both repos. It duplicates the three columns above and is dead either way.
- ~~`zv_prompt_templates` has **no `tenant_id`**~~ — **fixed since, in migrations
  007 and 008.** 007 added the column, the GUC default, the backfill and a
  `(tenant_id, name)` unique key; 008 added the policy 007 had delegated to a
  reconciler that could not act on a table with no policy of its own. Verified in
  the catalog on 2026-09-05: `relrowsecurity`, `relforcerowsecurity` and one
  policy on all eleven tables this extension owns. Do not re-report this.
- Migration **006** widened the two unique keys 005 missed:
  `zvd_ai_embeddings(tenant_id, collection, record_id, field)` and
  `zv_ai_memory(tenant_id, user_id, context_key)`. Both failure modes were
  reproduced live first. `ON CONFLICT` moves with the constraint — there are two,
  in `routes/ai.ts` and `lib/ai-embed-hook.ts`.

## Traps

- **`ai.providers` is a process-wide singleton, keyed only by provider name.** It
  is NOT tenant-scoped, while `zv_ai_providers` is (migration 004, whose header
  says the point is that a company's OpenAI key must not be shared). So company
  B's `PUT /providers/openai` replaces the object company A is using. **Not fixed
  here** — `getDefault()` is synchronous and has four consumers in other
  extensions plus the flow executor, and the host exposes no synchronous "current
  tenant" for an extension to key on. Needs an engine change first; see below.
- **Route order:** the admin gate in `ai-schema-gen.ts` is bound to its own three
  paths on purpose. It used to be `router.use('*', …)` and, because
  `buildAIRoutes` mounts every sub-router at `/`, it gated the *whole extension* —
  chat, templates and analytics all answered 403 to ordinary users. Do not widen
  it back.
- **`/providers` deliberately omits `api_key`.** The key does not leave the server,
  not even masked. The endpoint answers `has_api_key` and `loaded` instead. The old
  code masked a column it had not selected (always blank) and compared `loaded`
  against objects rather than names (always false).
- **The seven capabilities are approved separately by an instance admin.** A 401
  from an `/ext/ai/*` route with a valid token almost always means they are not
  approved. That is the design, not a bug.
- The contract test skips silently without `TEST_DATABASE_URL`, and the harness DB
  needs the **engine** schema present (it inserts into `"user"`). Use
  `zveltio_test`, built by `zveltio/scripts/setup-test-db.sh`; a bare database
  fails migration 001 with `relation "user" does not exist` and then every route
  500s in a way that looks like the extension's fault.

## Not broken — do not re-report

- **E1 does not apply.** The host bus uses `emitAsync` with a SAVEPOINT per
  listener, and `ctx.db` (H-12) resolves the request's tenant transaction, so the
  embedding listener is awaited inside the transaction that triggered it. Comments
  in `index.ts` and `ai-embed-hook.ts` claiming this runs on the global pool were
  stale and have been corrected in place.
- **Nothing is fabricated.** No `Math.random()` identifiers, no invented provider
  responses. A missing provider is a 503 on the routes and an explicit "configure
  one in AI Settings" from the agent.
- **`ai_decision` is implemented in the engine's flow executor** and consumes
  `ai.providers`; the no-op migration that mentions it is intentional.
- `ai.embed`, `ai.chat` and `ai.triggerEmbedding` have **zero consumers** anywhere.
  Only `ai.providers` (4) and `ai.runBackgroundTask` (1) are exercised.
  `ai.triggerEmbedding` could not have been called correctly before — it was
  registered as the raw internal function, whose first parameter is a database
  handle — and is now closed over `ctx.db`.

## Still open

- The tenant-scoping of the in-memory provider registry (above). Blocked on the
  host: an extension needs the current tenant id synchronously, which `ctx` does
  not offer. `getCurrentTenantTrx()` already exists engine-side, so a
  `ctx.tenantId` is small — but it is an engine change.
- `POST /ext/ai/generate-schema` returns generated seed rows and does **not**
  insert them (it cannot: step 3 only enqueues the DDL, so the tables do not exist
  yet). The response now says so via `seed_data_inserted: false`. Making `seed`
  actually write means waiting on the DDL queue — a separate feature.
- Section G, unpressed, for want of an embedder.

## Section G — partially pressed 2026-08-12

Pressed with a **fake, local OpenAI provider** (a deterministic stub, no model),
registered in `zv_ai_providers` with `base_url: http://127.0.0.1:11500/v1`. The
endpoint guard explicitly allows localhost — Ollama is private by design.

**What a stub proves:** that the extension forms the request correctly, stores
what it receives and handles the shape of the response. **What it does not
prove:** anything at all about the quality of the answers. Section G is about the
first thing.

**21 routes pass.** The extension is not marked "verified" — see below for what is
missing.

### What it turned up: an ENGINE bug, not an extension one

`GET /ext/ai/usage` returned **500 on every installation**. The `ctx.db` proxy
binds any function-valued property in order to preserve `this`;
`Function.prototype.bind` returns a new function **without the original's own
properties**. Kysely's `db.fn` is callable AND carries `count`/`sum`/`avg`/`max`
as own properties — so `ctx.db.fn.count` arrived `undefined`.

`eb.fn` from inside a `select(eb => …)` always worked: that builder comes from
Kysely and does not pass through the proxy. The same spelling, the opposite
result.

**The cause had been met and not recognised**: the comment in
`routes/zveltio-ai.ts` records `db.fn.max is not a function`, the rewrite of that
one query, and nothing more. Now repaired in the engine (a single change covers
all seven sites, including `compliance/ro/procurement`).

### What remains unpressed

- **Schema generation** (`POST /preview-schema`, `POST /generate-schema`) — they
  answer 422 "LLM did not return valid JSON", which is **correct**: the stub
  returns text. Pressing this honestly needs a stub that returns valid JSON
  schemas.
- **`POST /query`, `/alchemist/analyze`, `/admin/templates`** — 400/500 with the
  payloads used here; the real schemas have not been read yet. Do not report them
  as defects until they have been.

## SDUI migration (2026-08-21)
Templates+query history via schema. **Chat Tier-3** at `/admin/ai/chat` (2026-08-23)
uses `/ext/ai/chats` (non-streaming). Still deferred: NL→SQL UI, schema gen UI,
semantic search UI; token streaming needs engine work (see STUDIO-DEFERRED.md).
