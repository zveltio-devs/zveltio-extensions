# GDPR — context

**Verificat prin apăsare: 2026-08-09.** Ștergere completă rulată cap-coadă.

## Ce era rupt

**Ștergerea eșua pe orice instalare.** Ruta șterge rândurile unei persoane din
zeci de tabele și le împacheta într-o tranzacție — dar `ctx.db` rezolvă
tranzacția cererii, iar Kysely refuză `transaction()` pe o tranzacție. Mesajul
raportat era „referential integrity", care numea cauza greșită și trimitea pe
oricine depana în direcția opusă.

Reparat în engine (`createRestrictedDb` face joncțiune în loc de imbricare), nu
aici.

**Nouă coloane inexistente** — cod și schemă scrise separat.

## Cum e acum

Fiecare ștergere opțională are propriul SAVEPOINT, iar ce n-a putut fi șters se
raportează în `skipped[]`. **Un `try/catch` în JavaScript nu izolează nimic în
Postgres** — o instrucțiune eșuată abandonează toată tranzacția, deci fără
savepoint prima tabelă lipsă omora restul ștergerii.

## Ce am raportat greșit o dată

Am afirmat că ștergerea „raportează succes fals". Nu e adevărat — `DELETE`-ul
final nu e prins, deci dă 500. Problema reală era mesajul care numea cauza
greșită.
