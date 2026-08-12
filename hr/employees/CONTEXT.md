# hr/employees — context

Verificat 2026-08-11, pe bază virgină. Tot ciclul de viață trece: angajat,
departament, poziție, contact de urgență, salariu, onboarding, ciclu de
performanță + evaluare + închidere, încetare, istoric.

Extensia **nu avea defecte de integrare**. Are lipsuri de funcționalitate, ceea
ce e altceva — vezi secțiunea finală.

## Cine dispărea din organigramă

`GET /org-chart` pornea recursiv din `manager_id IS NULL AND status = 'active'`,
iar recursia ajunge la oameni **doar prin managerul lor**. Deci un angajat activ
al cărui manager a plecat din firmă nu era nici rădăcină (are `manager_id`), nici
accesibil (managerul lui nu e în arbore) — și **dispărea complet din
organigramă**. Tăcut: pagina pur și simplu afișa mai puțini oameni.

Nu e caz-limită. Se întâmplă la fiecare plecare a unui șef, tuturor celor care îi
raportau, până observă cineva și reatribuie.

Măsurat: 4 angajați activi, 3 pe organigramă.

Rădăcina e acum „fără manager **activ**". Orfanii apar la nivelul de sus, ceea ce
e și randarea onestă — sunt exact oamenii a căror linie de raportare are nevoie
de o decizie.

Verificat în ambele sensuri, fiindcă reparația putea la fel de bine să
aplatizeze tot: după fix, 4 din 4 apar, orfanul la depth 0, iar o linie reală de
raportare între doi oameni activi rămâne la depth 1.

Garda anti-ciclu (`NOT (e.id = ANY(org.path))`) ține — am creat intenționat A→B→A
și interogarea răspunde fără să se blocheze. Dar **API-ul acceptă ciclul**: nimic
nu refuză „raportezi la propriul tău subaltern". De reparat separat.

## Identificatorul național — verificat de țară, nu de acest modul

`national_id` era text liber, deci `9999999999999` — luna 99, ziua 99 — intra
liniștit.

**Prima reparație a fost greșită ca direcție**: am pus validarea de CNP direct
aici, ceea ce făcea modulul de HR să se potrivească unei singure țări. Un CNP, un
NI number britanic și un social security number nu au nimic în comun în afară de
coloană.

Acum `hr/employees` întreabă registrul de servicii — `identity.nationalId` — și
aplică ce găsește. Implementarea românească stă în `compliance/ro/documents`, care
oricum lucrează cu identificatori românești. Nimic înregistrat înseamnă nicio
verificare de format: o instanță din altă țară nu e certată de o regulă scrisă
pentru altcineva.

Căutarea se face **per cerere**, deci o extensie de țară activată după HR se
aplică imediat, fără repornire. Verificat exact așa:

| | fără extensia RO | cu ea |
|---|---|---|
| `AB123456C` (britanic) | **201** | — |
| `9999999999999` | — | **400** |
| CNP valid | — | **201** |

**Capcană de metodă:** primul CNP „valid" cu care am testat era inventat de mine
și a fost corect refuzat. Dacă rulam doar testul negativ, aș fi raportat succes.
Controlul pozitiv nu e formalitate.

## Contractul e acum o entitate (2026-08-11)

Ce lega un om de firmă erau `hire_date`, `end_date`, `employment_type` și
`salary`, plate pe `zvd_employees`. Cu ele nu se poate reprezenta nimic din ce
conține un dosar de personal: durată determinată prelungită prin act adițional,
trecere de la 4 la 8 ore, suspendare pentru creșterea copilului și revenire, al
doilea contract la aceeași firmă, sau pur și simplu **ce** s-a schimbat la 1
aprilie și pe ce document semnat.

Trei tabele — `zvd_employment_contracts`, `zvd_contract_amendments`,
`zvd_contract_suspensions` — și rutele care le mișcă.

