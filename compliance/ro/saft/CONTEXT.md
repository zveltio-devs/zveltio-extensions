# SAF-T (D406) — context

**Verificat prin apăsare: 2026-08-10.** Generarea rulează și produce structura;
depunerea refuză explicit.

## Ce era rupt

**Depunerea era fabricată** — la fel ca e-Factura și e-Transport. `/submit`
inventa un răspuns și scria „transmis". Acum întoarce **501** cu explicația: D406
nu se depune prin API, ci se validează cu **DUK Integrator** (unealtă ANAF, Java)
și se încarcă în **SPV** manual. Nu există cale programatică, deci un buton care
pretinde altceva e o minciună, nu o funcție lipsă.

## Rămâne deschis

Generatorul e parțial. Lipsesc: tabela de taxe, partenerii, produsele, mijloacele
fixe, `SourceDocuments`. Ce există produce structura, nu un fișier depunabil.

**Nu marca extensia ca gata** până generatorul nu trece prin DUK Integrator — e
singura validare care contează, și e offline.

## Capcane

`zv_saft_accounts.code` era unic pe instanță; lărgit la `(tenant_id, code)`.
Fiecare firmă are propriul plan de conturi — evident după, invizibil înainte.

## Proprietate

Tabelele `zv_saft_*` sunt ale extensiei.
