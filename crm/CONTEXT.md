# CRM — context

**Ownership:** this extension owns `zvd_contacts`, `zvd_organizations`,
`zvd_transactions`, and CRM-only tables. It CREATE-s via migrations and
registers Studio metadata in `adoptCrmCollections` on `register()`. The engine
must not CREATE or adopt them. Briefing API: `GET /ext/crm/briefing` (Studio
home no longer embeds receivables — use `/admin/crm` or a future dashboard slot).

**Verified by pressing: 2026-08-09.** An organisation created, a contact linked to
it, the link read back.

## Studio UI (SDUI)

Admin CRM is a **single declarative page** at `/admin/crm` —
`studio/schemas/crm.json` (contacts / organizations / deals tabs). There is no
`studio/pages/` tree; legacy URLs `/admin/crm/contacts` etc. redirect to
`/admin/crm?tab=…` via the Studio catch-all host.

## What was broken

**A contact could not belong to an organisation.** `zvd_contact_organizations` —
the link table — was queried in two places and **written in zero**. Every contact
appeared without a company, forever. Designed for, never used.

It only shows if you look in both directions: a column or table that appears only
in a `SELECT` is the signal.

**`notes` on organisations was accepted and thrown away** — the validator accepted
it, the `INSERT` did not contain it. Zod strips unknown keys silently.

## Traps

`zvd_crm_custom_fields` is keyed on `(tenant_id, entity_type, name)` — widened.
Two tenants can each have a "Lead source" field.

CUI validation is shared with invoicing through `isValidCui()`. If you change it
in one place, check the other.
