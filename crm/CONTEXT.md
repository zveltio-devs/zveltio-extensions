# CRM — context

**Ownership:** this extension owns `zvd_contacts`, `zvd_organizations`,
`zvd_transactions`, and CRM-only tables. The engine may *adopt* those tables
for Studio metadata / RLS / grants when they already exist; it must not CREATE
them. Dashboard briefing is `GET /ext/crm/briefing` (legacy `/api/briefing` → 410).

**Verificat prin apăsare: 2026-08-09.** Organizație creată, contact legat de ea,
legătura recitită.

## Ce era rupt

**Un contact nu putea aparține unei organizații.** `zvd_contact_organizations` —
tabelul de legătură — era interogat în două locuri și **scris în zero**. Fiecare
contact apărea fără firmă, pe veci. Proiectat pentru, nefolosit niciodată.

Se vede doar dacă te uiți în ambele direcții: o coloană sau un tabel care apare
doar în `SELECT` e semnalul.

**`notes` la organizații era acceptat și aruncat** — validatorul îl accepta,
`INSERT`-ul nu-l conținea. Zod taie tăcut cheile necunoscute.

## Capcane

`zvd_crm_custom_fields` are cheia `(tenant_id, entity_type, name)` — lărgită.
Două firme pot avea fiecare un câmp „Sursă lead".

Validarea CUI e partajată cu facturarea prin `isValidCui()`. Dacă o schimbi
într-un loc, verifică celălalt.
