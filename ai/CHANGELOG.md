# Changelog

## 1.0.27 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.26 (2026-10-22)

- fix(ai,mail,validation): a firm with no AI provider answers 503 again (#254)

## 1.0.25 (2026-10-22)

- fix(ai): a provider change reaches every replica (#252)

## 1.0.24 (2026-10-21)

- fix(ai): each firm's AI calls use its own providers (#251)

## 1.0.23 (2026-10-21)

- fix(extensions): scope natural-key lookups and writes to the own tenant (#250)

## 1.0.22 (2026-10-18)

- fix(export,ai): stop assuming every collection has a status column (#226)

## 1.0.21 (2026-10-11)

- fix: nine update handlers bind their jsonb column with toJsonb (#208)

## 1.0.20 (2026-10-07)

- fix(ai): run on what ctx.db allows — savepoints, collection reads, user names (1.0.20) (#192)

## 1.0.19 (2026-09-28)

- fix(ai): background tasks wait on the model with no transaction open (1.0.19) (#154)

## 1.0.18 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.17 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.16 (2026-09-15)

- refactor(ai): the document indexer arrives, and is published as a service (#128)

## 1.0.15 (2026-09-14)

- fix: no bundle may carry the packing machine's filesystem layout (#120)
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.14 (2026-09-06)

- fix(ai): logUsage writes once, not once per branch — engine CI was red on master

## 1.0.13 (2026-09-05)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- chore(ai): 1.0.13 — repack the bundle so the fixes reach an install

## 1.0.12 (2026-09-03)

- chore(bundles): repachetate cele trei extensii atinse — sursa nu ajungea nicăieri
- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.11 (2026-09-02)

- fix(ai): a doua tabelă în aceeași stare — `zv_prompt_templates` n-avea politică

## 1.0.10 (2026-09-01)

- fix(ai): migrația declarată în getMigrations() și bundle-ul repachetat
- fix(securitate): șase extensii de nivel UNU au rămas cu hono vulnerabil

## 1.0.9 (2026-08-30)

- fix(ai): șabloanele de prompt aparțin unei firme, ca restul tabelelor extensiei

## 1.0.8 (2026-08-25)

- feat(sdui): reduced Tier-3 for forms, byod, media, ai, mail
- feat(studio): Model 2.5 slots for AI + invoicing; CRM SDUI cleanup
- feat: hero/suggestions slots, validation i18n, CRM widget a11y
- feat(ai): Tier-3 chat workspace on /admin/ai/chat
- fix(crm, ai): organizația principală și furnizorul implicit

## 1.0.7 (2026-08-19)

- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.6 (2026-08-19)

- fix(ai,harness): the contract suite ran every extension with more power than it has

## 1.0.5 (2026-08-18)

- fix(ai,search,billing,sms): stop reading the engine's environment

## 1.0.4 (2026-08-18)

- chore(extensions): repack eleven bundles so they record their sources
- fix(uploads): the "no file provided" 400 was unreachable on every upload route

## 1.0.3 (2026-08-14)

- fix(extensions): six criticals — AI SQL, accounting reports, three dead write paths

## 1.0.2 (2026-08-11)

- fix(extensions): adopt the engine's table, bound the embedding call, cap query width
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(ai): two unique keys the second company could not get past
- fix(ai): the stored API key was never decrypted at boot
- chore(ai): 1.0.2, and a CONTEXT.md for whoever opens this next

## 1.0.1 (2026-08-06)

- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: pack the 5 Phase 1 pilot extensions
- fix: bundle hash de-sync — gitattributes + re-pack 5 pilots
- fix(ai): add zveltioMaxVersion 4.0.0 + align min to 1.0.0
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(repo): align kysely to 0.29 + fix ai cache import path (typecheck green)
- feat(manifests): declare the capabilities each extension actually uses
- fix(extensions): repack — the shipped bundles did not match their source
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(ai): a conversation id from the request body was never checked
- fix(ai,mail,traceability): tenant isolation, a guard that covered everything, and two raw-SQL paths
- chore: bump every extension changed this round so the fixes can reach an install

## 1.0.0 (2026-05-09)

- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
