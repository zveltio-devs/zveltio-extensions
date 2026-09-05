# Secțiunea 1 — Inventarul de SQL brut

**Verdict: `logged`.** Inventarul e complet și fiecare rând are un răspuns propus.
Nimic nu e reparat: alegerea între (1) rescriere, (2) acordare explicită și
(3) citire de catalog e a proprietarului.

Măsurat pe `/home/liviu/zveltio-extensions` la `master`, cu funcția de politică
importată direct din engine
(`packages/engine/src/lib/extensions/worker-sql-policy.ts`), pe o bază de test
proprie sesiunii (`zv_extsql_s1`). Scriptul de scanare și probele sunt în
scratchpad-ul sesiunii; comenzile sunt reproductibile în §5.

Repo-ul de engine nu a fost atins — nici măcar un `git` de citire care schimbă
arborele. Constatările care sunt de fapt în engine sunt marcate ca atare și
predate sesiunii care lucrează acolo.

Cele cinci constatări de engine au fost **reproduse independent** de sesiunea de
engine. Una dintre prescripțiile mele era greșită (garda pe `executeQuery`); e
corectată în §0.2, cu măsurătoarea care o stabilește.

---

## 0. Trei constatări care schimbă întrebarea

Le pun primele pentru că afectează *ce* trebuie decis, nu doar *cum*.

### 0.1 Poarta reparată păzește o cale pe care nu circulă nimeni

`assertWorkerSqlAllowed` e apelată dintr-un singur loc:
`worker-extension-host.ts:807`, pe puntea worker→host. Puntea aia se folosește
doar de extensiile cu `engine.isolation: "worker"`.

Măsurat pe toate cele 56 de manifeste:

```
$ bun -e '…citește engine.isolation din fiecare manifest.json…'
{ "(default inline)": 56 }
```

**Zero extensii rulează în worker.** Toate merg pe calea *inline*. Poarta nu se
declanșează astăzi pentru niciuna dintre ele.

### 0.2 Gaura reală e pe calea inline, și e deschisă acum

`createRestrictedDb` interceptează doar `QUERY_METHODS`
(`selectFrom`, `insertInto`, `updateTable`, `deleteFrom`, `replaceInto`,
`mergeInto`, `withSchema` — `extension-context.ts:37`). Un `sql` brut nu trece
prin niciunul.

**Unde trece, exact.** Am instrumentat handle-ul cu un proxy care înregistrează
fiecare proprietate atinsă — o dată pentru `sql` brut, o dată pentru query builder:

```
properties a raw sql template touched on the handle: ["getExecutor"]
  executeQuery touched? false
  getExecutor touched?  true
properties the query builder touched:               ["selectFrom"]
```

`RawBuilder.execute()` cere handle-ului executorul (`getExecutor`) și cheamă
`executeQuery` pe **acela**, nu pe handle. O gardă pusă pe `executeQuery` al
handle-ului stă *lângă* cale, nu pe ea; trebuie învelit executorul întors de
`getExecutor`.

*(Prima versiune a raportului descria mecanismul greșit — „ajunge la
`executeQuery` … prin ramura generică `value.bind(target)`" — ceea ce duce la o
reparație care nu prinde nimic. Sesiunea de engine a ajuns independent la aceeași
concluzie, după ce a încercat varianta greșită; măsurătoarea de mai sus e a mea.)

Măsurat pe o bază proprie (`zv_extsql_s1`, schema engine aplicată), cu extensia
`forms` — fără nicio acordare, `allowedTables` gol. Aceeași extensie, același
tabel, două căi:

```
--- path A: query builder (proxied) ---
A: refused — ExtensionSecurityError: Extension "forms" attempted to access table "session" via selectFrom()
--- path B: raw sql, same table, same proxy ---
B: READ — [{"token":"SECRET-BEARER-TOKEN"}]
--- path C: raw sql WRITE to an engine table ---
C: WROTE — user.name is now [{"name":"PWNED"}]
```

Verificarea discriminează: calea A refuză, calea B citește tokenul de sesiune,
calea C scrie în `user`. Deci inventarul de mai jos nu pregătește terenul pentru
o poartă teoretică — pregătește terenul pentru singura poartă care contează.

### 0.3 Poarta refuză tabelele pe care proprietarul le-a acordat deja

