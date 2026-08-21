# Casă de marcat — context

**Verificat prin apăsare: 2026-08-09.**

## Ce era rupt

**Crearea unui client de la casă n-a funcționat niciodată.** Ruta face upsert cu
`ON CONFLICT (email)` pe un tabel **fără cheie unică pe email**, deci Postgres
răspundea „there is no unique or exclusion constraint matching the ON CONFLICT
specification" la fiecare apel. Nu o cursă, nu un caz marginal: instrucțiunea nu
putea executa deloc.

Găsit confruntând fiecare clauză `ON CONFLICT` cu constrângerile care există
efectiv — asta avea zero. Migrația 006 adaugă cheia pe care instrucțiunea o
presupunea dintotdeauna, pe `(tenant_id, email)`, fiindcă două firme pot avea
client la aceeași adresă.

`email` e opțional la casă, iar o constrângere unică tratează NULL-urile ca
distincte, deci clienții fără adresă nu sunt afectați.

## Rămâne deschis

**Nu există ecran de vânzare.** Motorul are rute; interfața de casă lipsește.
Rămâne pe lista P0.

## SDUI migration (2026-08-21)

SDUI sessions master + orders; close via prompt
Branch: `feat/sdui-crud-batch`
