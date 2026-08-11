# communications/mail — context

Reparat 2026-08-11. **G nepresat**: crearea unui cont validează conexiunea IMAP
înainte să salveze, deci ~30 din cele 43 de rute (foldere, mesaje, sync, filtre,
identități, trimitere) cer un server IMAP real. Ce se putea apăsa fără el a fost
apăsat.

## Două salvări de setări ștergeau toată configurația de mail

`PUT /admin/config` scria `${JSON.stringify(merged)}::jsonb`. Un parametru șir
turnat direct în `jsonb` e un **no-op**: driverul îl trimite *ca* valoare jsonb,
deci documentul ajunge un **scalar-șir** — tot configul între ghilimele, nu
parsat. Se vrea `::text::jsonb`, care îl trece întâi prin text și îl parsează.

Paguba se compunea:

1. Prima salvare stoca șirul. `GET /admin/config` întorcea de atunci un **string**
   acolo unde pagina de admin aștepta un obiect.
2. A doua salvare îl citea înapoi și făcea `{ ...existing, ...patch }`. Spread
   peste un **șir** dă câte o cheie pe caracter: configul devenea
   `{"0":"{","1":"\"","2":"e", …}` și toate setările de mail dispăreau.

Ambele salvări răspund `success: true`. Niciun mesaj de eroare, nicăieri.

Verificat pe bază virgină, exact secvența care distrugea: două `PUT` la rând →
`jsonb_typeof = object`, ambele modificări păstrate (`max_messages_sync: 500`,
`sync_interval_minutes: 9`), valorile din seed intacte.

`readMailConfig` parsează și forma-șir, deci o instalare care a salvat **o
dată** se recuperează la următoarea citire. Una care a salvat de două ori nu mai
are ce recupera și trebuie configurată din nou.

## Clasa, nu instanța

Tiparul `${JSON.stringify(x)}::jsonb` apare de **27 de ori în 12 extensii**.
Măsurat direct pe Postgres:

```
'{"a":1}'  ::jsonb        →  jsonb_typeof = string   (gresit)
'{"a":1}'  ::text::jsonb  →  jsonb_typeof = object   (corect)
```

Nu toate cele 27 sunt rupte: multe cititoare fac `JSON.parse` și tolerează forma
șir, iar un fix orb **le-ar strica**. Sunt rupte cele unde valoarea e apoi
folosită *ca obiect* — în SQL cu operatori jsonb, sau întoarsă unui client care
așteaptă un obiect.

Detectorul: coloană scrisă cu `::jsonb` și interogată cu `->`, `->>`, `@>`,
`jsonb_array_elements` **sau `||`**. Ultimul l-am ratat la prima trecere și e
fix cel care a scos cazul cel mai grav.

## Ce a scos detectorul: HACCP în operations/traceability

`SET haccp_checks = haccp_checks || ${'${...}'}::jsonb`. Coloana e
`JSONB DEFAULT '[]'`, deci intenția e să adauge o verificare în array. Cu
scalarul-șir:

```
'{"a":1}'::jsonb || '"str"'::jsonb  →  [{"a": 1}, "str"]
```

Adică array-ul se umplea cu **textul brut** al verificărilor, nu cu obiectele.
Sunt evidențele de siguranță alimentară pe care le cere o inspecție ANSVSA:
păreau prezente și erau necitibile ca obiecte. Scrierea soră de deasupra avea
aceeași turnare, deci coloana pornea ca scalar-șir de la bun început.

Reparate toate cele 5 apeluri din `operations/traceability`. Restul celor 27 sunt
**neverificate una câte una** — lista e în commit, iar regula e că fiecare cere
citirea consumatorului înainte de schimbare.

## Ce rămâne pentru G

Un server IMAP/SMTP local. Fără el nu se pot verifica: sincronizarea, trimiterea,
filtrele Sieve, identitățile, cota, descărcarea `.eml` și rutele AI de rezumat /
context de răspuns.

Apăsate și funcționale: toate cele 7 rute de citire, `admin/config` în ambele
sensuri, semnături, contacte.
