# LDAP / Active Directory — context

**Presat 2026-08-10 (era RUPT). Reparat și re-presat 2026-08-11 — 17/17 verificări
trec pe bază complet nouă**, cu extensia activată din marketplace și cu bundle-ul
împachetat, nu cu sursa.

Server folosit: un LDAP minimal scris de mână (bind + search, BER), fiindcă pe
mașina asta nu există docker/podman. Vezi „Ce NU s-a verificat" la final — **de
aceea starea în `REVIEW-STATUS.md` e `reparat — G nepresat`, nu `verificat`.**

---

## Ce era rupt și de ce n-a văzut nimeni

Trei blocaje independente, fiecare suficient singur ca să omoare toate rutele.
Extensia nu putea autentifica pe nimeni, pe nicio instalare. Toate trei sunt
reparate; le las scrise fiindcă tiparul se repetă în alte extensii.

### 1. Configul stătea în `zv_settings` — tabel al engine-ului

`ctx.db` refuză tabelele de sistem (regula D1):

```
Extension "auth/ldap" attempted to access system table "zv_settings" via selectFrom().
```

`POST /config` răspundea 500; restul spuneau „not configured".

**Reparat** prin migrația `004_config_own_table.sql`: configul stă acum în
`zvd_ldap_config`, tabelul extensiei, cu RLS pe tenant. Migrația preia
automat o configurație veche din `zv_settings`, dacă există.

**Nu** am cerut un grant pe `zv_settings` în engine, deși ar fi fost o linie:
grant-ul e per TABEL, nu per cheie, deci extensia de autentificare ar fi căpătat
acces la configurația de mail, la cea SAML și la orice altă setare de instanță.

> **Același tipar, nepresat:** `auth/saml` și `developer/api-docs` fac tot
> `selectFrom('zv_settings')` cu Kysely. Aproape sigur rupte identic.
> `analytics/dashboard` și `communications/mail` scapă doar fiindcă folosesc SQL
> brut (tagged template) — **proxy-ul restrictiv prinde DOAR metodele Kysely**,
> nu `sql\`\``. Asta e și motivul pentru care scrierile în `zv_audit_log` de aici
> au funcționat mereu.

### 2. `/login` era în spatele porții `/ext/*` — trebuia să fii logat ca să te loghezi

Manifestul nu declara `publicRoutes`, iar poarta fail-closed
(`middleware/extension-auth-gate.ts`) cere sesiune pentru orice sub `/ext/<name>/`.
Singurul om care are nevoie de ruta aia e exact cel care n-are sesiune.

**Reparat**: `"publicRoutes": ["/login"]` în manifest. Verificat că **doar**
`/login` s-a deschis — `GET/POST /config` și `/test` dau tot 401 anonim.

> `auth/saml` are aceeași lipsă.

### 3. `ldap://` nu se putea conecta NICIODATĂ — clientul forța TLS

`ldapts` decide transportul așa:

```js
this.secure = isSecureProtocol || !!this.clientOptions.tlsOptions;
```

iar `ldap-provider.ts` pasa **mereu** `tlsOptions` — și `{}` e truthy. Deci pe un
URL `ldap://` clientul trimitea un ClientHello TLS către un port care vorbește
LDAP în clar. Văzut pe fir, primii octeți de la engine:

```
16 03 01 00 df 01 00 00 db 03 03 ...     ← TLS handshake, nu LDAPMessage
```

...și „Connection timeout" după exact 10s. Placeholder-ul din UI e literalmente
`ldap://ldap.example.com:389`, adică produsul recomanda singura configurație care
nu putea merge. **Bugul ăsta nu se vedea din citit codul** — doar punând un
server pe fir și uitându-mă la octeți.

**Reparat**: `tlsOptions` se trimite doar pentru `ldaps://`, și doar ca să relaxeze
verificarea. Ambele transporturi verificate acum.

**Legat, tot reparat:** manifestul cerea `ldapts: ^4.2.6`; instalat și împachetat
era **7.4.0**. Acum cere `^7.4.0`.

### 4. Un singur `catch` făcea trei rute să mintă

```ts
} catch { return null; }   // în getLdapConfig
```

Înghițea orice — refuz de tabel, capabilitate neaprobată, eșec de decriptare —
și totul ieșea ca „nu e configurat", trimițând administratorul să reintroducă o
configurație care era deja acolo. Exact capcana de la SCIM: același simptom,
direcția greșită.

**Reparat**: `null` înseamnă acum un singur lucru — nu s-a salvat nimic. Orice
altceva aruncă `LdapConfigUnreadable` și iese ca 500 cu cauza. Cu
`granted_capabilities='[]'`, toate rutele spun acum:

```
Stored LDAP configuration could not be read: Extension "auth/ldap" used
ctx.internals.decryptSecret, which needs the "secrets" capability. Its manifest
declares it, but no administrator has approved it… Approve with
POST /api/marketplace/auth/ldap/approve-capabilities
```

### 5. Nu puteai re-salva configul fără să retastezi parola de bind

