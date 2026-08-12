# data/export — context

Reparat 2026-08-11, **G nepresat**. Codul aplică acum politicile instanței, dar
asertarea cere o regulă RLS și o coloană ascunsă configurate întâi — până atunci
nu se promovează.

## Gaura: exportul ocolea două reguli pe care restul produsului le respectă

`ctx.db` și `withTenantIsolation` dau **granița de tenant**: politicile Postgres
se aplică, rândurile altei firme sunt inaccesibile. Nu spun nimic despre cele
două reguli pe care un operator le scrie *înăuntrul* unei firme:

- regulile RLS de la `/api/rls`, care ascund rânduri de un utilizator;
- permisiunile pe coloane, care ascund un câmp de un rol.

Exportul verifica `read` pe colecție și apoi făcea `selectAll()`. Adică livra
exact rândurile pe care o politică le ascundea și exact coloanele pe care un rol
n-avea voie să le vadă — aceleași date ca API-ul de date, o rută mai la stânga.

## De ce reparația n-a putut fi scrisă până acum

Engine-ul a primit ambele gărzi pe 2026-07-31 (`8c1c10a`), pe `/api/export` —
rută cu **zero consumatori**. Aici nu se putea face: `getColumnAccess` și
`getRlsFilters` trăiau în `lib/tenancy` și nimic din afara engine-ului nu le
putea citi.

**Nu era omisiune, era indisponibilitate.** Gărzile au fost expuse pe
`ctx.internals` (negate — ele doar scot rânduri și coloane, nu acordă nimic).
Ăsta e și motivul pentru care extensia depinde acum de o versiune de engine
nemergeată: CI-ul extensiilor clonează master-ul engine-ului.

## O schimbare reală de comportament

Când nu se cer câmpuri anume, exportul trece de la `selectAll()` la lista
explicită schema+sistem, la fel ca engine-ul. Consecință: nu mai iese
`tenant_id` și nicio altă coloană fizică nedeclarată în colecție. E o reparație
în sine, dar e o schimbare de formă a rezultatului — de menționat la release.

## Utilizatorul nu ajungea în job

`runExportJob` rulează după răspuns, deci n-are cerere din care să afle cine a
cerut exportul — exact forma urmării cu `tenantId`, rezolvată în același fel.
Fără el, ambele gărzi sunt fără sens: și RLS, și permisiunile pe coloane sunt
întrebări despre *cine*.

## Ce trebuie apăsat ca să devină „verificat"

1. Colecție cu o coloană ascunsă pentru un rol; export ca acel rol; coloana
   lipsește din CSV/JSON.
2. Regulă RLS care ascunde rânduri de un utilizator; export ca el; rândurile
   lipsesc.
3. Control pozitiv: un god exportă și primește tot.

## Ce e încă deschis

`routes/export.ts` din engine (1 rută, zero consumatori) — de șters.
