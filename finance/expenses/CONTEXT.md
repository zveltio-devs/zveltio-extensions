# finance/expenses — context

Verificat 2026-08-11, pe bază virgină: rapoarte, cheltuieli, kilometraj, diurnă,
trimitere, aprobare, respingere, rambursare, statistici.

## Rambursarea integrală eșua întotdeauna

`zvd_expense_reports_status_check` accepta `draft, submitted, approved,
rejected, **paid**`. Codul scrie `**reimbursed**` — la fel cele 12 locuri din
interfață, la fel `/stats`. Nimic, nicăieri, nu scrie vreodată `paid`.

Deci rambursarea integrală — cazul normal — răspundea 500 cu
`violates check constraint`. Cea **parțială** mergea, fiindcă acolo statusul
rămâne `approved`, ceea ce explică de ce a putut trece neobservat.

Iar `/stats` numără de la bun început `COUNT(*) FILTER (WHERE status =
'reimbursed')` — un contor pe o stare pe care constrângerea o făcea imposibilă.
**Era zero prin construcție.** După migrația 004: decont depus → aprobat →
rambursat integral → 201, status `reimbursed`, contor 1.

## Frauda clasică de decont era deschisă

`approve`, `reject` și `reimburse` nu verificau nimic — o singură permisiune,
`expenses`, și atât. Deci **depune, aprobă, plătește** cerea o permisiune și
niciun complice. `reimburse` e ruta care înregistrează banii ieșiți din firmă.

Acum:

- **decontul propriu e exclus înainte de orice altceva.** Nu e o întrebare de
  permisiuni: nimeni nu-și aprobă propriile cheltuieli, oricât de sus ar fi. S-a
  văzut chiar la testare — godul își crease singur decontul și a primit 403.
- dincolo de asta, o acordare deliberată: acțiunile `expenses:approve` și
  `expenses:reimburse`, cu `admin` încă suficient, ca o instalare existentă să
  meargă fără să editeze cineva politici întâi.

Spre deosebire de modulele HR, aici oamenii sunt identificați prin id-ul de
utilizator, nu printr-o fișă de angajat — deci nu există relație de manager de
consultat și nici dependință de `hr/employees` ca s-o obții.

## Deconturile tuturor erau vizibile tuturor

`GET /reports` returna fiecare raport de pe instanță oricui avea `expenses`. Un
decont nu e lectură neutră: e unde a fost cineva, când, cu cine și pe ce a
cheltuit. Existența lui `/reports/my` alături sugerează că despărțirea era
intenționată și n-a fost niciodată aplicată.

Acum lista e limitată la propriile rapoarte, cu excepția celor care pot aproba.
Verificat: cu drepturi obișnuite Mallory vede 1 raport (al ei), adminul vede 3.

**De reținut:** fiindcă `approve` e o acțiune pe resursa `expenses`, un grant
`*` pe `expenses` face pe cineva aprobator — și deci îi arată toate deconturile.
Prima dată testul meu a picat exact așa. Pe o instalare reală wildcard-urile sunt
desfășurate în rânduri explicite (migrația 034 din engine), deci nu apare din
greșeală, dar merită știut înainte să acorde cineva `*` „ca să meargă".

## Lipsuri de produs

- Fără limite de cheltuială și fără politică (plafoane pe categorie, praguri
  peste care trebuie al doilea aprobator).
- Fără atașare de bon/factură pe cheltuială — nu există câmp de fișier, deși
  justificativul e obligatoriu pentru deducere.
- Fără curs valutar preluat automat; `exchange_rate` se dă manual.
- Fără legătură cu `finance/accounting`: un decont rambursat nu produce nicio
  notă contabilă.
