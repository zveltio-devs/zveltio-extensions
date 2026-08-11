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

## Ce lipsește ca să fie o aplicație HR dedicată

Propunerea completă e în conversație; pe scurt, în ordinea în care blochează:

1. **Contractul nu există ca entitate.** `hire_date`, `end_date`,
   `employment_type`, `salary` sunt câmpuri plate pe angajat. Nu se poate
   reprezenta contract pe durată determinată prelungit prin act adițional, normă
   parțială, suspendare pentru creștere copil, sau al doilea contract la aceeași
   firmă. Istoricul salarial există dar nu e legat de niciun document.
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
