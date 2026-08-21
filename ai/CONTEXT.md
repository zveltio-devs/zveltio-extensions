# ai — context

Reviewed 2026-08-10/11. **Status: not `verificat`.** The three checks in section G
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
- `zv_prompt_templates` has **no `tenant_id`** and is not in migration 004's RLS
  list, so prompt templates are instance-wide. That may be intended (they are
  seeded), but it means one company's templates are visible to all of them.
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

## Secțiunea G — presată parțial 2026-08-12

Presată cu un **furnizor OpenAI fals, local** (stub determinist, fără model),
înregistrat în `zv_ai_providers` cu `base_url: http://127.0.0.1:11500/v1`.
Garda de endpoint permite explicit localhost — Ollama e privat prin proiectare.

**Ce dovedește un stub:** că extensia formulează cererea corect, stochează ce
primește și tratează forma răspunsului. **Ce nu dovedește:** absolut nimic despre
calitatea răspunsurilor. Secțiunea G e despre primul lucru.

**21 de rute trec.** Nu marchez extensia „verificat" — vezi mai jos ce lipsește.

### Ce a scos: un bug de ENGINE, nu de extensie

`GET /ext/ai/usage` dădea **500 pe orice instalare**. Proxy-ul `ctx.db` leagă
orice proprietate-funcție ca să păstreze `this`; `Function.prototype.bind`
întoarce o funcție nouă **fără proprietățile originalului**. `db.fn` din Kysely e
apelabil ȘI poartă `count`/`sum`/`avg`/`max` ca proprietăți proprii — deci
`ctx.db.fn.count` sosea `undefined`.

`eb.fn` dintr-un `select(eb => …)` mergea mereu: acel builder vine de la Kysely
și nu trece prin proxy. Aceeași scriere, rezultat opus.

**Cauza fusese întâlnită și nerecunoscută**: comentariul din
`routes/zveltio-ai.ts` consemnează `db.fn.max is not a function`, rescrierea
acelei singure interogări, și atât. Reparat acum în engine (o singură schimbare
acoperă toate cele șapte locuri, inclusiv `compliance/ro/procurement`).

### Ce rămâne nepresat

- **Generarea de schemă** (`POST /preview-schema`, `POST /generate-schema`) —
  răspund 422 „LLM did not return valid JSON", ceea ce e **corect**: stub-ul meu
  întoarce text. Presarea onestă cere un stub care întoarce scheme JSON valide.
- **`POST /query`, `/alchemist/analyze`, `/admin/templates`** — 400/500 cu
  payload-urile mele; schemele reale n-au fost încă citite. Nu le raporta ca
  defecte până nu sunt.

## SDUI migration (2026-08-21)
Branch: feat/sdui-tier3-reduced
Templates+query history; chat/query/schema/search deferred.
