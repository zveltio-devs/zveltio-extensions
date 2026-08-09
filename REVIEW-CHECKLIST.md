# Cum se verifică o extensie

Fiecare punct de aici a fost scris pentru că **a eșuat în producție** — nu din
bune intenții. Exemplele sunt reale și au fost găsite pe 2026-08-09, într-o
singură zi de verificare pe un produs care trecuse de teste, CI și review.

Ordinea contează: primele opt se pot verifica în câteva minute și prind
majoritatea. Restul cer citit.

---

## Regula de aur

**Nu crede nimic ce n-ai văzut rulând.** Testele verzi, CI verde și codul care
arată corect au coexistat cu o extensie care raporta „Submitted to ANAF" fără
să trimită nimic, timp de luni.

Când un punct de mai jos zice „verifică", înseamnă *apasă butonul*, nu *citește
funcția*.

---

## A. Minciuni (cele mai grave)

### A1. Valori fabricate care raportează succes

Caută în cod: `Date.now()` folosit ca identificator, `Math.random()` ca id,
`mockResponse`, `// Stub`, `// in production`.

> **Găsit:** trei extensii de conformitate fabricau răspunsul unei autorități.
> e-Factura inventa indexul de încărcare ANAF; SAF-T la fel; e-Transport
> **inventa codul UIT** — cel pe care șoferul e obligat să-l aibă la el și care
> se verifică în trafic. Toate trei scriau starea „transmis" în baza de date și
> răspundeau „Submitted to ANAF".

Un buton lipsă costă o după-amiază. Un buton care raportează un succes pe care
nu l-a obținut costă o amendă, luni mai târziu, cu dovada în propria ta bază de
date că ai fost conform.

**Ce faci:** refuz explicit, cu 501, statusul neschimbat, și un mesaj care spune
ce are omul de făcut în locul funcției lipsă.

### A2. Eșecuri înghițite

Caută: `.catch(() => 0)`, `.catch(() => [])`, `catch {}` în jurul unei scrieri.

> **Găsit:** dashboard-ul raporta zero colecții, zero webhook-uri și zero apeluri
> API pe o instanță care le avea pe toate. Trei interogări numărau tabele
> inexistente, iar `.catch(() => 0)` transforma eroarea într-un zero credibil.
> Arăta ca o instalare goală, nu ca o interogare stricată.

Mai rău: în Postgres, o instrucțiune eșuată **abandonează toată tranzacția**.
Un `catch` în JavaScript nu schimbă nimic — restul cererii eșuează pe aceeași
conexiune. Așa a devenit un nume greșit de tabel dintr-un panou de statistici un
401 fals la autentificare.

**Ce faci:** păstrează valoarea de rezervă dacă nu merită un 500, dar **loghează
eroarea cu numele lucrului care a eșuat.**

---

## B. Cod și schemă (cel mai frecvent)

### B1. Coloane care nu există

```
INSERT INTO <tabel> (...)  vs  information_schema.columns
```

> **Găsit în 10 extensii.** Gestiunea nu putea crea nici produs, nici depozit —
> cele două operații de bază — fiindcă handler-ele scriau `unit_cost`,
> `reorder_quantity`, `address`, iar tabelele aveau `cost_price`, `reorder_qty`,
> `location`.

Se verifică automat, contra unei instanțe cu extensia activă. Nu presupune că
migrația și ruta au fost scrise de aceeași persoană în aceeași zi.

**Cum decizi cine greșește:** dacă schema are conceptul sub alt nume, **schema
are dreptate** — corectează codul. A redenumi coloane care pot avea deja date,
ca să se potrivească unui cod mai nou, e reparație în direcția greșită.

### B2. Migrații nedeclarate

Fișierele din `engine/migrations/` care nu apar în `getMigrations()` **nu rulează
niciodată**.

> **Găsit:** șase migrații la facturare, trei la e-Factura. Pe o instalare nouă,
> toată munca de conformitate ar fi lipsit — fără CUI, fără serii — și extensia
> s-ar fi activat perfect, fără niciun semn.

Invizibil pe orice mașină de dezvoltare, unde coloanele fuseseră adăugate manual.

### B3. Coloane citite și niciodată scrise

Caută o coloană sau un tabel care apare doar în `SELECT`.

> **Găsit de două ori.** `zvd_contact_organizations` — legătura contact-firmă din
> CRM — era interogată în două locuri și scrisă în zero, deci fiecare contact
> apărea fără firmă, pe veci. `reserved_qty` din gestiune: afișat, niciodată
> setat, deci nu exista stare între „promis clientului" și „plecat din depozit".

Proiectat pentru, nefolosit niciodată. Se vede doar dacă te uiți la ambele
direcții.

### B4. Câmpuri acceptate și aruncate

Validatorul le acceptă, `INSERT`-ul nu le conține. Zod taie tăcut cheile
necunoscute.

> **Găsit de patru ori:** `notes` la organizații, „City" într-un formular pentru o
> coloană inexistentă, `notes` la depozit, `catalogue_item` pe linia de factură.

**Ce faci:** acceptă explicit și stochează, sau refuză. Niciodată tăcut.

---

