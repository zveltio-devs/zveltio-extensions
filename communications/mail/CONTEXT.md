# communications/mail — context

Presat 2026-08-12 cu **un server IMAP + SMTP scris pentru asta**, nu cu un mock:
`AUTHENTICATE PLAIN` (SASL, cu și fără initial-response), `LIST`, `SELECT`,
`UID FETCH` cu `ENVELOPE` și literale numărate **în octeți**, `LOGOUT`; SMTP cu
`EHLO`/`AUTH`/`DATA`. Clientul e `imapflow` real, cel din producție.

**Ce dovedește:** că drumurile IMAP/SMTP ale extensiei sunt corect legate și
tratează răspunsuri de protocol adevărate. **Ce nu dovedește:** interoperarea cu
Dovecot, Exchange sau Gmail. O rută care merge aici poate încă pica pe un server
real; una care pică aici e ruptă oricum.

Controlul care contează: **parolă greșită ⇒ 400**, cont necreat. Validarea chiar
se execută, nu e ocolită.

## Parola cifrată era trimisă ca parolă IMAP

`lib/imap-operations.ts` construia clientul cu `account.imap_password` **direct**,
pe când `lib/imap-client.ts` apela `decryptPassword()`. Fiecare apelant îi dă un
rând `SELECT *` din `zv_mail_accounts`, unde parola e ce a scris `encryptPassword`
— deci pleca **textul cifrat** spre server, care răspundea AUTHENTICATIONFAILED.

Cele două căi divergaseră: sincronizarea mergea prin `imap-client.ts` și
funcționa, iar cota, descărcarea `.eml` și **toate operațiile pe foldere**
treceau pe aici și dădeau 500 pe orice cont creat după ce parolele au început să
fie cifrate — adică pe toate. **Șase apeluri, o singură cauză.** Reparat în
punctul unic, nu în șase locuri.

Verificat: cele trei rute care dădeau 500 răspund acum 200; trimiterea prin SMTP
ajunge efectiv la server (`success:true` + mesaj primit); ciorna parcurge
creare → citire → trimitere → ștergere.

## Ce a rămas neapăsat

Rutele AI de rezumat și context de răspuns — cer un furnizor AI, nu un server de
mail. Restul celor 43 au fost apăsate.

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

## SDUI migration (2026-08-21)
Branch: feat/sdui-tier3-reduced
Accounts+signatures; inbox client deferred.
