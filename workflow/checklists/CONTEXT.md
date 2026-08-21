# Liste de verificare — context

**Verificat prin apăsare: 2026-08-10, pe bază virgină.** Șablon creat, atașat pe
o înregistrare, puncte copiate, bifate, listă finalizată, două scheme de punctaj
configurate și scoruri calculate.

## Ce era rupt

**Bifarea unui punct n-a funcționat niciodată.** `checked_by` și `completed_by`
sunt coloane `uuid` care primesc `"user".id` — un nanoid de 32 de caractere. Fiecare
încercare de bifare returna 400 cu o eroare de conversie pe care ruta n-o numea.
Pe orice instalare care a existat, pentru **acțiunea centrală a extensiei**.

Merită reținut cum a scăpat: **două treceri din aceeași zi căutau exact clasa
asta** și au ratat-o, fiindcă lucrau după o listă de nume de coloane scrisă de
mână, iar `checked_by` nu era pe ea. Engine-ul are acum o poartă care întreabă
catalogul — *care coloane `uuid` se numesc `\*_by`?* — în loc de o listă pe care
cineva trebuie s-o țină completă.

## Punctaj configurabil

Un șablon poartă oricâte **scheme**. Ponderile stau pe schemă, nu pe punct —
asta e tot rostul: o inspecție poate fi măsurată simultan pentru siguranță și
pentru conformitate comercială, iar punctul care contează enorm la una poate fi
irelevant la cealaltă. Pondere zero, sau lipsa ei, scoate punctul din numitorul
acelei scheme.

**Ponderile se leagă de punctul din ȘABLON**, ceea ce a impus
`zv_checklist_items.template_item_id`. Punctele instanței sunt copii, iar
singura legătură cu originalul era eticheta — punctarea după etichetă s-ar fi
desprins la prima corectare a unei greșeli de scriere. Tăcut, și în direcția care
flatează scorul.

**Rezultatul păstrează instantaneul** a ce l-a produs: fiecare punct ponderat,
ponderea lui, dacă a fost bifat, pragul în vigoare. Ponderile se schimbă;
auditul de anul trecut nu trebuie să se schimbe.

**Se recalculează la fiecare modificare**, nu la finalizare. Finalizarea se
declanșează când ultimul punct *obligatoriu* e bifat, iar opționalele vin de
obicei după — calculul pe tranziție îngheța scorul la 5/10 în timp ce două bife
ulterioare nu-l mai mișcau. Măsurat live după reparație: 50 → 70 → 100.

## Limită de model — citește înainte să extinzi punctajul

**Bifat nu înseamnă conform.** „Temperatura e greșită" și „n-am verificat
temperatura" arată identic: un punct nebifat. Pentru o inspecție reală trebuie
trei stări — conform, neconform, neaplicabil. Deocamdată sunt două.

Nu s-a schimbat fiindcă e o decizie de model, nu un defect. Dar cu scorul pe
ecran diferența devine vizibilă.

## Rămâne deschis

**Pagina de studio e moartă cap-coadă.** Cheamă patru adrese, toate 404:
`/`, `/{id}`, `/{id}/responses`. Are stare `responses` și o vedere `'responses'`
— e o copie a paginii de **formulare**, unde forma aia are sens. API-ul real e
`/templates`, `/record/:colectie/:id`, `/items/:id`, `/overdue-items`, `/summary`.

Ecranul de configurare a schemelor cere **master-detail** (schemă → ponderi per
punct), care încă nu există în randor. Al treilea lucru care îl așteaptă.

## SDUI migration (2026-08-21)

SDUI templates+summary; GET /templates?all=1 embeds items
Branch: `feat/sdui-crud-batch`
