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
