# Gestiune — context

**Verificat prin apăsare: 2026-08-09.** Produs creat, depozit creat, stoc mișcat
la emiterea unui aviz (300 → 180).

## Ce era rupt

**Nu se putea crea nici produs, nici depozit** — cele două operații de bază.
Handler-ele scriau `unit_cost`, `reorder_quantity`, `address`; tabelele aveau
`cost_price`, `reorder_qty`, `location`. **Schema avea dreptate** și codul a fost
corectat: a redenumi coloane care pot avea deja date, ca să se potrivească unui
cod mai nou, e reparație în direcția greșită.

**`inventory.stock.move` — serviciul prin care ALTE extensii mișcă stocul —
insera în coloane inexistente.** Orice apel ar fi eșuat. Nimic n-a observat,
fiindcă nimic nu-l apelase vreodată. Serviciile publicate sunt și ele cod.

## Decizie de arhitectură care contează

**Scăderea din stoc NU stă în extensia de facturare.** Era acolo, în cea
românească, ceea ce ar fi obligat o extensie germană s-o rescrie — și a doua
implementare ar fi diferit de prima în vreun fel neobservat.

Livrarea e un concept al gestiunii. Facturarea doar o referențiază, iar stocul se
mișcă pe **avizul de însoțire**, nu pe factură — între facturare și plecarea din
depozit e timp, și nu toată lumea folosește e-Factura.

## Ce s-a adăugat

`stock.reserve` / `stock.release` — starea dintre „promis clientului" și „plecat
din depozit". `reserved_qty` exista în schemă, era afișat și nu era setat
niciodată.

## Rămâne deschis

Import de stoc inițial pentru firme care migrează cu depozitul plin. Generare de
coduri QR per produs și ecrane care se pot scana.
