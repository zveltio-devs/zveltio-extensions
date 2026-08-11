# hr/leave — context

Verificat 2026-08-11, pe bază virgină. Calculul de zile, soldurile, aprobarea,
respingerea, anularea, reportarea, calendarul și statisticile — toate presate.

Logica de fond era **corectă**. Autorizarea nu era deloc.

## Oricine cu acces la modul putea consuma concediul altcuiva

O singură permisiune, `leave`, acoperea tot: `permissionGate(ctx, 'leave')` pe
`*` și nimic altceva. `employee_id` venea din corpul cererii și nu era comparat
niciodată cu apelantul, iar aprobarea nu verifica absolut nimic.

Presat înainte de reparație, pe instanță vie: un utilizator obișnuit cu acces la
`leave` a depus două zile pe soldul altui angajat **și le-a aprobat el însuși**.
Ambele răspunsuri, 200.

Concediul e bani. Zilele neconsumate se compensează la încetare, deci a cheltui
soldul altcuiva e a-i cheltui plata compensatorie. Iar autoaprobarea desființează
singurul control care există aici: managerul.

Trei căi de acces acum, iar ordinea e ideea: **e concediul tău**, **conduci
persoana**, sau **administrezi instanța**.

| acțiune | tu însuți | manager | admin |
|---|---|---|---|
| depunere | da | da | da |
| aprobare | **nu** | da | da |
| respingere | **nu** | da | da |
| anulare | da | da | da |

Aprobarea și respingerea exclud explicit cazul „propriul concediu" în loc să
omită verificarea — omisiunea e chiar felul în care s-a pierdut prima dată.
Anularea îl păstrează, fiindcă acolo îți dai zilele înapoi, ceea ce e legitim.

Verificat în **șase** direcții, nu doar în cele care confirmă:

1. depunere pentru altcineva → 403
2. depunere pentru sine → 201
3. autoaprobare → 403
4. aprobare de către admin → 200
5. după ce devine manager, depune pentru subaltern → 201
6. și îl aprobă ca manager → 200

Fără 2, 4, 5 și 6, un fix care blochează tot ar fi arătat identic.

## Legătura utilizator ↔ angajat era pe email

`/requests/my` căuta angajatul după `email = user.email`, deși `zvd_employees`
are coloana `user_id`. Un om al cărui email de serviciu diferă de cel de logare
vedea o listă goală și părea că n-a luat concediu niciodată. Helper-ul nou
încearcă `user_id` întâi și păstrează emailul ca rezervă.

## Ce e corect și merită știut

- Zilele lucrătoare exclud weekendurile **și** sărbătorile legale — verificat cu
  o sărbătoare pusă în mijlocul intervalului: 5 zile devin 4.
- Suprapunerile sunt refuzate.
- Depășirea soldului e refuzată.
- Aprobarea mută `pending → used`; anularea unei cereri aprobate întoarce
  `used`, nu `pending`. Corect.

## Lipsuri de produs

- **Zero sărbători legale la instalare.** Mecanismul funcționează, dar tabelul e
  gol, deci pe o instanță nouă orice cerere numără greșit până când cineva
  introduce manual zilele. Ar trebui aduse de o extensie de țară, pe același
  tipar ca `identity.nationalId` din `hr/employees` — calendarul de sărbători e
  specific țării, modulul de concedii nu trebuie să fie.
- Fără notificări: nici la depunere, nici la aprobare, nici la respingere.
- Fără vizibilitate de echipă („cine e plecat săptămâna asta" există ca
  `/calendar`, dar nu e legat de ierarhie).
- Fără perioade blocate (blackout), fără concediu în avans, fără fracțiuni mai
  mici de jumătate de zi.