`assertWorkerSqlAllowed` nu consultă nici `EXTENSION_TABLE_GRANTS`, nici tabelele
create de migrațiile extensiei. Regula ei e strict „`zvd_*` sau `zv_<ext>_*`".
Comentariul din `register.ts` spune de ce asta nu ține: *„109 din ~300 de tabele
de extensie sunt numite după funcționalitate, nu după folder"*.

Probat direct:

```
REFUSED  operations/traceability  own table, own migration           SELECT * FROM trace_lots WHERE id = $1
REFUSED  communications/mail      own table, own migration           SELECT * FROM zv_mail_messages WHERE id = $1
REFUSED  compliance/ro/efactura   own table, own migration           SELECT * FROM zv_efactura_invoices
REFUSED  analytics/quality        GRANTED in EXTENSION_TABLE_GRANTS  SELECT * FROM zv_quality_scans
REFUSED  developer/validation     GRANTED in EXTENSION_TABLE_GRANTS  SELECT * FROM zv_validation_rules
REFUSED  storage/cloud            GRANTED in EXTENSION_TABLE_GRANTS  SELECT * FROM zv_media_files
```

**Remediul (2) din predare — „intră în `EXTENSION_TABLE_GRANTS`" — nu
funcționează contra acestei porți așa cum e scrisă.** E o reparație de engine, nu
de extensii; o las aici, n-o ating.

Consecința pe cifre: poarta refuză **26** de extensii, nu 18. Dintre ele **19**
sunt refuzate *exclusiv* pentru tabele pe care le creează migrațiile lor proprii.

---

## 1. Cifrele

| | |
|---|---:|
| `sql` tagged templates în surse (fără teste, fără `dist`) | **1222** |
| apeluri `sql.raw(...)` — pe care un scanner de template-uri NU le vede | **35** |
| extensii refuzate de poartă așa cum e scrisă | **26** |
| … dintre ele, refuzate doar pe tabele proprii / acordate | **13** |
| **extensii cu atingeri reale în afara spațiului propriu** | **13** |

Predarea spune „18" și enumeră 12 în tabel. Niciunul din cele două numere nu se
reproduce; măsurătoarea mea dă 13 extensii cu atingeri reale, iar lista diferă în
ambele direcții (vezi §3).

