# auth/saml — context

Reparat 2026-08-11, pe bază virgină. **G nepresat**: rundă completă de SSO cere
un IdP real care semnează o asertiune, iar aia lipsește. Tot ce se putea apăsa
fără el a fost apăsat.

## Trei blocaje independente, fiecare suficient să omoare tot

Exact tiparul de la [auth/ldap](../ldap/CONTEXT.md), plus unul în plus.

**1. Configul stătea în `zv_settings`.** Tabel de sistem al engine-ului, pe care
`ctx.db` îl refuză (regula D1). `POST /config` răspundea 500; restul rutelor
ziceau „not configured", fiindcă `catch { return null }` din `getSamlConfig`
transforma un tabel refuzat, o capabilitate neaprobată și o decriptare eșuată în
același cuvânt. Mutat în `zvd_saml_config` (migrația 004), cu RLS pe firmă și
preluarea rândului vechi. Reparația **nu** e un grant pe `zv_settings`: grantul e
per tabel, nu per cheie, deci extensia de autentificare ar fi căpătat și
configurația de mail, și pe cea LDAP.

Vechea cheie `zv_settings.key` era globală, fără `tenant_id` — deci a doua firmă
de pe o instanță nu putea avea propriul IdP; l-ar fi suprascris pe al primei.
Aceeași clasă reparată de migrația 003, ratată atunci fiindcă a fost căutată doar
în tabelele `zvd_saml_*`.

**2. `/login`, `/callback` și `/metadata` erau după poarta fail-closed `/ext/*`.**
Toate trei sunt lovite fără sesiune — primele două de utilizatorul care încă nu
s-a autentificat și de IdP-ul care postează asertiunea, al treilea de IdP-ul care
citește metadatele SP. `publicRoutes` în manifest e mecanismul care există fix
pentru asta.

**3. Codul era scris pentru altă versiune majoră de node-saml decât cea pinuită.**
`peerDependencies` cere `^3.1.0`, iar 3.x a scos sufixul `*Async` de pe metodele
care întorc promise-uri. Deci `saml.getAuthorizeUrlAsync` și
`saml.validatePostResponseAsync` erau `undefined`:

- `/login` arunca TypeError — ruta care **începe** SSO;
- `/callback` arunca TypeError pe linia care **validează** asertiunea.

Adică exact cele două rute care constituie funcționalitatea.

## De ce n-a văzut nimeni

`/metadata` folosește `generateServiceProviderMetadata`, singurul apel al cărui
nume nu s-a schimbat între majore. Deci din afară extensia răspundea: dădeai de o
rută care întoarce XML valid și părea configurată prost, nu ruptă.

Și cele trei cauze se ascund una pe alta, în ordine. Nu poți vedea numele greșit
de metodă până nu treci de poartă; nu poți trece de poartă până nu ai config; nu
poți salva config până nu muți tabelul. Fiecare reparație pare că n-a rezolvat
nimic, fiindcă apare imediat următoarea.

## Ce s-a apăsat efectiv

Bază virgină, extensie activată, fără IdP:

| | înainte | acum |
|---|---|---|
| `POST /config` | 500 | 200 |
| `GET /config` | „not configured" | configul, fără cheia privată |
| `GET /metadata` fără sesiune | 401 | 200, XML de SP valid |
| `GET /login` fără sesiune | 401 → 500 | **302** către IdP, cu `SAMLRequest` real |
| `POST /callback` fără sesiune, asertiune falsă | 401 de la poartă | 401 de la validarea SAML |

Cheia privată a SP-ului ajunge pe disc ca `enc:v1:…` și e decriptată la citire
(`/metadata` o folosește). `GET /config` o scoate din răspuns intenționat — nu se
returnează niciodată clientului.

## Ce rămâne pentru G

O asertiune semnată de un IdP real, care să ducă la o sesiune. Fără ea nu se pot
verifica: maparea `mapEmail`/`mapName`, crearea utilizatorului la primul login și
verificarea de `audience` (reparată anterior — `audience` nesetat dezactiva tăcut
verificarea, ceea ce accepta asertiuni emise pentru alt SP).

## Detaliu de reținut

`config` e o coloană `jsonb` în care codul scrie `JSON.stringify(...)`, deci
valoarea e un **șir JSON care conține JSON**, nu un obiect. Citirea tratează
ambele forme, iar migrația 004 normalizează rândul preluat (`jsonb_typeof`).
Funcționează, dar o instalare migrată are obiect și una salvată din UI are șir.
De uniformizat când se atinge următoarea dată.
