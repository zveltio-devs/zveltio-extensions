# hr/time-tracking — context

Verificat 2026-08-11, pe bază virgină: proiecte, intrări, cronometru, pontaje,
trimitere, aprobare, respingere, statistici.

**Atenție la activare:** extensia cere `finance/invoicing` și refuză corect să se
încarce fără ea. E și o observație de produs — pontajul nu ar trebui să depindă
obligatoriu de facturare; se pot urmări ore fără să le facturezi.

## Al treilea modul HR cu aceeași gaură

`hr/employees`, `hr/leave` și acesta au aceeași formă: o singură poartă de
permisiune pe `*` și **nicio** verificare de proprietate. Aici:

- `employee_id` era **opțional** pe `POST /entries` și pe `POST /timer/start`.
  Lăsat gol făcea ce trebuie; completat, înregistra ore pe numele oricui.
- `POST /timesheets/:id/approve` nu verifica absolut nimic — oricine cu acces la
  modul putea aproba orice pontaj, inclusiv al lui.
- La fel `reject`, care e mai ieftin de abuzat: nu cere nimic în afară de un id
  și trimite orele înapoi ca disputate.

Un pontaj aprobat e ce facturează `POST /entries/invoice`. **Aprobarea propriilor
ore înseamnă emiterea propriei linii de factură.**

Și un defect adiacent: inserarea folosea `d.employee_id ?? null`, deci o intrare
fără câmp aparținea **nimănui** — invizibilă și pentru omul care a lucrat orele,
și pentru orice raport per angajat.

Acum: orele tale, ale cuiva pe care îl conduci, sau administratorul. Aprobarea și
respingerea exclud explicit cazul propriu.

Verificat în cinci direcții:

1. Mallory logheaza ore pe numele Anei → **403**
2. adminul poate → **201**
3. Mallory își aprobă propriul pontaj → **403**
4. adminul îl aprobă → **200**
5. intrare fără `employee_id` ajunge pe apelant, nu pe nimeni → zero intrări
   orfane în baza de date

## Duplicare de reparat

Helperii `callerEmployee` / `mayActFor` sunt acum în **două** extensii —
`hr/leave` și aceasta — cu același conținut. A treia copie ar fi semnalul clar
că trebuie mutați: locul lor e un serviciu expus de `hr/employees`
(`ctx.services`, cum e deja `identity.nationalId`), ceea ce ar elimina și
citirea directă a lui `zvd_employees` de aici — tabelul altei extensii.

## Legătura utilizator ↔ angajat

Ca peste tot în familia HR, căutarea se făcea după email deși `zvd_employees` are
`user_id`. Helper-ul nou încearcă `user_id` întâi. Fără asta, cine are alt email
de serviciu decât cel de logare nu putea nici măcar să pornească cronometrul.

## Identitatea și autorizarea trec prin `hr.employment` (2026-08-12)

Duplicarea semnalată aici a fost rezolvată: `callerEmployee`/`mayActFor` erau
aceleași douăzeci de linii ca în `hr/leave`, amândouă deschizând `zvd_employees`.
Sunt acum pe serviciul lui `hr/employees`; fără el, rutele răspund 503.

Cele două căutări de identitate (cronometru pornit, cronometru oprit) se făceau
după email — deci cine are alt email de serviciu nu putea porni cronometrul deloc.

**Gate-ul de rute de decizie a trebuit învățat:** o gardă ajunsă prin
`ctx.services` se rezolvă la execuție, peste graniță de extensie, iar un cititor
static n-o poate urmări. Handlerele o declară acum explicit:
`// permission: delegated to hr.employment.mayActFor`. E mai slab decât să vezi
apelul — o afirmație, nu o dovadă — dar e greppabil și obligă delegarea să fie
scrisă, nu dedusă.
