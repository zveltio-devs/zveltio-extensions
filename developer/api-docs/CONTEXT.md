# developer/api-docs — context

Reparat 2026-08-11, presat pe bază virgină. Toate rutele răspund; comutatorul de
documentație publică funcționează în ambele sensuri, cu control pozitiv.

## Documentația publică nu putea fi pornită de nicăieri

Trei straturi peste aceeași funcție, fiecare suficient s-o anuleze:

1. `checkDocsAccess` citea `api_docs_public` din `zv_settings` — tabel de sistem
   al engine-ului, refuzat de `ctx.db` (regula D1) — printr-un helper cu
   `catch { return null }`. Deci răspunsul era mereu `null` și se cădea de
   fiecare dată pe ramura „cere sesiune". **Nu era o setare lăsată pe `false`, ci
   una imposibil de citit.**
2. `/` și `/openapi.json` stăteau după poarta fail-closed `/ext/*`, deci un
   vizitator anonim primea 401 înainte ca `checkDocsAccess` să apuce să decidă.
3. Chiar dacă primele două ar fi mers, **nu exista nicio rută care să scrie
   setarea**. Se putea scrie doar din UI-ul de setări al engine-ului, în tabelul
   pe care extensia nu-l poate citi.

Reparat: `zvd_api_docs_config` (migrația 004, RLS pe firmă, preluare din
`zv_settings`), `publicRoutes` în manifest, și `GET`/`PUT /visibility` — setterul
pe care nu l-a avut niciodată. Mutarea configului fără setter l-ar fi dus doar de
la „necitibil" la „nescriibil".

Verificat: comutator ON → anonim primește 200 pe `/` și pe `/openapi.json`;
comutator OFF → 401. Ambele sensuri, nu doar cel bun.

## Brandingul gazdei — decizie de proprietar, lăsată deschisă

Titlul și adresa de contact din specificația OpenAPI se citeau din setarea
`branding` a engine-ului, tot din `zv_settings`. Citirea arunca mereu, deci
valorile de rezervă (`Zveltio API`, `admin@yourdomain.com`) au fost singurele pe
care le-a produs vreodată codul ăsta.

Am lăsat rezervele, **nu** am cerut un grant. Brandingul e al gazdei, iar grantul
e per tabel — extensia de documentație ar fi căpătat odată cu el configurația de
mail și pe cea SSO. Nu există azi nicio cale prin care gazda să ofere brandingul
unei extensii. E aceeași clasă cu gărzile de citire expuse pe `ctx.internals`, și
se rezolvă la fel dacă se decide că merită.

## Ștergerea care ștergea și raporta „not found"

`DELETE /changelogs/:id` întorcea 404 pentru un rând pe care tocmai îl ștersese.
Măsurat: 1 rând înainte → `DELETE` → 404 → 0 rânduri după.

Cauza nu era aici. `BunSqlDialect` întorcea `{ rows }` fără `numAffectedRows`,
deci `numDeletedRows` era mereu `0n` și idiomul pe care îl folosește toată lumea
— `(res?.numDeletedRows ?? 0n) === 0n → 404` — citea „n-a găsit nimic" după o
ștergere reușită.

Reparat în engine (dialectul transmite acum `count`-ul pe care Bun.SQL îl
expunea deja). **Aceleași 8 apeluri, în 4 extensii:** `developer/api-docs` (2),
`developer/graphql` (3), `developer/validation` (2), `developer/byod` (1) — toate
se repară odată cu el, fără schimbări în ele.

Engine-ul avea deja un test care fixa comportamentul vechi ca fiind intenționat
(„count with RETURNING"), scris după patru bug-uri cauzate de el. Workaround-ul
cu RETURNING nu era greșit — dar ajungea doar la locurile unde cineva se arsese
deja. Testul a fost rescris ca să afirme comportamentul corect, păstrând istoria.

## Detaliu

`POST /changelogs` cere `changes`, nu `body` — un 400 la prima încercare e
probabil forma cererii, nu un defect. Tabelul de tokenuri se numește
`zvd_api_access_tokens`, nu `zvd_api_tokens`.
