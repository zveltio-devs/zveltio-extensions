# Facturare — context

**Verificat prin apăsare: 2026-08-09.** Factură emisă cu serie și număr, PDF
generat, stoc mișcat pe aviz.

## Ce era rupt

**Șase migrații nedeclarate** în `getMigrations()`. Pe o instalare nouă lipsea
toată munca de conformitate — fără CUI, fără serii — iar extensia se activa
perfect, fără niciun semn. Invizibil pe orice mașină de dezvoltare, unde
coloanele fuseseră adăugate manual.

**`zvd_invoices.number` era unic pe instanță.** A doua firmă nu putea emite
`FACT-2026-0001`, iar RLS îi ascundea rândul care provoca conflictul — primea o
eroare de bază de date despre ceva ce nu putea vedea. Lărgit la
`(tenant_id, number)`.

## Ce s-a adăugat pentru a fi emisibilă legal în România

CUI obligatoriu și validat, serii configurabile per tip de document, profil de
firmă (reg. com., IBAN, bancă, adresă), defalcare TVA pe cote, catalog de
produse citit din gestiune **când extensia e activă** (`ctx.services.get()`
întoarce `null` altfel — facturarea trebuie să meargă fără gestiune).

## Decizie de arhitectură

**Stocul se scade pe avizul de însoțire, nu pe factură.** Vezi
`operations/inventory/CONTEXT.md` — regula de business stă în gestiune, nu într-o
extensie regională.

## Capcane

Numerotarea e revendicare atomică per firmă. **Nu adăuga un număr de rezervă**
dacă revendicarea eșuează — registrul ori dă următorul număr, ori documentul nu
se creează. Vezi ce a pățit registrul de documente cu `Date.now()`.

## Metadata liniei era scalar-șir, nu obiect (reparat 2026-08-12)

Găsit presând `operations/traceability`, nu citind invoicing.

`${JSON.stringify(...)}::jsonb` pe linia de factură arăta ca și cum parsează
documentul. Nu o face: driverul trimite deja parametrul CA valoare jsonb, deci
cast-ul e un no-op și tot șirul serializat aterizează ca **un singur scalar**.
`jsonb_typeof(metadata)` citea `string`.

Cei doi cititori JavaScript de aici n-au observat niciodată, fiindcă amândoi fac
`typeof x === 'string' ? JSON.parse(x) : x`. **Un cititor SQL nu poate.**
`operations/traceability` caută linii cu `metadata->>'lot_id'` ca să ridice o
expediere `pending`; pe un scalar-șir operatorul dă NULL, interogarea găsea zero
rânduri, iar predarea factură→expediere **nu s-a produs niciodată**. Patru rute
din traceability erau inaccesibile în consecință.

Reparat cu `::text::jsonb` + migrația 011, care convertește și rândurile deja
scrise — verificat pe o bază care le conținea: `string` → `object`, iar
`->>'lot_id'` devine vizibil.

**`vat_breakdown` (linia 746) are aceeași formă greșită și rămâne neatinsă** —
consumatorul ei face `JSON.parse` explicit, deci funcționează. Nu o schimba fără
să-i citești întâi consumatorul.
