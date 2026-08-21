# Achiziții publice — context

**Verificat prin apăsare: 2026-08-10, pe bază virgină.** Furnizor creat, comandă
creată și aprobată, raport de cheltuieli cu sume reale pe toate cele trei grupări.

## Ce era rupt

**Crearea unei comenzi returna 400 pe orice instalare nouă.** `created_by` și
`approved_by` erau `uuid`, iar `"user".id` e nanoid de 32 de caractere — 22P02.
Vizibil **doar pe bază virgină**: pe una folosită coloanele fuseseră modificate
manual cândva.

Ruta nu numea cauza. Eroarea ajungea la client ca „A request parameter has an
invalid format", ceea ce trimite pe cine depanează direct în validatorul Zod,
unde nu e nimic.

## Capcană care se repetă aici

**Raportul de cheltuieli compune trei interogări cu `Promise.all` pe aceeași
tranzacție.** O singură interogare stricată otrăvește tranzacția, iar celelalte
două întorc gol — trei zerouri false într-un raport de cheltuieli publice.

Nu se poate repara bine din extensie: `SAVEPOINT` cere să știi dacă ești într-o
tranzacție, iar extensia n-are cum să afle. Cere `ctx.isolated(label, fn)` în
contractul SDK. Până atunci fiecare citire își loghează cauza cu etichetă.

## Chei lărgite

`number` pe comenzi, contracte și note de recepție; `cui` pe furnizori; `code` pe
liniile de buget. Toate erau unice pe instanță — două primării nu puteau avea
același furnizor.

## SDUI migration (2026-08-21)

SDUI 3-tab schema; order lines via JSON field
Branch: `feat/sdui-crud-batch`
