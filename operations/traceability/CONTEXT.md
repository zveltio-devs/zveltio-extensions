# operations/traceability — context

Trasabilitate alimentară: furnizori, articole, locații, loturi, producție cu
puncte critice HACCP, expediere, retrageri, rapoarte ANSVSA.

## Secțiunea G — presată 2026-08-12: 54/54

Toate cele 54 de rute apăsate pe bază virgină, cu engine viu și cu
`finance/invoicing` activată (e dependință declarată). Acoperirea a fost
verificată comparând rutele apăsate cu cele extrase din sursă — nu numărând
apelurile, fiindcă un script poate apăsa aceeași rută de două ori și lăsa alta
neatinsă.

## Ce a scos: predarea factură → expediere nu funcționase niciodată

Patru rute — `GET /dispatches/:id`, `POST /dispatches/:id/assign-lot`,
`/confirm`, `/cancel` — lucrează pe o expediere aflată în starea `pending`.
Singurul loc care creează așa ceva e hook-ul din `engine/index.ts`: ascultă
`record.created` pentru `zvd_invoices` și caută liniile de factură care poartă
`metadata->>'lot_id'`.

**Interogarea aceea găsea zero linii, mereu.** `finance/invoicing` scria
metadata liniei cu `${JSON.stringify(...)}::jsonb`, iar un parametru șir turnat
direct în `jsonb` e un no-op: driverul îl trimite deja CA valoare jsonb, deci
documentul ajunge **scalar-șir**, nu obiect. `jsonb_typeof(metadata)` citea
`string`, iar `->>'lot_id'` întorcea NULL.

Cei doi cititori JavaScript din invoicing n-au observat, fiindcă amândoi fac
`typeof x === 'string' ? JSON.parse(x) : x` și compensează în tăcere. **Un
cititor SQL nu poate compensa.** Reparat în `finance/invoicing` cu
`::text::jsonb`, plus migrația 011 care convertește rândurile deja scrise —
altfel istoricul rămânea invizibil pentru același cititor.

Control: aceeași factură, aceeași instalare. Înainte — zero expedieri noi.
După — `status=pending`, iar cele patru rute răspund 200.

## Ce am confundat cu un defect, și nu era

- `POST /dispatches/direct` urmat de `assign-lot` dă 404. Corect: `assign-lot`
  cere `status = 'pending'`, iar o expediere directă e deja confirmată.
  **Mesajul e însă înșelător** — spune „Expediere negăsită", când expedierea
  există și doar starea nu se potrivește. Nereparat: e text, nu comportament.
- `DELETE /locations/:id` pe o locație cu loturi dă 409. E gardă, nu bug —
  verificată în ambele ramuri (locație goală → 200).
- Prima rulare a raportat opt eșecuri care erau **payload-urile mele ghicite**.
  Schemele reale (`itemSchema`, `locationSchema`, `receptionSchema`,
  `/dispatches/direct`, `/recalls/initiate`, `/recalls/:id/resolve`) diferă de
  ce presupusesem. Citite, nu ghicite, a doua oară.
- A doua rulare a picat pe coduri duplicate (`SUP-1`, `ITM-1`) rămase din prima.
  Sonda folosește acum coduri unice per rulare.

## Ce rămâne deschis

- `::jsonb` pe `vat_breakdown` (invoicing, linia 746) are aceeași formă greșită,
  dar consumatorul ei face `JSON.parse` explicit, deci funcționează. Neatinsă
  deliberat — face parte din cele 22 de apeluri rămase din campanie, fiecare
  cerând citirea consumatorului înainte de a fi schimbat.
- Rapoartele au fost apăsate, nu **validate**: `ansvsa-traceability` întoarce
  200 cu `from`/`to`, dar dacă conținutul lui satisface cerința ANSVSA nu poate
  fi stabilit de aici.


## SDUI migration (2026-08-21)
Reduced list CRUD via schema. Nested-route validator fixed in @zveltio/sdk.
