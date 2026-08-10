# Magazin — context

**Verificat prin apăsare: 2026-08-09.**

## Decizie de proprietate care contează

Magazinul scria prețuri în `zvd_products` — **tabelul gestiunii** — cu propriile
nume de coloane. Intenția era corectă (un magazin vinde ce ține depozitul), dar
o extensie nu migrează tabelul altei extensii.

**Moneda a fost adăugată de gestiune**, fiindcă tabelul e al ei. Dacă ai nevoie
de o coloană nouă pe `zvd_products`, migrația se scrie în `operations/inventory`.

## Chei lărgite

`sku` pe produse și variante, `slug` pe produse și categorii, `email` pe clienți,
`order_number` pe comenzi, `code` pe cupoane, și
`(country, region, applies_to)` pe regulile de taxe. Toate erau unice pe
instanță — două magazine nu puteau avea același SKU sau același client.

`ON CONFLICT (sku)` și cel de pe regulile de taxe au fost mutate odată cu cheile.
Dacă mai adaugi vreunul, include `tenant_id`.