`GET /config` scoate `bindPassword` (corect). Deci formularul îl trimitea înapoi
gol, iar `z.string().min(1)` îl refuza cu un 400 **fără `detail`, fără numele
câmpului**. Schimbai bifa de TLS, primeai 400 fără explicație.

**Reparat**: câmp gol sau absent = „păstrează ce era", convenția pe care o
folosește `compliance/ro/efactura` pentru parola certificatului. Doar prima
salvare n-are ce păstra, și aia spune explicit ce lipsește.

### 6. Configul era unul singur pe toată instanța

`zv_settings` n-are `tenant_id` — cheia primară e `key` singur. A doua firmă de pe
o instanță partajată nu putea avea propriul director.

Migrația 003 lărgise cheile pe `zvd_ldap_group_mappings` și `zvd_ldap_ip_allowlist`
— **exact cele două tabele pe care nu le citește nimeni** — și ratase tocmai
configul, fiindcă a fost căutat doar în tabelele `zvd_ldap_*`.

**Reparat** ca efect al lui (1): `zvd_ldap_config` are `PRIMARY KEY (tenant_id)`,
deci o configurație per firmă.

---

## ⚠️ DESCHIS — decizie de owner, NEreparat

**Cele trei tabele `zvd_ldap_*` originale sunt moarte: zero citiri, zero scrieri**,
nicăieri — nici în rute, nici în bundle, nici în engine, nici în studio. Fără
pagină, fără chei i18n, fără pomenire în docs.

- **`zvd_ldap_ip_allowlist` este un control de securitate care nu există.** Nimic
  nu-l citește, deci restricția de IP nu se aplică. Nu e o afișare greșită — e o
  promisiune de securitate fără implementare.
- `zvd_ldap_group_mappings` — maparea grup LDAP → rol Zveltio, niciodată aplicată.
  Orice utilizator din director intră cu `role = 'member'`.
- `zvd_ldap_login_log` e înlocuit de facto: rutele scriu în `zv_audit_log`.

Nuanță care contează la decizie: **nu există niciun UI prin care un administrator
să creadă că le-a configurat** — ar trebui să facă `INSERT` de mână. Dar oricine
citește schema sau tipurile Kysely generate poate presupune rezonabil că merg.

**Nu le-am atins**: „implementezi" vs. „ștergi tabelul" e o decizie de securitate,
nu curățenie.

---

## Ce merge, verificat pe fir

17/17, pe bază nouă, cu bundle-ul împachetat
(`scratchpad/verify.sh` din sesiunea de reparare):

- bind cu contul de serviciu → search → re-bind ca DN-ul utilizatorului
- **login anonim** peste `ldap://` ȘI `ldaps://`
- sesiunea emisă chiar autentifică — folosită pe `/api/auth/get-session`
- parolă greșită → 401; ambele rânduri de audit aterizează în `zv_audit_log`
- a doua autentificare invalidează prima sesiune
- parola de bind: `enc:v1:` la repaus, niciodată returnată de `GET /config`
- utilizatorul nou primește `role = 'member'`, nu ceva privilegiat

## Ce NU trebuie „reparat"

Verificarea explicită a lui `createBetterAuthSession` la pornire, cu mesajul
despre nepotrivire de versiune, e **intenționată** — e poarta care lipsea în
iulie. Nu dă fals pozitiv când capabilitatea lipsește: `gateInternals` întoarce
un Proxy cu o *funcție care aruncă la apel*, adică truthy, deci extensia se
încarcă normal și refuzul vine la apel, unde trebuie.

## Capcane plătite la reparare

- **`disable` + `enable` NU reîncarcă octeții bundle-ului.** Am pierdut timp
  crezând că o reparație n-a avut efect; modulul vechi era în cache. **Repornește
  engine-ul** ca să testezi un bundle nou.
- **`extension pack` fără `--first-party` îți injectează `isolation: "worker"` în
  manifest** și îl LASĂ acolo — o rulare ulterioară cu `--first-party` nu-l scoate.
  Verifică blocul `engine` după fiecare pack.
- **`::jsonb` pe un parametru șir e no-op.** Driverul leagă șirul ca valoare JSON,
  deci rândul ajunge să conțină `"{\"url\":…}"` — un șir care conține JSON. Se
  scrie `::text::jsonb`. Codul vechi avea exact bugul ăsta și de-aia citirea
  trebuia să facă `JSON.parse` pe ce venea din `jsonb`.

## Ce NU s-a verificat

- **Un director real.** Serverul meu implementează doar `BindRequest`,
  `SearchRequest`, `UnbindRequest`. Netestate: apartenența la grupuri, referrals,
  rezultate paginate, atributele specifice AD, `sAMAccountName`, StartTLS.
- **Certificat valid.** Testul `ldaps://` a mers cu self-signed și
  `tlsVerify: false`. Ramura `tlsVerify: true` cu lanț de încredere real n-a fost
  exersată — și tocmai ea e calea din producție.
- **Multi-tenant la autentificare** — instanța de probă era single-tenant, deci
  n-am putut distinge poarta de membership. Tabelul e cheiat pe `tenant_id`, dar
  care tenant se rezolvă la un `/login` anonim n-a fost pus la încercare.
