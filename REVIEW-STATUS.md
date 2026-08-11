# Starea verificării extensiilor

Generat automat. `verificat` = cineva a parcurs secțiunea G din REVIEW-CHECKLIST.md
— adică a apăsat butoanele, nu a citit codul.

`presat — RUPT` = cineva a parcurs G și extensia **nu funcționează**. Detaliile
sunt în `CONTEXT.md`-ul extensiei; nu o marca „verificat" până nu trec rutele.

`reparat — G nepresat` = codul a fost citit integral, ce s-a găsit a fost reparat
și verificat contra unei baze reale, dar secțiunea G n-a fost parcursă — de obicei
fiindcă lipsește o dependință externă. Nu e „verificat" și nu se promovează fără G.

„Generat automat" e o intenție, nu un fapt: nu există generator, iar coloanele
numerice au driftat față de fișiere. Coloana `stare` e singura de încredere.

| extensie | rute | migr | serv | ascult | catch | ext | pagini | UI | teste | stare |
|---|--:|--:|--:|--:|--:|--:|--:|---|---|---|
| `ai` | 0 | 6 | 5 | 2 | 0 | 0 | 1 | cod | da | **reparat 2026-08-11 — G nepresat** |
| `analytics/dashboard` | 6 | 2 | 0 | 0 | 5 | 0 | 1 | cod | da | **verificat** |
| `analytics/quality` | 21 | 3 | 0 | 1 | 3 | 0 | 1 | cod | da | **verificat** |
| `auth/ldap` | 4 | 4 | 0 | 0 | 0 | 0 | 1 | SDUI | da | **reparat 2026-08-11 — G nepresat** |
| `auth/saml` | 5 | 4 | 0 | 0 | 0 | 4 | 1 | SDUI | da | **reparat 2026-08-11 — G nepresat** |
| `auth/scim` | 10 | 2 | 0 | 0 | 9 | 0 | 1 | SDUI | da | **verificat** |
| `billing` | 6 | 2 | 0 | 0 | 0 | 0 | 2 | cod | da | neverificat |
| `communications/mail` | 43 | 2 | 0 | 0 | 1 | 0 | 1 | cod | da | **reparat 2026-08-11 — G nepresat** |
| `compliance/gdpr` | 16 | 2 | 0 | 0 | 14 | 0 | 1 | SDUI | da | **verificat** |
| `compliance/ro/documents` | 12 | 4 | 0 | 0 | 2 | 0 | 1 | SDUI | da | **verificat** |
| `compliance/ro/efactura` | 23 | 6 | 2 | 1 | 6 | 6 | 2 | SDUI | da | **verificat** |
| `compliance/ro/etransport` | 9 | 2 | 0 | 0 | 0 | 0 | 1 | SDUI | da | **verificat** |
| `compliance/ro/procurement` | 22 | 3 | 0 | 0 | 0 | 0 | 1 | cod | da | **verificat** |
| `compliance/ro/saft` | 13 | 2 | 0 | 0 | 0 | 1 | 1 | SDUI | da | **verificat** |
| `content/document-templates` | 14 | 3 | 0 | 0 | 0 | 0 | 1 | SDUI | da | **verificat** |
| `content/documents` | 12 | 3 | 0 | 0 | 5 | 0 | 1 | cod | da | neverificat |
| `content/drafts` | 18 | 2 | 0 | 0 | 2 | 0 | 1 | SDUI | da | neverificat |
| `content/media` | 27 | 2 | 0 | 0 | 1 | 0 | 1 | cod | da | **reparat 2026-08-11 — G nepresat** |
| `content/page-builder` | 25 | 4 | 0 | 0 | 3 | 2 | 1 | cod | da | neverificat |
| `content/pdf-viewer` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | — | nu | neverificat |
| `crm` | 15 | 2 | 5 | 0 | 0 | 0 | 1 | SDUI | da | **verificat** |
| `data/export` | 11 | 2 | 0 | 0 | 2 | 0 | 1 | SDUI | da | **reparat 2026-08-11 — G nepresat** |
| `data/import` | 11 | 3 | 0 | 0 | 3 | 0 | 1 | SDUI | da | **verificat 2026-08-11** |
| `developer/api-docs` | 15 | 4 | 0 | 0 | 1 | 4 | 1 | cod | da | **verificat 2026-08-11** |
| `developer/byod` | 0 | 2 | 0 | 0 | 5 | 0 | 1 | cod | da | neverificat |
| `developer/database` | 0 | 4 | 0 | 0 | 0 | 0 | 1 | cod | da | **verificat** |
| `developer/edge-functions` | 7 | 0 | 0 | 0 | 4 | 0 | 1 | cod | da | neverificat |
| `developer/graphql` | 13 | 2 | 0 | 0 | 2 | 4 | 1 | cod | da | neverificat |
| `developer/validation` | 14 | 2 | 0 | 0 | 3 | 0 | 1 | cod | da | neverificat |
| `developer/views` | 0 | 0 | 0 | 0 | 0 | 0 | 1 | cod | nu | neverificat |
| `ecommerce/store` | 33 | 2 | 0 | 0 | 1 | 0 | 1 | SDUI | da | **verificat** |
| `finance/accounting` | 28 | 4 | 0 | 0 | 1 | 0 | 1 | SDUI | da | **verificat** |
| `finance/banking` | 18 | 4 | 0 | 0 | 2 | 0 | 1 | cod | da | **verificat** |
| `finance/expenses` | 15 | 3 | 0 | 0 | 0 | 0 | 1 | SDUI | da | neverificat |
| `finance/invoicing` | 29 | 9 | 3 | 0 | 4 | 0 | 3 | SDUI | da | **verificat** |
| `finance/quotes` | 16 | 3 | 0 | 0 | 0 | 0 | 1 | SDUI | da | neverificat |
| `finance/subscriptions` | 18 | 4 | 0 | 0 | 0 | 0 | 1 | SDUI | da | **verificat** |
| `forms` | 8 | 2 | 0 | 0 | 1 | 0 | 3 | cod | da | neverificat |
| `geospatial/postgis` | 16 | 2 | 0 | 0 | 2 | 0 | 1 | cod | da | **verificat** |
| `hr/employees` | 32 | 3 | 5 | 0 | 0 | 0 | 1 | SDUI | da | neverificat |
| `hr/leave` | 16 | 2 | 0 | 0 | 0 | 0 | 1 | SDUI | da | neverificat |
| `hr/payroll` | 15 | 3 | 0 | 0 | 0 | 0 | 1 | SDUI | da | neverificat |
| `hr/time-tracking` | 18 | 2 | 0 | 0 | 0 | 0 | 1 | cod | da | neverificat |
| `i18n/translations` | 15 | 2 | 0 | 0 | 4 | 0 | 1 | cod | da | neverificat |
| `integrations/api-connector` | 17 | 2 | 0 | 0 | 1 | 0 | 1 | SDUI | da | neverificat |
| `integrations/migrators` | 7 | 2 | 0 | 0 | 5 | 6 | 1 | SDUI | da | neverificat |
| `operations/assets` | 11 | 3 | 0 | 0 | 0 | 0 | 1 | SDUI | da | **verificat** |
| `operations/inventory` | 20 | 5 | 7 | 0 | 0 | 0 | 1 | SDUI | da | **verificat** |
| `operations/pos` | 15 | 4 | 0 | 0 | 1 | 0 | 1 | cod | da | **verificat** |
| `operations/traceability` | 0 | 3 | 0 | 1 | 0 | 0 | 1 | cod | da | **reparat 2026-08-11 — G nepresat** |
| `projects/helpdesk` | 18 | 2 | 0 | 0 | 0 | 0 | 1 | cod | da | neverificat |
| `projects/management` | 30 | 2 | 0 | 0 | 0 | 0 | 1 | cod | da | neverificat |
| `search` | 6 | 2 | 0 | 0 | 0 | 0 | 1 | cod | da | neverificat |
| `sms` | 6 | 2 | 0 | 0 | 1 | 0 | 1 | cod | da | neverificat |
| `storage/cloud` | 28 | 2 | 0 | 0 | 0 | 1 | 1 | cod | da | neverificat |
| `workflow/approvals` | 17 | 2 | 0 | 0 | 0 | 0 | 1 | cod | da | neverificat |
| `workflow/checklists` | 22 | 5 | 0 | 0 | 0 | 0 | 1 | cod | da | **verificat** |

