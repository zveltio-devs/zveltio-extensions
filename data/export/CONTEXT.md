# data/export — context

Presat 2026-08-12: **11/11**, cu o regulă RLS și o permisiune de coloană chiar
configurate. Asertarea a scos ce citirea codului nu scosese.

## Reparația din 11 august acoperise o singură cale din două

`runExportJob` primise ambele gărzi. **`GET /:collection` nu.** Ruta sincronă —
cea pe care o folosește Studio pentru „descarcă acum" — a rămas pe `selectAll()`.

Dovedit alături, nu dedus: pentru **același utilizator, în aceeași sesiune**,
`/api/data/probe_docs` ascundea `secret_note`, iar
`/ext/data/export/probe_docs` îl livra. Exportul întorcea pe deasupra
`search_vector` și `search_text`, coloane pe care colecția nu le declară.

Controlul negativ: cu regula ștearsă, coloana reapare în **ambele** căi. Fără
el, „ascuns" s-ar fi putut obține și rupând interogarea.

Comentariul care spune „a boundary only one route honours is not a boundary"
era deja în fișier, cu douăzeci de linii mai sus, despre celălalt handler.

**Rândurile n-au putut fi demonstrate ca scurgere.** Poarta rutei cere admin,
iar RLS scutește adminii — deci nu există utilizator pentru care filtrul să
muște și care să poată totuși exporta. Filtrul e aplicat oricum: motivul pentru
care e neobservabil ține de cine poate chema ruta, nu de ce promite ruta, iar
ziua în care poarta aia se relaxează nu e ziua potrivită să afli că filtrul nu
fusese legat niciodată.

## Ce a costat montarea probei, și de ce contează

Ca să ajung la codul testat a trebuit: un al doilea utilizator, membru al
firmei prin `POST /api/tenants/:id/members` (scrisul de mână al rândurilor
Casbin **nu** funcționează — API-ul transformă `member` în `tenant_member` prin
`casbinRole()`), o politică RLS cu `filter_value_source: "static:alfa"` — un
`alfa` simplu se rezolvă la `null` și politica e **sărită în tăcere** — și o
permisiune de coloană pe rolul din `user.role`, nu pe cel din Casbin, fiindcă
`getColumnAccess` primește `resolveUserRole(user)`.

Trei convenții diferite pentru „rol", în același scenariu. Nimic din asta nu e
greșit, dar explică de ce nota veche spunea că asertarea „cere o regulă RLS și o
coloană ascunsă configurate întâi": e adevărat, și e mai greu decât sună.

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
