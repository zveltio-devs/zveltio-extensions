# Provizionare automată de utilizatori (SCIM 2.0)

Pentru administratorul instanței. Conectează Zveltio la Azure AD / Entra, Okta,
Google Workspace sau orice furnizor care vorbește SCIM 2.0, astfel încât
angajații să fie creați și dezactivați automat.

---

## Adresa pe care o dai furnizorului

```
https://DOMENIUL-TAU/scim/v2
```

**La rădăcină, nu sub `/ext/`.** Extensia se montează deliberat acolo, fiindcă
furnizorii de identitate se așteaptă la o adresă SCIM standard, iar unii nici nu
acceptă căi arbitrare.

Merită spus explicit pentru că e ușor de greșit: `/ext/auth/scim/...` returnează
**401** și pare o problemă de token. Nu e — acolo pur și simplu nu există
serviciul.

Adresele complete pe care le va apela furnizorul:

```
GET    /scim/v2/ServiceProviderConfig
GET    /scim/v2/Users
POST   /scim/v2/Users
GET    /scim/v2/Users/{id}
PATCH  /scim/v2/Users/{id}
DELETE /scim/v2/Users/{id}
```

---

## Pasul 1 — Aprobă capabilitățile

**Acesta e pasul care se uită**, și fără el nimic nu funcționează.

Extensia cere `database` și `secrets`. Ele se **declară** în manifest, dar nu se
acordă automat — un administrator trebuie să le aprobe explicit. Așa e proiectat:
o extensie care cere mai multă putere trebuie să ceară vizibil.

Fără capabilitatea `secrets`, extensia nu poate valida token-ul, iar furnizorul
primește 401 la orice apel — inclusiv cu un token perfect valid.

Aprobarea se face din **Marketplace**, pe cardul extensiei, la instalare sau
după o actualizare care cere o capabilitate nouă.

---

## Pasul 2 — Generează token-ul

**Studio → SCIM Provisioning → token nou.**

Token-ul începe cu `zvscim_` și **se afișează o singură dată**. Salvează-l pe
loc; în bază se păstrează doar amprenta lui, deci nu poate fi recuperat, doar
înlocuit.

Fiecare token aparține unui singur tenant. Utilizatorii pe care îi provizionează
furnizorul intră în tenantul acelui token — nu există ambiguitate și nici mod de
a greși tenantul din afară.

---

## Pasul 3 — Configurează furnizorul

În Azure AD / Okta, la provizionare:

| Câmp | Valoare |
|---|---|
| Tenant URL | `https://DOMENIUL-TAU/scim/v2` |
| Secret Token | token-ul `zvscim_…` de la Pasul 2 |

Apoi **Test Connection**. Furnizorul cheamă `ServiceProviderConfig`; dacă
răspunde, restul va merge.

---

## Ce se întâmplă la dezactivare

Când furnizorul dezactivează sau șterge un utilizator, Zveltio:

1. îi scoate apartenența la tenant;
2. **îi șterge toate sesiunile, imediat** — pierderea accesului trebuie să aibă
   efect acum, iar o sesiune e valabilă pe toată instanța;
3. dacă utilizatorul nu mai aparține niciunui tenant, îi șterge și contul.

Punctul 2 e cel important. Un angajat care pleacă vineri nu trebuie să mai poată
intra luni cu un browser rămas deschis.

Verificat: o dezactivare cu două sesiuni active le lasă pe zero.

---

## Dacă ceva nu merge

**401 la orice apel, cu token valid** — aproape sigur capabilitățile nu sunt
aprobate. Verifică Pasul 1.

**401 și la `ServiceProviderConfig`** — token greșit, sau adresa e sub `/ext/`
în loc de rădăcină.

**500 „SCIM is not configured on this server"** — lipsește `FIELD_ENCRYPTION_KEY`
din configurația instanței. Token-urile se stochează ca amprentă și nu se pot
verifica fără ea.

**Utilizatorii se creează dar nu au drepturi** — SCIM îi face membri ai
tenantului; rolurile se acordă separat, din Permisiuni. Provizionarea spune
*cine are voie să intre*, nu *ce are voie să facă*.
