# Changelog

## 1.1.4 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.1.3 (2026-10-21)

- fix(developer/edge-functions): a private function on a custom path requires execute on $edge (#247)

## 1.1.2 (2026-10-15)

- fix(edge-functions): a function delete is audited; custom-path mounts are tested (B11) (#222)

## 1.1.1 (2026-10-12)

- fix(developer/edge-functions): an egress host the URL parser rewrites is refused at save (#211)

## 1.1.0 (2026-10-10)

- feat(developer/edge-functions): egress is saved, validated and audited with the function (#207)

## 1.0.9 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.8 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.7 (2026-09-17)

- fix(developer/edge-functions): the runner was called with shapes it does not take (#129)

## 1.0.6 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.5 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.4 (2026-09-01)

- feat(edge-functions,i18n,storage): ship Studio pages as SDUI
- feat: Tier-3 GraphQL playground, edge IDE, kanban, spatial explore
- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.3 (2026-08-19)

- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.2 (2026-08-11)

- fix(gate): a placeholder is not a declaration
- fix(manifests): declare which resources are confidential
- test(review): every extension pressed on a virgin database; nothing unverified left

## 1.0.1 (2026-08-06)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix: validate :id path params as UUID (400 instead of 500)
- ci: a bundle now has to prove it was built from the committed source
- fix(edge-functions): stop shadowing the engine's /api/fn
- fix(edge-functions): DEV-EF-2 — custom paths ran whichever tenant's code was read first
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(media,manifests): media used the mail extension's search label
- chore: bump every extension changed this round so the fixes can reach an install

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