**Total: 57 extensii · verificate: 22**

Coloane: `catch` = numărul de `.catch(() => …)` (candidați la A2) · `ext` = apeluri către servicii externe · `serv`/`ascult` = servicii publicate și ascultători de evenimente.

---

## Găsiri amânate

Lucruri reale, confirmate prin rulare, pe care am ales deliberat să nu le repar
în aceeași trecere fiindcă schimbă o cale comună şi îşi merită verificarea lor.

### Widget-urile panoului împart o tranzacţie, deci se contaminează

`analytics/dashboard`. Un singur tabel lipsă a produs asta în log:

```
widget count "zv_audit_log" failed: relation "zv_audit_log" does not exist
recent activity failed: current transaction is aborted…
trust "audit_log" failed: current transaction is aborted…
trust "last_backup" failed: current transaction is aborted…
```

`last_backup` citeşte `zv_backups` — un tabel perfect sănătos — şi a raportat
totuşi `null`, adică „nicio copie de siguranţă". O interogare stricată a produs
patru valori false, toate plauzibile.

Etichetele adăugate acum fac cauza vizibilă într-o linie, dar valorile false tot
ajung pe ecran. Reparaţia adevărată e un SAVEPOINT per widget — acelaşi tipar ca
la `emitAsync` în engine — ceea ce cere şi trecerea interogărilor de la paralel
la secvenţial, fiindcă savepoint-urile nu se compun cu instrucţiuni paralele pe
aceeaşi conexiune. Panoul rulează în 76 ms, deci costul e neglijabil.

