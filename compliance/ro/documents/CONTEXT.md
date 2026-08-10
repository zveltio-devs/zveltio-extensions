# Registrul de documente — context

**Verificat prin apăsare: 2026-08-10.** Document creat cu număr din serie,
modificat de două ori, istoric citit, versiune restaurată.

## Ce era rupt

**Fiecare firmă în afară de prima primea numere inventate.**
`zv_ro_doc_number_sequences` avea `PRIMARY KEY (type)` de pe vremea când exista
un singur rând per tip. Migrația 002 a adăugat `tenant_id` și RLS **și n-a atins
constrângerea**. A doua firmă nu-și putea insera rândul, `UPDATE` întorcea zero,
iar ruta cădea pe `CONTRACT-1754800000000` — un marcaj de timp în loc de număr de
registru. Calea normală, nu un caz marginal.

**Două scrieri înghițite ștergeau istoricul.** Instantaneul dinaintea unei
modificări și cel dinaintea unei restaurări ajungeau amândouă în `.catch(() => {})`.
Dacă eșuau, operația mergea mai departe și versiunea anterioară dispărea — exact
ce registrul există să păstreze.

## Capcane

**Ruta de modificare e PATCH, nu PUT.** M-a costat o depanare falsă.

**Migrația 004 a fost scrisă greșit prima dată:** `SET NOT NULL` înaintea
completării. Trecea la mine fiindcă rândurile mele fuseseră scrise după ce exista
coloana; pe o bază nouă, 001 seed-uiește și 002 adaugă coloana după, deci sunt
NULL-uri. **Orice migrație care pune NOT NULL trebuie să completeze întâi.**

**`003_user_ref_text.sql` a reparat O SINGURĂ coloană** din clasă și le-a lăsat
pe surori — de asta `zv_ro_documents.created_by` era încă `uuid` și crearea unui
document cădea pe o bază nouă. Lecția: repară clasa, nu instanța.

## Numerotarea, acum

O singură instrucțiune atomică: revendică următorul număr, creează secvența la
prima emitere a firmei, repornește seria în ianuarie. **Fără număr de rezervă** —
dacă registrul nu poate da următorul număr, documentul nu se creează.
