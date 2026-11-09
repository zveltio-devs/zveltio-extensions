# Changelog

## 2.0.1 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.0.0 (2026-11-04)

- feat!: a scan reads the collection through the data API as the scanning user (`ctx.internals.listRecords`): only the rows and columns the caller may read are scanned, and a column hidden from them is never quoted in an issue. 1.x read the table with SQL in a tenant transaction, past the caller's row policies and column rules. Up to 10,000 rows per scan; a scan of a larger collection says `truncated: true`
- feat!: a scan runs in the request and answers 201 with the scan row (1.x answered 202 and ran in the background); a refused read answers the data API's status and records nothing. Scans, issues and SLA targets are the declared collections `quality_scans`, `quality_issues` and `quality_targets` (not `quality_sla_targets`: the 1.x table `zvd_quality_sla_targets` holds that name), created and owned by the engine and served by the data API; no SQL migrations. The 1.x tables `zvd_quality_rules`, `zvd_quality_scores`, `zvd_quality_sla_targets` and `zvd_quality_remediations` are no longer read or written, their rows are not carried over, and the tables are left in place; the engine's `zv_quality_scans` and `zv_quality_issues` are dropped by engine migration 109
- feat!: no authorization in the extension: the `admin` checks on summary, stats, rules and SLA targets are gone. Who may scan is who may read the target collection and create in `quality_scans` and `quality_issues`; who may dismiss is who may update `quality_issues`
- feat!: duplicates are values equal after trimming and case folding on fields whose values are at least 90% distinct (1.x: pg_trgm similarity above 0.9 on the first three text fields); missing values are reported as `missing_data` (warning) on any field empty in 20% or more of the rows, because a scan over rows does not know which fields are required; outliers are values beyond 3σ on fields whose every value is numeric
- feat!: the AI normalization check fails the scan with 502 when the provider errors or answers something other than a JSON array (1.x reported no findings, the same answer clean data gives); with no `ai` provider installed it does not run and the scan says so in `skipped_checks` (1.x said nothing); `scan_type: "normalization"` alone with no provider answers 422 and records no scan. An outlier check on a numeric field with fewer than 11 values, where 3σ cannot be reached, is listed in `skipped_checks` too
- feat!: dropped: `GET /summary`, `/stats`, `/scans`, `/scans/:collection`, `/scan/:scanId`, `/scan/:scanId/issues` (the data API serves both collections), the rules and remediations routes (rules were stored and never evaluated; remediations only recorded a note), and the `critical` severity and `alert_email`, which nothing produced or sent. `POST /scan/:scanId/check-sla` is `GET /scan/:scanId/sla` and checks open `error` issues against `max_error_issues` and, when set, open `warning` issues against `max_warning_issues`
- feat: `POST /scan/:scanId/dismiss-all` is all or nothing: one issue the caller may not dismiss leaves every issue as it was
- chore: the legacy `database` and `introspection` permission labels are dropped

## 1.0.11 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.10 (2026-10-11)

- fix: nine update handlers bind their jsonb column with toJsonb (#208)

## 1.0.9 (2026-10-08)

- feat: declare the extensions whose services six extensions call (#205)

## 1.0.8 (2026-10-07)

- fix(quality): drop CREATE EXTENSION and the dead tenantSchema path (1.0.8) (#196)

## 1.0.7 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.6 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.5 (2026-09-14)

- refactor(quality): the scanner moves to the extension that sells it (#125)

## 1.0.4 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.3 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.2 (2026-09-01)

- feat(sdui): convert 6 CRUD Studio pages to schemas
- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.1 (2026-08-19)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(quality): repair broken scan-dashboard contract (#25)
- feat(manifests): declare the capabilities each extension actually uses
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(analytics): declare the pages these extensions already ship
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(quality): the score was never stored, and the denominator was wrong
- feat(quality): remove the score, keep the thresholds anyone can defend
- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
