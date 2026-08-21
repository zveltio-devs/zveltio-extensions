# content/media — context

## Engine dual door removed (2026-08-21)

`/api/media` in the engine is a **410 Gone** shim pointing at
`/ext/content/media`. Studio already used the extension; keeping a live twin
in core was the audit failure mode (fix the dead copy). Do not remount
handlers under `/api/media`.

---

Reparat 2026-08-11. Ștergerea e presată live cu control pozitiv; restul rutelor
(27) n-au fost parcurse, deci **nu e „verificat"**.

## Gaura: orice utilizator putea arunca la coș orice fișier din firma lui

Router-ul cerea doar o sesiune, iar `moveToTrash` filtrează după id, `deleted_at`
și tenant — nicăieri vreo verificare de proprietar. Deci oricine autentificat
putea distruge fișierul oricui, numindu-i id-ul. Pe **ambele** uși: cea simplă și
`POST /files/batch-delete`, care ia o listă arbitrară.

Engine-ul a primit reparația pe 2026-07-31 (`462310a`), pe `routes/media.ts` —
care are **zero consumatori**. Studio ajunge la media prin `/ext/content/media`.
Reparația a stat două săptămâni pe copia pe care n-o rulează nimeni.

Acum: proprietar sau administrator de tenant. Deliberat nu „oricine îl poate
citi" — a citi un fișier partajat și a-l distruge sunt acte diferite.

## De ce n-a văzut nimeni

Aceeași cauză ca la [data/import](../../data/import/CONTEXT.md): funcția a fost
mutată din engine în extensie, dar ruta veche a rămas montată. Auditul a citit
engine-ul, unde codul era încă vizibil și încă avea rute, și a găsit exact
problema — pe partea moartă. Mutarea a scos funcționalitatea din raza auditului
fără s-o scoată din produs.

Verificarea automată nu putea prinde: nu există niciun test care să pună doi
utilizatori în aceeași firmă și să-i pună să se calce reciproc.

## Ce s-a apăsat efectiv

Bază virgină, doi utilizatori, extensia activată:

1. Mallory, cu `*` pe resursa `media`, șterge fișierul lui Owner → **403**,
   fișier `INTACT`.
2. Aceeași, pe ușa de batch → `{"deleted":0,"refused":1}`, fișier `INTACT`.
3. **Control pozitiv:** Owner își șterge propriul fișier → **200**, `deleted_at`
   setat.

Punctul 1 fără 3 n-ar fi însemnat nimic — un 403 se obține și rupând totul.
Primul 403 pe care l-am primit venea de fapt de la poarta de permisiuni, fiindcă
sub deny-by-default un utilizator nou n-are deloc acces la media; a trebuit să-i
acord `*` **ca să ajung** la codul testat.

## Secțiunea G — presată 2026-08-12: 27/27

Toate cele 27 de rute apăsate pe bază virgină, cu engine viu. Două lucruri
reparate, ambele găsite doar prin apăsat — citirea codului nu le-ar fi arătat.

### Colecțiile erau imposibil de folosit din orice client

`randomUUID().replace(/-/g, '')` genera id-uri **fără cratime** pentru fișiere,
dosare și etichete. Coloana e `uuid`, deci Postgres normaliza la stocare — dar
răspunsul întorcea obiectul construit local, nu rândul salvat. Clientul primea
`bec8520945ff46c6ba19506735a65fe9` pentru un rând stocat ca
`bec85209-45ff-46c6-ba19-506735a65fe9`.

Trei endpointuri validează `z.string().uuid()`: `POST /collections`
(`cover_file_id`), `PATCH /collections/:id` (`cover_file_id`) și
`POST /collections/:id/files`. **Toate trei respingeau cu 400 exact id-ul pe
care API-ul tocmai îl dăduse.** Același fișier, scris cu cratime: `{"added":1}`.

Reparat separând cele două lucruri care fuseseră unul: `id`-ul rândului e UUID
canonic, iar cheia de stocare rămâne fără cratime — numele obiectelor arătau
mereu așa și fișierele existente sunt denumite astfel. `storage/cloud` făcea
deja corect (`${id.replace(/-/g,'')}${ext}`); tiparul greșit era doar aici,
verificat prin căutare în tot repo-ul.

**De ce n-a prins nimic:** niciun test nu ia id-ul dintr-un răspuns și îl trimite
înapoi. Testele își construiesc propriile UUID-uri, care au cratime.

### Cotele răspundeau 500 la greșeala administratorului

`POST /admin/quotas` cu un `user_id` inexistent sau malformat dădea 500 — o
încălcare de cheie străină ieșind ca eroare internă. Acum: `.uuid()` în schemă
prinde forma greșită, iar SQLSTATE `23503` devine 400 cu „Unknown user_id".
Verificat în toate trei direcțiile, inclusiv că utilizatorul real dă în
continuare 201.

### Verificat, nu presupus

`DELETE /files/:id` și `POST /files/batch-delete` au fost confirmate separat că
**șterg efectiv** — primul răspuns pe care-l primisem era 404 pe un fișier deja
șters de pasul anterior, iar `batch-delete` raportase cândva `deleted:0`. Un cod
de succes pe o ștergere care nu șterge arată identic cu una care șterge.

## Ce e încă deschis
- `cc11e15` (engine): „files are the uploader's unless they are library assets" —
  o schimbare de vizibilitate la listare, tot pe copia moartă, **neportată**.
- `routes/media.ts` din engine (784 linii, 17 rute, toate acoperite de extensie)
  și `zv_storage_quotas` / `zv_media_favorites` din `schema.ts` — de șters.
- `lib/cloud/trash.ts` și `lib/cloud/document-indexer.ts` rămân în engine și sunt
  împrumutate prin `ctx.internals`. După ce `routes/media.ts` pleacă, nu mai are
  niciun consumator din gazdă — decizie de proprietar.

## SDUI migration (2026-08-21)
Branch: feat/sdui-tier3-reduced
Folders/tags/collections; file browser+upload deferred.