**A doua instanţă, găsită de atunci:** raportul de cheltuieli din
`compliance/ro/procurement` compune trei interogări analitice exact la fel. O
singură interogare stricată acolo dă trei zerouri false într-un raport de
cheltuieli publice.

Două instanţe schimbă concluzia. Reparaţia — un SAVEPOINT per interogare — **nu
se poate scrie corect în fiecare extensie**: `SAVEPOINT` e valid doar într-un
bloc de tranzacţie, iar o extensie n-are cum să afle dacă rulează în tranzacţia
unei cereri sau pe pool. Gazda ştie. Deci cere un ajutor oferit prin contractul
SDK — ceva de forma `ctx.isolated(label, fn)`, care pune savepoint-ul când există
tranzacţie şi nu face nimic când nu există — nu încă o rescriere per extensie.

Până atunci ambele locuri îşi loghează cauza cu etichetă, deci un zero fals e
diagnosticabil într-o linie în loc să fie invizibil.

### Scorul de calitate — ELIMINAT (decizie de owner, 2026-08-10)

Scos complet: tabelul, ruta `/scores/:collection`, câmpurile din `/summary` şi
`/stats`, jumătatea de scor din verificarea SLA, şi `min_score` din praguri.

Motivul: formula `(critice*10 + erori*5 + avertismente*2 + info*0.5) / înregistrări * 100`
dădea 0 pentru 4 avertismente pe 2 înregistrări şi 92 pentru aceleaşi 4 pe 100.
Numărul spunea mai mult despre mărimea colecţiei decât despre calitatea datelor,
iar nimeni nu putea explica ce înseamnă un 78.

Ştergerea tabelului e sigură fiindcă e **gol pe orice instalare** — scrierea era
detaşată, dormea două secunde şi ateriza pe o tranzacţie închisă, cu câte un
`catch` înăuntru şi în afară. Niciun scor n-a existat vreodată.

SLA-ul nu pierde nimic: verificarea avea deja `if (score && …)`, deci rula
dintotdeauna doar pe `max_critical_issues` şi `max_error_issues` — praguri pe care
le poate apăra oricine, spre deosebire de „scor minim 80".

**Ce urmează, la cerere:** punctaj configurat pe liste de verificare — scheme
multiple per şablon, ponderi per punct **per schemă** (acelaşi punct poate conta
la „siguranţă" şi deloc la „completitudine"), o singură metodă la început, iar
rezultatul stocat împreună cu schema care l-a produs, ca un audit vechi să nu se
schimbe când se schimbă ponderile. Cere master-detail pentru ecranul de
configurare — al treilea lucru care îl aşteaptă.

### `zv_extension_registry (name)` — singura cheie nelărgită

A 61-a din campania de chei, lăsată deliberat. Codul de fuziune din marketplace
suprapune rândurile de tenant peste cele globale, deci e scris pentru rânduri per
firmă; `UNIQUE (name)` le-a interzis dintotdeauna, de unde 55 de rânduri globale
şi 0 per firmă.

Trei motive pentru care nu s-a lărgit odată cu celelalte:

1. `tenant_id` **nu are valoare implicită** pe acest tabel, spre deosebire de
   toate celelalte. Cu `UNIQUE (tenant_id, name)` şi `tenant_id` NULL, cum
   NULL-urile sunt distincte, fiecare activare ar insera un rând nou în loc să-l
   actualizeze.
2. Cinci ţinte `onConflict(oc.column('name'))` ar înceta să se potrivească, iar
   una dintre ele stă sub `.catch(() => {})` — deci eşecul ar fi tăcut, exact pe
   operaţia cea mai importantă din produs.
3. Nu deblochează nimic azi: `requireInstanceAdmin` refuză oricum orice cerere
   al cărei domeniu nu e tenantul implicit.

Se face împreună cu decizia despre activarea per firmă, cu valoarea implicită şi
cu toate cele cinci ţinte, sau deloc. Poarta din CI o are pe listă de excepţii,
cu acelaşi raţionament scris lângă ea.