## C. Tipuri la granița cu baza de date

### C1. Datele vin ca `Date`, nu ca șiruri

> **Găsit în trei extensii.** `d.split('T')` pe o coloană `date` → *„d.split is
> not a function"*. Sau interpolat în SQL → *„invalid input syntax for type date:
> Sun Aug 09 2026 00:00:00 GMT+0000"*.

### C2. `NUMERIC` vine ca **șir**

Driverul refuză să piardă precizie tăcut. Deci `.toFixed()` nu există.

> **Găsit:** generatorul UBL crăpa pe fiecare factură reală.

### C3. `as any` la granița rând → tip

Toate trei cazurile de mai sus purtau același comentariu liniștitor despre
faptul că „doar sistemul de tipuri nu e de acord cu runtime-ul". Nu era.

**Ce faci:** o funcție de conversie la graniță, într-un loc, nu apărare în
fiecare câmp.

---

## D. Proprietate și cuplare

### D1. O extensie nu alterează tabelele engine-ului

Tabelele `zv_*` sunt ale engine-ului; `zvd_*` sunt date de utilizator. Engine-ul
refuză migrația și are dreptate.

> **Găsit:** editorul SQL scria în `zv_saved_queries`, tabelul engine-ului pentru
> interogări pe colecții, cu alt model mental.

### D2. O extensie nu migrează tabelul altei extensii

> **Găsit:** ecommerce scria prețuri în `zvd_products`, tabelul gestiunii —
> **corect ca intenție**, un magazin vinde ce ține depozitul — dar cu propriile
> nume de coloane. Moneda a fost adăugată **de gestiune**, fiindcă tabelul e al
> ei.

### D3. Regulile de business nu stau în extensii regionale

> **Găsit, și e cea mai importantă lecție a zilei.** Scăderea din stoc la
> emiterea unei facturi fusese pusă în extensia de facturare **românească**. O
> extensie germană ar fi trebuit s-o rescrie, iar a doua implementare ar fi
> diferit de prima în vreun fel neobservat.

Livrarea e un concept al gestiunii. Facturarea doar o referențiază.

### D4. Dependințele sunt opționale

`ctx.services.get()` întoarce `null` când cealaltă extensie nu e activă.
Facturarea trebuie să meargă fără gestiune; gestiunea fără facturare.

### D5. Serviciile publicate sunt și ele cod

> **Găsit:** `inventory.stock.move` — serviciul prin care alte extensii mișcă
> stocul — insera în coloane inexistente. Orice apel ar fi eșuat. Nimic n-a
> observat, fiindcă nimic nu-l apelase vreodată.

---

## E. Ciclul de viață

### E1. Ascultătorii `async` de evenimente

`emit` e sincron. Un ascultător `async` pornește în cererea curentă și se
termină după ce tranzacția s-a închis.

> **Găsit:** *„Transaction is already committed"*, în propriul `try/catch`, deci
> efectul secundar pur și simplu nu se întâmpla. e-Factura nu draftase niciodată
> nimic, pe nicio instalare.

Folosește `emitAsync` acolo unde ascultătorul scrie în baza de date.

### E2. Reîncărcarea la cald

Ascultătorii înregistrați în `register()` se acumulează dacă `unload` nu-i
elimină.

> **Găsit:** același handler rula de trei ori pentru o factură, după două
> reîncărcări.

### E3. Ordinea rutelor

`/:id` înregistrat înaintea lui `/settings` înghite „settings".

> **Găsit:** ruta de setări ANAF dădea 404, iar fișierul documenta deja capcana
> pentru `/stats`. N-am citit propriul avertisment.

---

## F. Bundle și manifest

### F1. Sursa editată nu ajunge nicăieri fără repack

Runtime-ul încarcă `engine/index.js`, nu `routes.ts`.

> **Ratat de trei ori într-o zi**, inclusiv de mine, după ce știam.

### F2. `extension pack` fără `--first-party`

Marchează extensia drept community și îi injectează `isolation: "worker"` în
manifest. Schimbă cum rulează, tăcut.

### F3. Capabilitățile se declară **și** se aprobă

O capabilitate nouă în manifest nu e acordată automat. Administratorul o aprobă
explicit — asta e proiectat așa.

---

## G. Ce se verifică prin apăsare, nu prin citire

- [ ] Creează obiectul principal. (10 extensii cădeau aici.)
- [ ] Parcurge fluxul complet, nu doar primul pas.
- [ ] Fă-o pe **bază goală**, cu extensia activată din marketplace.
- [ ] Verifică că rândul chiar **există în bază**, nu doar că API-ul a răspuns
      201. *(O factură a returnat 201 cu numărul ei și nu exista o secundă mai
      târziu.)*
- [ ] Deschide pagina și apasă butoanele.
- [ ] Dacă vorbește cu un serviciu extern, vorbește cu el. Validatorul ANAF a
      respins opt reguli pe un XML care „arăta corect".

---

## Cum se folosește

`REVIEW-STATUS.md` ține evidența: ce extensie a fost verificată, după care
puncte, ce s-a găsit.

O extensie „verificată" înseamnă că cineva a parcurs G-ul de mai sus. Nu că a
citit codul.
