# Changelog

## 1.1.15 (2026-10-27)

- feat(content/pages): refuse page slugs, site slugs and base paths under reserved paths (#266)

## 1.1.14 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.1.13 (2026-10-18)

- fix(pages): pass the acting principal to getColumnAccess, not its id (#229)

## 1.1.12 (2026-10-14)

- feat(pages): not_contains, starts_with and ends_with in the page-builder filter (#209)
- fix(pages): name the columns a data block and a record page read, never * (1.1.12) (#219)

## 1.1.11 (2026-10-07)

- fix(pages): read the registry, the catalog and the role through the engine (1.1.11) (#197)

## 1.1.10 (2026-09-30)

- fix(export,pages): a hidden column is no longer a filter, sort or search key (#158)

## 1.1.9 (2026-09-25)

- fix(content/pages): a failed role lookup read the viewer as "public" (#142)

## 1.1.8 (2026-09-24)

- fix: type the ctx.internals call sites that had been reaching through `any` (#140)
- fix(content/pages): a failed row-rule lookup rendered every row it hides (#141)

## 1.1.7 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.1.6 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.1.5 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.1.4 (2026-09-10)

- fix(content/pages): the editor gate says which admin it means, and is now tested
- fix(pages): pass the acting user so a god is not masked in portals (#101)

## 1.1.3 (2026-09-05)

- fix(content/pages): the sitemap interpolated record data into XML

## 1.1.2 (2026-09-05)

- fix(content/pages): both public write routes accepted anything

## 1.1.1 (2026-09-05)

- fix(content/pages): record data reached an href unescaped

## 1.1.0 (2026-09-05)

- fix(content/pages): an unresolved tenant became the root tenant

## 1.0.9 (2026-09-05)

- fix(content/pages): the client sanitizer let unclosed tags through on SSR

## 1.0.8 (2026-09-05)

- fix(content/pages): two authorisation defects on the read paths

## 1.0.7 (2026-09-05)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- fix(pdf-viewer): două prop-uri inventate, și descrierea corectată
- fix(auth): SAML SSO could not complete a login in either flow

## 1.0.6 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.5 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.4 (2026-08-25)

- feat(sdui): pages + traceability master data (nested routes)
- feat(pages): ship Tier-3 block builder at /admin/pages/builder/:id
- fix: `return` dintr-o tranzacție COMITE — patru locuri unde greșisem

## 1.0.3 (2026-08-19)

- fix(pages): declare tenant_id on the tables, not only inside the RLS loop

## 1.0.2 (2026-08-19)

- fix(pages): every company but the first opened the builder to an empty library

## 1.0.1 (2026-08-18)

- feat(pages): popups, motion, icons — and JSON that was stored as text
- feat(pages): a page can be the page OF one record
- feat(pages): a record page decides which rows have an address
- fix(pages): scope every site and page query, and hold it with a test
- fix(pages): a block created through the API had no id, so half its features were unreachable
- fix(pages): the canvas showed a grey box where the visitor sees a button

## 1.0.0 (2026-08-16)

- feat(pages)!: portals and page-builder become one extension
