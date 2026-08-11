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

## CNP acceptat fără validare

`national_id` era text liber, deci `9999999999999` — luna 99, ziua 99 — intra
liniștit. Contează fiindcă `hr/payroll` îl pune în prima coloană a exportului
ReviSal, iar ITM respinge registrul din cauza lui: o greșeală de tastare la
angajare iese la suprafață luni mai târziu, ca depunere legală respinsă, fără
nimic care să trimită înapoi la formularul care a acceptat-o.

Validat pe cifra de control, ca la CUI în `crm`. Structură, nu existență.

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
   `ContractTip`. Fișierul nu e importabil nicăieri.
3. **Încetarea nu are temei legal** — `reason` e text liber lipit în `notes`, deși
   articolul din Codul Muncii determină preavizul, compensațiile și dreptul la
   șomaj.
4. **Medicina muncii și SSM/PSI** nu sunt modelate — doar documente generice cu
   `expires_at`, fără periodicitate și fără „cine e expirat".
5. **Nu există autoservire** — toate rutele sunt de administrator.
6. Lipsesc offboarding, generarea CIM din șablon, raportare de fluctuație, și
   unicitatea CNP-ului pe firmă.

ReviSal e, pe deasupra, în extensia greșită: e registrul de evidență a
salariaților, nu o funcție de salarizare, iar `hr/payroll` citește direct
`zvd_employees`, tabelul altei extensii. Locul lui firesc, dată fiind familia
`compliance/ro/*`, e `compliance/ro/revisal`.
