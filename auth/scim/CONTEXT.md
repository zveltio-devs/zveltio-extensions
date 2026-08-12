# SCIM — context

**Verificat prin apăsare: 2026-08-09.**

## Ce pare rupt și NU e — citește înainte să „repari"

**Se montează la RĂDĂCINĂ, `/scim/v2`, nu sub `/ext/`.** Deliberat: furnizorii de
identitate se așteaptă la o adresă SCIM standard și unii nu acceptă căi
arbitrare.

Consecința: `/ext/auth/scim/...` returnează **401** și pare o problemă de token.
Nu e — acolo pur și simplu nu există serviciul.

Am „reparat" o dată asta adăugând `publicRoutes` în manifest și **am dat înapoi
singur** — ar fi deschis o a doua cale inutilă către același serviciu.

**401 la orice apel cu token valid** înseamnă aproape sigur că **capabilitățile
nu sunt aprobate**. Extensia cere `database` și `secrets`; se **declară** în
manifest dar nu se acordă automat — un administrator le aprobă explicit din
Marketplace. Fără `secrets` nu poate valida token-ul.

## Comportament de reținut

La dezactivarea unui utilizator de către furnizor: îi scoate apartenența, **îi
șterge toate sesiunile imediat**, iar dacă nu mai aparține niciunui tenant îi
șterge contul. Punctul cu sesiunile e cel important — un angajat care pleacă
vineri nu trebuie să mai poată intra luni cu un browser deschis.

## De citit

`SETUP.md` — scris pentru administratorul instanței, cu pașii de configurare la
Azure AD / Okta și diagnosticul celor trei feluri de 401.