**Neutru față de țară**, cum cere regula: `contract_type` are cele două forme
care există peste tot, norma e în ore pe săptămână (nu „normă întreagă"), iar
temeiul încetării e un **cod liber** al cărui vocabular îl aduce o extensie de
țară, ca la `identity.nationalId`. Un cod necunoscut e acceptat — o instanță nu
trebuie să aștepte o extensie ca să poată încheia un contract.

**Câmpurile plate rămân, sincronizate din contractul activ.** `hr/payroll`
citește `zvd_employees.salary` la fiecare generare de stat; ștergerea coloanelor
acum ar rupe salarizarea în tăcere. Contractul e sursa de adevăr, câmpurile sunt
proiecția pentru consumatorii de azi. Ștergerea lor e pasul doi.

Migrația preia automat un contract pentru fiecare angajat existent cu dată de
angajare — altfel o instalare veche ar arăta zero contracte pentru oameni care
lucrează de ani de zile.

### Două lucruri prinse la presare, nu la citire

**Actul adițional cădea în tăcere.** Inserarea în istoricul salarial folosea
`created_by`, dar coloana e `changed_by` — iar eu o înfășurasem în `.catch()`
„ca să nu blocheze actul". Postgres nu lasă o cerere să continue după o
instrucțiune eșuată, deci `.catch()` n-a conținut nimic: a ascuns cauza și a
doborât următoarele două instrucțiuni cu „current transaction is aborted".
**Exact capcana reparată dimineață în engine, comisă de cine tocmai o reparase.**
Acum inserarea e negardată: dacă eșuează, actul eșuează zgomotos.

**Cine termină un contract și începe altul rămânea „plecat".** Încetarea marchează
omul `terminated`, ceea ce e corect când nu-l înlocuiește nimic. Dar o durată
determinată care se încheie pe 31 și un contract nou de pe 1 sunt o angajare
continuă — iar sincronizarea nu atingea `status`. Măsurat: contract nou activ,
salariu propagat, om `terminated`. Adică lipsă din organigramă și din concedii,
dar plătit. Se repune doar tranziția asta; `on_leave` e o stare aleasă de cineva.

Verificat în 13 direcții pe bază virgină, inclusiv controalele pozitive:
refuzurile (durată determinată fără termen, al doilea contract activ, a doua
suspendare, act pe contract încetat) **și** revenirile.

## Ce lipsește ca să fie o aplicație HR dedicată

Propunerea completă e în conversație; pe scurt, în ordinea în care blochează:

1. ~~**Contractul nu există ca entitate.**~~ **REZOLVAT** — vezi secțiunea de
   mai sus. Rămâne pasul doi: mutarea consumatorilor de pe câmpurile plate pe
   contract, ca acele coloane să poată dispărea.
2. **Nu există cod COR pe poziții**, iar exportul ReviSal din `hr/payroll` pune
   `position_id` (un UUID) în coloana `FunctieId` și `full_time` în
   `ContractTip`. Fișierul nu e importabil nicăieri. **Amânat deliberat de
   owner**: ReviSal e specific României (și s-a mutat între timp în REGES-ONLINE),
   iar HR nu trebuie să fie specific unei țări. Se discută ca integrare separată,
   pe același tipar ca `identity.nationalId` de mai sus.
3. **Încetarea nu are temei legal** — `reason` e text liber lipit în `notes`, deși
   articolul din Codul Muncii determină preavizul, compensațiile și dreptul la
   șomaj.
4. **Medicina muncii și SSM/PSI** nu sunt modelate — doar documente generice cu
   `expires_at`, fără periodicitate și fără „cine e expirat".
5. **Nu există autoservire** — toate rutele sunt de administrator.
6. Lipsesc offboarding, generarea CIM din șablon, raportare de fluctuație, și
   unicitatea CNP-ului pe firmă.

ReviSal e, pe deasupra, în extensia greșită: nu e o funcție de salarizare, iar
`hr/payroll` citește direct `zvd_employees`, tabelul altei extensii. Oriunde
ajunge, forma corectă e cea de mai sus — HR expune datele, țara aduce regula.