O capcană de scanare, semnalată fiindcă e exact clasa despre care avertizează
`register.ts` („citea PROZĂ"): un rând de JSDoc care se termină cu
`` `migrations/001_initial.sql` `` pune un backtick imediat după `sql`, iar
regex-ul de tag îl prinde. Fără eliminarea comentariilor, `content/pages` era
raportată ca atingând un tabel numit `this`. Scriptul elimină acum comentariile
înainte de extragere.

---

## 2. Inventarul, cu răspunsul propus

Legendă: **(1)** se rescrie · **(2)** are nevoie real, cere acordare ·
**(3)** citire de catalog.

### (1) Se rescriu — 7 extensii, 3 helper-e mici acoperă tot

| extensie | tabel | unde | de ce se rescrie |
|---|---|---|---|
| `ai` | `user` | `engine/routes/ai-analytics.ts:186` | `LEFT JOIN "user" usr ON usr.id::text = u.user_id::text` — doar pentru `COALESCE(usr.name, u.user_id)`. Un nume de afișat. |
| `storage/cloud` | `user` | `engine/lib/trash.ts:72`, `engine/lib/file-versions.ts:123` | idem — `LEFT JOIN "user" u` pentru `u.name AS deleted_by_name` / `uploaded_by_name`. |
| `analytics/dashboard` | `zv_settings` | `engine/routes.ts:247` | `SELECT value FROM zv_settings WHERE key IN ('company_name',…)` — un titlu pe dashboard. |
| `communications/mail` | `zv_settings` | `routes.ts:1457,1524,1578,1606,1628` · `lib/imap-client.ts:126` · `index.ts:56` | de 7 ori exact `SELECT value FROM zv_settings WHERE key = 'mail'` — propria configurație, ținută în tabelul motorului. |
| `content/pages` | `information_schema.columns` | `engine/public-seo.ts:86` | „are colecția asta coloana `slug`?" |
| `geospatial/postgis` | `information_schema.tables` | `engine/routes.ts:37` | „există tabelul `zvd_<colecție>`?" |
| `integrations/migrators` | `information_schema.columns` | `engine/routes.ts:184` | „ce coloane are `zvd_<țintă>`?" |

Trei helper-e le închid pe toate șapte — cu o rezervă: `analytics/dashboard`
apare aici doar pentru `zv_settings`. Restul atingerilor ei (`user`,
`zv_tenant_users`, `zv_audit_log`, `pg_class`, `zv_backups`) sunt statistici de
platformă și **nu** se închid prin rescriere; vezi nota de la finalul lui (2).

Trei helper-e:

- **`resolveUserNames(ids) → Map<id, name>`** — închide `ai` și `storage/cloud`.
  Ambele vor un nume de afișat, nu acces la tabela de identități.
- **Un accesor de setări cu namespace** (`ctx.settings.get('mail')`) — închide
  `communications/mail` (7 situri) și `analytics/dashboard`.
  **Precedentul există deja în repo:** `auth/saml` și-a mutat configurația din
  `zv_settings` în `zvd_saml_config` exact din motivul ăsta — vezi comentariul de
  la `auth/saml/engine/routes.ts:49`: *„`zvd_saml_config`, nu `zv_settings`.
  Vezi migrația 004: `zv_settings` e tabel de sistem și `ctx.db` îl refuză, deci
  fiecare citire de aici arunca."* Deci una din cele trei căi e deja bătută:
  fiecare extensie își ține configurația la ea.
- **`describeCollection(name) → { exists, columns }`**, limitat la `zvd_*` —
  închide `content/pages`, `geospatial/postgis` și `integrations/migrators`.
  Toate trei pun aceeași întrebare îngustă despre forma propriilor date permise,
  și o pun catalogului doar fiindcă nu există API.

### (2) Au nevoie real — 4 extensii

| extensie | tabele | de ce nu se poate rescrie |
|---|---|---|
| `compliance/gdpr` | `user`, `session`, `account`, `twoFactor`, `zv_api_keys`, `zv_notifications`, `zv_audit_log` | E *implementarea* dreptului la ștergere (`engine/routes.ts:158–201`). A șterge persoana vizată **înseamnă** a șterge rândurile ei de identitate. Nicio rescriere nu evită asta. Export-ul (`:91–95`) e simetric. |
| `auth/saml` | `user`, `session` | Provizionare SSO + invalidarea sesiunilor anterioare la login. |
| `auth/ldap` | `user`, `session`, `zv_audit_log` | Idem, plus audit de login reușit/eșuat. |
| `auth/scim` | `user`, `session`, `account`, `zv_tenants`, `zv_tenant_users` | SCIM **este** protocolul de provizionare de utilizatori. 12 situri pe `user`, 7 pe `zv_tenant_users`. |

Nuanță pentru cele trei de auth: nu au nevoie de *tabele*, au nevoie de **trei
operații**. Engine-ul expune deja `internals.createBetterAuthSession` — și
`auth/saml:234` și `auth/ldap:291` o folosesc. Lipsesc:

- `provisionUser({ email, name }) → user` (saml, ldap, scim)
- `revokeUserSessions(userId)` (saml, ldap, scim, gdpr)
- `writeAuditLog(entry)` (ldap, gdpr)

Cu ele, `auth/saml` scade la **zero** atingeri directe, `auth/ldap` la zero,
`auth/scim` rămâne cu `zv_tenants`/`zv_tenant_users` (provizionare de firme —
acolo acordarea explicită e răspunsul corect), iar `gdpr` rămâne cu ștergerea,
care e ireductibilă. Recomandarea mea: **helper-e pentru auth, acordare doar
pentru `gdpr` și pentru partea de tenancy a lui `scim`.**

Două cazuri separate, care nu sunt în tabelul din predare:

- `compliance/gdpr` → **`zv_approval_requests`** (`engine/routes.ts:95`) —
  tabel al *altei extensii* (`workflow/approvals`), citit direct, învelit în
  `rowsOrEmptyIfTableAbsent`. Acces între extensii; ar trebui să treacă printr-un
  serviciu, nu printr-o citire de tabel.
- `storage/cloud` → **`zv_media_versions`** (5 situri) și
  **`zv_media_favorites`** (`routes.ts:259`). `zv_media_versions` e tabel
  declarat de engine și **nu e** în cele patru acordări pe care `storage/cloud`
  le are deja. Omisiune în lista de acordări, de aceeași formă cu cele patru
  reparate anterior.
- `analytics/dashboard` → **`user`** (`routes.ts:296,303`),
  **`zv_tenant_users`** (`:297,306`), **`zv_audit_log`** (`:335,339`),
  **`pg_class`** (`:320`) și **`zv_backups`** (`:373`, prin `sql.raw`). Toate
  sunt numărători pentru un dashboard: câți utilizatori, câți admini, câte
  intrări de audit azi, ce mărime au colecțiile, când s-a făcut ultimul backup.
  Niciuna nu e dată de extensie, și niciuna nu se poate rescrie ca să nu atingă
  tabelul. Răspunsul curat aici nu e nici (1) nici o acordare de tabele, ci **un
  serviciu de statistici expus de engine** — extensia are nevoie de *cifre*, nu
  de acces la `user`.

### (3) Citire de catalog — 1 extensie, și nu e o citire

| extensie | ce face |
|---|---|
| `developer/database` | 16 relații de catalog citite (`information_schema.tables/columns/triggers`, `pg_class`, `pg_namespace`, `pg_proc`, `pg_type`, `pg_enum`, `pg_policy`, `pg_trigger`, `pg_roles`, `pg_auth_members`, `pg_extension`, `pg_available_extensions`, `pg_attribute`, `pg_language`) |

**Predarea o clasează la „răsfoire de schemă". Nu e.** Cele 17 apeluri
`sql.raw(...)` din același fișier — pe care un scanner de tagged templates nu le
vede — scriu:

```
routes.ts:168  await sql.raw(definition)                          CREATE FUNCTION (definition = input de utilizator)
routes.ts:228  await sql.raw(definition)                          CREATE TRIGGER
routes.ts:299  CREATE TYPE … AS ENUM                              routes.ts:323  DROP TYPE … CASCADE
routes.ts:367  CREATE EXTENSION                                   routes.ts:379  DROP EXTENSION … CASCADE
routes.ts:440  CREATE ROLE (parts.join(' '))                      routes.ts:452  DROP ROLE
routes.ts:506  ALTER TABLE … ENABLE/DISABLE ROW LEVEL SECURITY
routes.ts:508  ALTER TABLE … FORCE/NO FORCE ROW LEVEL SECURITY
routes.ts:531  CREATE POLICY (sql_str)                            routes.ts:545  DROP POLICY
```

Extensia asta poate **dezactiva RLS pe orice tabel** și **crea roluri de bază de
date**. Nu e o categorie de citire; e o consolă DBA. Răspunsul propus: **nu (3),
ci o capabilitate proprie, cu consimțământ explicit și tier de încredere
`first-party`** — și, separat de campania asta, o revizuire a rutelor ei de
scriere. Ambele decizii sunt ale proprietarului.

Restul citirilor de catalog (`content/pages`, `geospatial/postgis`,
`integrations/migrators`, plus `pg_class` la `analytics/dashboard:320` pentru o
estimare `reltuples`) sunt înguste și intră la (1) prin `describeCollection`.

**Precizare despre `sql.raw`.** Ocolește *scanarea statică* — inventarul ăsta nu
poate vedea `FROM ${sql.raw(table)}` de la `analytics/dashboard:373`. Nu ocolește
o gardă de **runtime** pe `getExecutor`: acolo textul e deja compilat, cu numele
de tabel rezolvat. Limita e a inventarului, nu a reparației.

---

## 3. Diferențe față de tabelul din predare

Le enumăr fiindcă tabelul din §3 al predării o să fie citit ca inventar.

**Lipsesc din predare:**

| extensie | tabel | unde |
|---|---|---|
| `ecommerce/store` | — refuz de *formă*, nu de tabel | `engine/routes.ts:301` (`SAVEPOINT`), `:312` (`ROLLBACK TO SAVEPOINT`) |
| `compliance/gdpr` | `zv_approval_requests` | `engine/routes.ts:95` |
| `storage/cloud` | `zv_media_versions`, `zv_media_favorites` | `lib/file-versions.ts:29,80,96,123`, `lib/trash.ts:103`, `routes.ts:259` |
| `analytics/dashboard` | `zv_backups` | `engine/routes.ts:373`, prin `sql.raw(table)` |

**Prezent în predare, nereprodus:** `analytics/dashboard` e listată cu
`zv_audit_log`, `zv_settings`, `zv_tenant_users`, `user`, `pg_class` — toate
confirmate. Dar predarea nu menționează că 19 extensii pică pe tabele proprii,
ceea ce e majoritatea impactului.

**Asimetria de la `SAVEPOINT`** (probată, nu citită):

```
REFUSED  SAVEPOINT canonical_product
ALLOWED  RELEASE SAVEPOINT canonical_product
REFUSED  ROLLBACK TO SAVEPOINT canonical_product
```

`RELEASE` nu e în `CODE_BEARING_FORMS`, `SAVEPOINT` și `ROLLBACK` sunt. Perechea
e incoerentă. Justificarea din comentariu — *„o instrucțiune care face COMMIT
scapă din wrapper"* — e adevărată pentru `COMMIT`/`ROLLBACK` simplu, dar un
savepoint **dintr-o tranzacție existentă nu o poate încheia**. Regula e prea
largă, iar victimele sunt tratare de erori ordinară: `ecommerce/store:301`,
`compliance/gdpr:189` (prin `sql.raw`), `ai/routes/ai.ts:58`,
`communications/mail/lib/sieve.ts:272`. Reparație de engine.

---

## 4. Două defecte vii în `auth/saml`, verificate

Niciunul nu e despre `sql` brut, dar amândouă ies din aceeași măsurătoare.
**Ordinea în care se manifestă e inversă față de ce am scris în prima versiune a
raportului** — o corectez mai jos, cu măsurătoarea.

### 4.1 SSO nu poate trece de validare, în NICIUNUL din cele două fluxuri

`createSamlInstance` (`engine/saml-provider.ts:38`) trimite
`validateInResponseTo: 'ifPresent'`. Ăsta e un idiom **node-saml 4.x**. Extensia
pinuiește `^3.1.0`, iar în 3.1.2 opțiunea e un **boolean**:

```
node_modules/node-saml/src/saml.js:39
  validateInResponseTo: options.validateInResponseTo || false
```

Măsurat pe instanța pe care o construiește chiar extensia:

```
options.validateInResponseTo = "ifPresent" -> truthy? true
```

Orice valoare truthy înseamnă „cere ÎNTOTDEAUNA InResponseTo" (`saml.js:706-718`).
Am mintit un `SAMLResponse` real, semnat RSA-SHA256 cu un certificat self-signed,
cu `AudienceRestriction`, `Conditions` și `SubjectConfirmationData` corecte, și
l-am dat funcției reale a extensiei:

```
node-saml REJECTED: InResponseTo is missing from response
```

Deci **fluxul IdP-inițiat** pică întotdeauna. Ruta prinde asta la
`engine/routes.ts:215-217` și răspunde **401** `SAML validation failed: …`.

**Fluxul SP-inițiat** pică și el, din alt motiv. `cacheProvider` e un
`InMemoryCacheProvider` nou pentru **fiecare instanță** (`saml.js:41`), iar
extensia construiește o instanță nouă la fiecare cerere — `:174` pentru `/login`,
`:213` pentru `/callback`. Măsurat:

```
same cacheProvider object? false
keys cached on the /login instance : 1
keys cached on the /callback instance: 0
```

Id-ul cererii salvat la `/login` nu există în cache-ul instanței care validează la
`/callback` ⇒ `InResponseTo is not valid` ⇒ tot 401.

Aceeași clasă cu bug-ul pe care comentariul din `saml-provider.ts:62-69` îl
documentează deja (`validatePostResponseAsync` → `validatePostResponse`, 3.x vs
4.x). Al doilea din aceeași familie, nereparat.

### 4.2 Provizionarea utilizatorului e refuzată de proxy — dar e MASCATĂ

`auth/saml` și `auth/ldap` creează utilizatorul SSO prin **query builder**:

- `auth/saml/engine/routes.ts:124` și `:137` — `dbh.selectFrom('user')`
- `auth/ldap/engine/routes.ts:138` și `:154` — `dbh.selectFrom('user')`

`dbh` e `db`, destructurat din `ctx` la `auth/saml:141` — deci proxy-ul restrâns.
Măsurat, cu `allowedTables` construit din migrațiile reale ale fiecărei extensii:

```
auth/saml    allowed:{zvd_saml_login_log,zvd_saml_idp_metadata,zvd_saml_attribute_mappings,zvd_saml_config}
   query-builder: user=REFUSED  session=REFUSED  account=REFUSED  zv_tenant_users=REFUSED  zv_audit_log=REFUSED
auth/ldap    allowed:{zvd_ldap_login_log,zvd_ldap_group_mappings,zvd_ldap_ip_allowlist,zvd_ldap_config}
   query-builder: user=REFUSED  session=REFUSED  account=REFUSED  zv_tenant_users=REFUSED  zv_audit_log=REFUSED
```

`findOrCreateSsoUser` e apelată la `auth/saml:224` fără try/catch. Am verificat și
ce face stratul de montare cu eroarea — montat exact ca la `register.ts:575`
(`subApp.onError(problemOnError)`), cu un `ExtensionSecurityError` real:

```
status: 500
content-type: application/problem+json
body: {"type":"about:blank","title":"Internal Server Error","status":500,
       "code":"internal_error","detail":"An unexpected error occurred.", …}
control (no throw) status: 200
```

Deci nimic de deasupra nu îl convertește în altceva, iar cauza reală („attempted
to access table user") e **ștearsă din răspuns** — rămâne doar în logul serverului.

**Corectura:** în prima versiune am scris că SSO dă 500 pe callback. Nu dă: dă
**401**, fiindcă §4.1 se manifestă înainte. Defectul din §4.2 e real și dovedit,
dar **inaccesibil** până se repară §4.1 — un 500 care apare abia după ce repari
altceva. Ironia formei rămâne: `INSERT`-ul cu SQL brut de la `:132` ar trece;
`selectFrom` de deasupra lui nu.

**Ce NU am verificat:** n-am testat contra unui IdP comercial real (Okta, Entra,
Keycloak) — doar contra unui `SAMLResponse` pe care l-am semnat eu. Un IdP real
trimite `InResponseTo` în fluxul SP-inițiat, ceea ce schimbă mesajul de eroare
(`not valid` în loc de `missing`) dar nu și rezultatul, fiindcă demonstrația de
cache per-instanță de mai sus nu depinde de cine a emis răspunsul.

## 5. Cum se reproduce

```bash
# 1. Bază proprie + schema engine
createdb zv_extsql_s1
for f in $(ls /home/liviu/zveltio/packages/engine/src/db/migrations/sql/*.sql | sort -V); do
  psql "postgresql://postgres:postgres@localhost:5432/zv_extsql_s1" -q -f "$f"
done

# 2. Scanarea (script în scratchpad-ul sesiunii)
cd /home/liviu/zveltio-extensions && bun scan2.ts

# 3. SAML: certificat de IdP de test + un SAMLResponse semnat real
openssl req -x509 -newkey rsa:2048 -keyout idp.key -out idp.crt -days 2 -nodes -subj "/CN=test-idp"
#    apoi mint-saml.ts semnează assertion-ul cu xml-crypto și îl dă
#    funcției REALE a extensiei (createSamlInstance / validateSamlResponse)
```

Notă: `001_initial.sql` aplicat cu `psql -f` se oprește la final pe
`relation "_sensitive" does not exist` — cele 70 de tabele relevante sunt create
înainte de asta, deci măsurătorile de mai sus stau. Nu am investigat; nu e pe
drumul secțiunii.

---

## 6. Ce rămâne de decis (proprietar)

1. Se aplică politica pe calea **inline**, învelind executorul întors de
   `getExecutor` (NU `executeQuery` — vezi §0.2)? Fără asta, gaura rămâne
   deschisă pentru toate cele 56.
2. Politica trebuie să consulte `EXTENSION_TABLE_GRANTS` **și** tabelele create
   de migrațiile extensiei. Altfel 19 extensii pică pe propriile date.
3. Cele trei helper-e (`resolveUserNames`, accesor de setări, `describeCollection`)
   — se fac? Ele mută 7 din 13 extensii la (1).
4. `developer/database` — capabilitate proprie, sau se restrânge?
5. `SAVEPOINT` — se scoate din `CODE_BEARING_FORMS` (păstrând `COMMIT`/`ROLLBACK` simplu)?
6. `auth/saml` §4.1 (`validateInResponseTo` + cache per-instanță) — PR separat,
   în repo-ul de extensii. Blochează SSO complet, în ambele fluxuri.
7. `auth/saml` / `auth/ldap` §4.2 (`selectFrom('user')`) — același PR sau unul
   următor; nu se poate testa până nu trece 6.
8. `analytics/dashboard` — serviciu de statistici în engine, sau acordare?

Punctele 1, 2 și 5 sunt reparații de **engine**. Le-am scris aici, nu le-am atins.
