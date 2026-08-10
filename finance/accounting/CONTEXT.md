# Contabilitate — context

**Verificat prin apăsare: 2026-08-09.** Balanță de verificare, bilanț și centre
de cost citite pe date reale.

## Ce era rupt

Coloane scrise care nu existau (aceeași clasă ca în alte nouă extensii: cod și
schemă scrise separat, niciodată confruntate).

Balanța, bilanțul și centrele de cost existau în bază dar **nu erau expuse** —
datele se adunau și nu le vedea nimeni.

## Chei lărgite, și una merită privită

`zvd_fiscal_years.year` era unic **pe instanță**: o singură firmă de pe un server
putea avea exercițiul financiar 2026. La fel `zvd_accounts.code` — o singură
firmă putea avea contul „401" în planul ei de conturi. Ambele lărgite cu
`tenant_id`.

`zvd_exchange_rates` a rămas per firmă deliberat, deși un curs BNR e obiectiv
același pentru toți: ruta e scrisă ca fiecare firmă să-și adauge propriile
cursuri, deci a doua ar fi lovit conflictul. Este o memorie cache, nu o sursă de
adevăr.

`ON CONFLICT` pe cursuri include acum `tenant_id`.

## Ce am raportat greșit o dată

Am afirmat că balanța afișează sume goale. **Fals** — testul meu cerea
`debit`/`credit`, iar API-ul întoarce `total_debit`/`total_credit`. Eroare de
test, nu de produs.
