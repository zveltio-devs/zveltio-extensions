# hr/payroll — context

Verificat 2026-08-11, pe bază virgină: perioade, generare, aprobare, plată,
intrări, D112, statistici, simulator, ore suplimentare, tichete, concediu
medical, ReviSal, cote.

Aritmetica e consecventă — se potrivește exact cu calculul făcut de mână. Ce nu e
în regulă sunt **regulile** și **locul unde stau**.

## Cotele legale erau compilate în bundle

`RO_RATES` era un obiect literal în `routes.ts`, iar
`computeRO(input, rates = RO_RATES)` avea un parametru pe care **niciun apel nu-l
folosea**. Nu exista nicio tabelă de configurare, nicio citire de setări.

Deci o schimbare legislativă — și se schimbă în fiecare an — cerea o versiune
nouă de extensie, livrată prin registry, pe fiecare instalare. Un contabil care
ȘTIE noua cotă n-avea unde s-o scrie.

Acum stau în `zvd_payroll_rates` (migrația 006), inițializate cu exact aceleași
valori, plus `GET`/`PUT /rates`. Verificat: cotele implicite dau aceleași cifre
ca înainte (net 2975, cost angajator 5312.50 la brut 5000), iar punerea lui
`cas_employer` pe 0 scade costul la 5112.50 fără să atingă netul — corect,
contribuțiile angajatorului nu ating netul.

**Un defect găsit în timpul verificării:** fluturașul stoca `cas_employer_rate`
din constantă, nu din cota folosită. Cât timp constanta era singura sursă,
coincideau; de îndată ce cota devine corectabilă, înregistrarea spune 0.0400 și
suma reflectă 0. Prins exact așa. Acum stochează ce a folosit — și tocmai asta
face tabela sigură **fără datare pe intervale**: o perioadă închisă își păstrează
cifrele. Verificat: perioada generată înainte de corecție rămâne la 0.0400 /
5312.50 după ce cota s-a schimbat.

## Aprobarea și plata statului nu verificau nimic (găsit ulterior)

`POST /periods/:id/approve` și `POST /periods/:id/pay` stăteau după singura
permisiune `payroll` — aceeași care trebuie ca să te uiți la un fluturaș — și nu
întrebau nimic altceva. Aprobarea fixează ce datorează firma fiecărui angajat;
plata marchează banii ca ieșiți.

**Ratat la prima trecere peste extensie.** Am apăsat rutele ca administrator și
au răspuns 200, ceea ce nu spune nimic despre cine ALTCINEVA le putea apăsa. Le-a
găsit un detector rulat peste tot catalogul după a treia extensie cu aceeași
formă: `permissionGate` prezent, `checkPermission` absent, rute care decid ceva.
Detectorul e acum `scripts/check-decision-routes.ts`.

Verificat în patru direcții: un utilizator cu drepturi obișnuite de `payroll`
primește 403 și la aprobare și la plată; administratorul primește 200 la
amândouă.

## Salarizarea citește contractul, nu tabelul altei extensii (pasul doi)

`hr/payroll` rula `SELECT * FROM zvd_employees` în **patru** locuri și lua
`salary` de pe rând. Tabelul e al altei extensii — și e și motivul pentru care
salarizarea nu putea vedea un contract: citea proiecția, nu lucrul proiectat.
Norma parțială, suspendarea și actul adițional erau toate invizibile aici.

Acum trece prin `hr.employment`, serviciu expus de `hr/employees` pe
`ctx.services` — același mecanism ca `identity.nationalId`. Modulul care deține
datele răspunde la întrebări despre ele; nimeni altcineva nu deschide tabelul.
Serviciul e îngust deliberat: cine se plătește luna asta, și în ce termeni.

Trei schimbări de comportament, toate măsurate:

