# Mijloace fixe — context

**Verificat prin apăsare: 2026-08-09.**

## Ce era rupt

Coloane scrise care nu existau — aceeași clasă găsită în zece extensii.

`zvd_assets.code` era unic pe instanță; două firme nu puteau avea fiecare
mijlocul fix „MF-001". Lărgit la `(tenant_id, code)`.

## Capcană

`zvd_asset_depreciation` are cheia `(asset_id, period)` și e **corectă așa** —
`asset_id` e un UUID care aparține deja unei firme, deci copilul nu poate
traversa granița. Nu o „repara" adăugând `tenant_id`; face parte din categoria pe
care poarta din engine o lasă intenționat să treacă.
