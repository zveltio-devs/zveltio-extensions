# content/media — context

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

## Ce e încă deschis

- Restul de 27 de rute, nepresate.
- `cc11e15` (engine): „files are the uploader's unless they are library assets" —
  o schimbare de vizibilitate la listare, tot pe copia moartă, **neportată**.
- `routes/media.ts` din engine (784 linii, 17 rute, toate acoperite de extensie)
  și `zv_storage_quotas` / `zv_media_favorites` din `schema.ts` — de șters.
- `lib/cloud/trash.ts` și `lib/cloud/document-indexer.ts` rămân în engine și sunt
  împrumutate prin `ctx.internals`. După ce `routes/media.ts` pleacă, nu mai are
  niciun consumator din gazdă — decizie de proprietar.