**Ora suplimentară urmează norma contractată.** Rata orară era `salariu / 168`,
un număr fix. Deci pentru cineva cu 20 de ore pe săptămână ora suplimentară
valora jumătate — cu cât erai contractat mai puțin, cu atât ora ta era mai
ieftină, ceea ce e pe dos. Măsurat: 6000 lei la 40h și 3000 lei la 20h dădeau
35.71 față de 17.86; acum dau **34.62 amândoi**, ceea ce e corect, fiindcă
salariul part-time e deja proporțional.

**Contractul suspendat iese de pe stat.** Cineva în concediu de creștere e încă
angajat, dar nu primește salariu de la angajator. Măsurat: august generează 1
intrare în loc de 2, iar după revenire septembrie generează iar 2.

**Ce nu se poate calcula e sărit cu motiv, nu tăcut.** Un contract cu plata pe
oră nu poate produce brutul unei luni fără orele efectiv lucrate, care stau în
`hr/time-tracking`. Răspunsul întoarce acum `skipped: [{employee, reason}]` — un
stat care produce tăcut mai puține fluturași decât are firma angajați e genul de
lucru care se observă abia când cineva nu e plătit.

Câmpurile plate de pe `zvd_employees` rămân deocamdată: serviciul face
`COALESCE(contract, angajat)`, deci o instalare care n-a creat încă niciun
contract se plătește ca înainte. Ștergerea coloanelor e pasul trei, după ce toți
consumatorii trec pe contract.

## Trei reguli care par greșite — de confirmat cu un contabil

Nu le-am modificat. Legislația fiscală se schimbă anual, cunoștințele mele au o
dată de tăiere, iar un „fix" greșit arată mai autoritar decât starea actuală. Le
las aici, iar mecanismul de mai sus le face corectabile fără release:

1. **`cas_employer: 0.04` se aplică tuturor.** Comentariul din cod spune
   „conditions deosebite", dar cota se folosește pentru fiecare angajat. La
   condiții normale de muncă angajatorul nu datorează CAS. Costul angajatorului
   e umflat cu 4% din brut pentru fiecare om obișnuit.
2. **`personal_deduction_base: 500`, plat.** Deducerea personală e o grilă care
   depinde de brut și de persoanele în întreținere și ajunge la zero peste un
   prag. Aplicată plat, impozitul iese greșit în ambele sensuri.
3. **Tichetele de masă se adaugă la net neimpozitate.** Măsurat: 600 lei tichete
   cresc netul cu exact 600, fără CASS și fără impozit.

## Exporturile legale

**D112** răspunde, dar XML-ul pune **angajatul** în `<Declarant>` (unde stă
firma) și `<CIF></CIF>` e gol. O declarație fără cod fiscal e respinsă.

**ReviSal** pune `position_id` — un UUID intern — în coloana `FunctieId`, unde se
așteaptă cod COR, și `full_time` în `ContractTip`. Amânat deliberat de owner:
ReviSal e specific României și s-a mutat în REGES-ONLINE, deci e o discuție de
integrare, nu o funcție de salarizare.

## Problema de structură

Extensia se numește `hr/payroll` și calculează **exclusiv** salarizare
românească: `computeRO`, `RO_RATES`, D112, ReviSal. O instanță din altă țară
primește contribuții românești aplicate salariilor ei.

Sub regula „modulele nu sunt specifice unei țări", forma corectă e cea folosită
deja la `identity.nationalId` în `hr/employees`: modulul ține perioadele,
intrările și fluxul, iar țara aduce formula și declarațiile. Tabela de cote e
primul pas — face partea variabilă să fie date, nu cod — dar `computeRO` însuși
rămâne românesc.

## Alte observații

- `hr/payroll` citește direct `zvd_employees`, tabelul altei extensii.
- `POST /meal-vouchers` cere `quantity`/`face_value`, nu `days`/`value_per_day`;
  `POST /sick-leave` cere `days`, nu interval de date. Un 400 la prima încercare
  e probabil forma cererii.
- `generate` refuză corect o perioadă deja aprobată sau plătită.
