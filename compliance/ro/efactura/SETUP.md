# Conectarea la ANAF pentru e-Factura

Acest ghid e pentru administratorul instanței Zveltio. Durează în jur de o oră,
iar cea mai mare parte din ea e aşteptare după ANAF.

**Nu ai nevoie de nimic din asta ca să emiţi facturi.** Factura, PDF-ul oficial
şi verificarea că documentul e valid funcţionează fără nicio conectare. ANAF îţi
trebuie doar ca să **depui** electronic.

---

## Ce îţi trebuie înainte să începi

**Un certificat digital calificat**, de la un furnizor autorizat (certSIGN,
DigiSign, Trans Sped, Alfasign şi altele). E acelaşi certificat cu care se
semnează declaraţiile.

**Dreptul în SPV pentru firmă** — reprezentant legal, reprezentant desemnat sau
împuternicit. Dacă depui deja declaraţii pentru firmă, îl ai.

Dacă nu eşti încă în SPV: <https://www.anaf.ro/InregPersFizicePublic/#tabs-2>

---

## Pasul 1 — Alege adresa de callback

E prima decizie şi cea mai uşor de greşit, fiindcă **se fixează la înregistrare**
şi nu se schimbă comod după.

Adresa e:

```
https://DOMENIUL-TAU/admin/anaf/callback
```

înlocuind `DOMENIUL-TAU` cu adresa pe care îţi accesezi Zveltio. Trebuie să fie
adresa **publică, exactă**, aceeaşi pe care o tastezi în browser. Dacă intri pe
`https://erp.firma.ro`, aceea e; nu `http://`, nu IP-ul serverului, nu
`localhost`.

Notează-o. O foloseşti de două ori: o dată la ANAF, o dată în Zveltio, şi
**trebuie să fie identice caracter cu caracter**.

---

## Pasul 2 — Înregistrează aplicaţia la ANAF

Mergi la <https://www.anaf.ro/anaf/internet/ANAF/servicii_online/inreg_api> şi
autentifică-te cu certificatul.

Completează formularul de înregistrare a aplicaţiei. La callback pui exact
adresa de la Pasul 1.

Primeşti două valori: **client ID** şi **client secret**.

Secretul se afişează de regulă o singură dată. Salvează-l pe loc, undeva sigur.

---

## Pasul 3 — Completează în Zveltio

Deschide **Conexiune ANAF** din meniu.

| Câmp | Ce pui |
|---|---|
| Destinaţie | **Test** la început. Documentele trimise acolo nu au efect fiscal. |
| CIF depunător | CIF-ul firmei pentru care depui, fără „RO". |
| URL de callback | Exact adresa de la Pasul 1. |
| Client ID | Ce ai primit de la ANAF. |
| Client secret | Ce ai primit de la ANAF. |

Apeşi **Salvează**.

Secretul nu se mai afişează niciodată după salvare — nici ţie. E criptat în baza
de date. Când revii pe ecran vezi doar că e setat. Dacă îl laşi gol la o
re-salvare, rămâne cel dinainte; îl scrii din nou doar dacă vrei să-l schimbi.

---

## Pasul 4 — Conectează-te

Apeşi **Conectează la ANAF**. Eşti trimis la portalul lor, unde semnezi cu
certificatul — **care trebuie să fie conectat fizic la calculatorul de pe care
apeşi**, nu la server. Semnătura o face browserul tău, nu Zveltio.

După semnare eşti adus înapoi şi conexiunea e activă.

---

## Pasul 5 — Verifică

Apeşi **Testează conexiunea**. Zveltio cheamă serviciul „Hello" al ANAF.

Merită făcut, şi iată de ce: ANAF îţi dă un token dacă **tu** ai drepturi, dar
accesul la e-Factura depinde şi de dacă **aplicaţia** a fost înrolată pentru acel
serviciu. Cele două eşuează la fel de urât şi din motive complet diferite.

- **Testul merge, e-Factura nu** → token bun, aplicaţia nu are acces la serviciu.
  Se rezolvă la ANAF, nu în Zveltio.
- **Nici testul nu merge** → problema e la token: client ID, secret sau callback.

---

## De acum încolo

Fiecare factură emisă primeşte automat o ciornă de e-Factura. O deschizi,
generezi XML-ul, îl verifici — verificarea e făcută chiar de ANAF şi nu costă
nimic — şi apoi o depui.

După depunere primeşti un **index de încărcare**. Prelucrarea durează de la
secunde la minute. Interoghezi starea:

- **ok** — factura a fost validată şi a ajuns la cumpărător. Poţi descărca
  recipisa semnată de Ministerul Finanţelor.
- **nok** — au fost găsite erori şi **factura NU a ajuns la cumpărător**.
  Descarci răspunsul ca să vezi ce anume.
- **în prelucrare** — mai aşteaptă.

Diferenţa dintre `ok` şi `nok` e cea care contează. O factură `nok` nu a fost
depusă, oricât de mult ar arăta ca şi cum ar fi fost.

---

## Când treci pe producţie

Schimbi **Destinaţie** din Test în Producţie şi salvezi. Credenţialele rămân.

Din acel moment fiecare depunere are efect fiscal.

---

## Dacă ceva nu merge

**„Set the ANAF client_id first"** — n-ai salvat încă credenţialele.

**„Set the callback URL"** — n-ai completat adresa de callback.

**ANAF refuză cererea de token** — aproape întotdeauna callback-ul diferă de cel
înregistrat. Compară-le caracter cu caracter, inclusiv `https://` şi eventualul
`/` de la final.

**„The ANAF token has expired"** — apeşi **Reînnoieşte token**. Dacă nu merge, te
reconectezi de la Pasul 4.

**Validarea XML spune `nok`** — problema e în datele facturii, nu în conexiune.
Mesajele ANAF numesc câmpul lipsă. Cele mai frecvente: lipseşte judeţul sau
localitatea la una dintre părţi, sau CUI-ul cumpărătorului. Pentru Bucureşti,
localitatea trebuie să fie sectorul.

---

## Ce nu face Zveltio

Nu îţi ţine certificatul. Rămâne la tine; serverul nu-l vede niciodată.

Nu depune în locul tău automat. Fiecare depunere e o acţiune pe care o faci tu.

Nu poate repara o înregistrare greşită la ANAF. Dacă aplicaţia nu e înrolată
pentru e-Factura, se rezolvă la ei.
