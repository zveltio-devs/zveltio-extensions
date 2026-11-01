# Changelog

## 3.0.0 (2026-11-01)

- feat!: forms absorb workflow/checklists. A response (`form_submissions`) is either one-shot (`submit`, as before: every required field at once, closed afterwards) or attached to a record (`attach` with `form_id`, `collection`, `record_id`) and filled field by field (`answer` with a map of field ids to values, `updateAnswer` for one answer's value, notes, assignee, due date and time spent); `submit` refuses a form that names a collection (`form_for_records`)
- feat!: answers are rows (`form_answers`, one per field, unique per response), written only by the actions; the response's `data` is kept as the answer map, rewritten by the same action, so the builder's responses panel and a one-shot submission still read whole
- feat: a field may be a `checkbox` (answered when ticked), carry a `weight` and an `assignee` (copied to its answer when a response is attached); a form may name the `collection` whose records it is for and a `pass_threshold`
- feat: completion follows the answers: a response completes when every required field is answered (with `time_to_complete_minutes`) and reopens when one is emptied; the score is the weight of the answered fields over the weight of every weighted field, with `passed` against the threshold and a `score_snapshot` of what it was computed from
- feat: `form_recurrences` and `runDueRecurrences` attach a response to a record on a schedule (daily, weekly, monthly, quarterly), one per run however many were missed; a schedule whose form is gone, inactive or for another collection is skipped and reported; a month-end schedule stays on the month end (checklists 2.0.0 drifted to the 28th after February)
- feat!: dropped from checklists: several scoring schemes per template (one score per form now, from the field weights), checklists made of ad-hoc items without a template (make a form), ticking items of several checklists in one call, and `time_estimate_minutes` and `assignee_role` on template items (a field's `assignee` is a user id)

## 2.0.0 (2026-11-01)

- feat!: forms and their submissions are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/forms/*` routes are gone — a form and its fields are plain edits through `/api/data`; a submission is the action `submit` (`POST /ext/forms/actions/submit` with `{ slug, data }`), and removing one is `deleteSubmission`
- feat!: a submission is written only by `submit` (`writtenBy: actions`, engine 3.0.0-beta.93): it holds the form's own fields and nothing else, and nobody edits it afterwards
- feat!: the `/public/*` routes and the admin check are gone. A public form is a page holding an API key the operator issues; what it may read and run is the engine's rules on these collections (`submit` on `form_submissions`, `deleteSubmission` on `forms`, so a key that submits never deletes). The per-IP limit goes with them: the engine limits each key in one hourly bucket (`rate_limit`), shared by every visitor of a page. A key that reads `forms` reads every form; a row rule on `active` keeps inactive ones out
- feat!: gone with them: `target_collection` (map a submission into a collection with a flow on `form_submissions`), the submission's IP address and user agent, and the submission count on the list
- fix: a form whose `fields` is not a list refuses submissions instead of storing them empty
- fix: 1.x inserted a mapped submission into a table named after the collection, which does not exist (collection tables are `zvd_<name>`), so every submission to a form with a target collection failed and was lost

## 1.0.13 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.12 (2026-10-11)

- fix: nine update handlers bind their jsonb column with toJsonb (#208)

## 1.0.11 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.10 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.9 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.8 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.7 (2026-09-01)

- fix(securitate): șase extensii de nivel UNU au rămas cu hono vulnerabil

## 1.0.6 (2026-08-25)

- fix(forms, time-tracking): trimiterea publică și facturarea orelor

## 1.0.5 (2026-08-21)

- feat(sdui): lot QR tab + forms drag-reorder i18n

## 1.0.4 (2026-08-21)

- feat(sdui): reduced Tier-3 for forms, byod, media, ai, mail
- feat(sdui): forms builder + responses (#51)

## 1.0.3 (2026-08-12)

- fix: every SDUI create form now posts what its API accepts

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: pack the 5 Phase 1 pilot extensions
- fix: bundle hash de-sync — gitattributes + re-pack 5 pilots
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- feat(security): declare publicRoutes + fix broken public-route guards
- fix: validate :id path params as UUID (400 instead of 500)
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(tenancy): 60 unique keys the second company on an instance collided with
- test(review): every extension pressed on a virgin database; nothing unverified left

## 1.0.0 (2026-04-03)

- upgrades
