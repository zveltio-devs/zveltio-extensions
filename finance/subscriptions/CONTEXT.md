# subscriptions — context

**Verificat prin apăsare: 2026-08-09.**

## Ce era rupt

Coloane scrise care nu existau — parte din clasa găsită în zece extensii
deodată: handler-ele și migrațiile fuseseră scrise separat și niciodată
confruntate. Se verifică automat, contra unei instanțe cu extensia activă.

**Cum decizi cine greșește:** dacă schema are conceptul sub alt nume, **schema
are dreptate**. A redenumi coloane care pot avea deja date, ca să se potrivească
unui cod mai nou, e reparație în direcția greșită.

## Ce nu s-a găsit

Nimic din clasele mari ale campaniei: fără valori fabricate, fără muncă asincronă
nelegată de tranzacție, fără chei unice de lărgit.

## Înainte să atingi extensia

Citește `REVIEW-CHECKLIST.md` din rădăcina repo-ului. Verificarea de aici a fost
făcută înainte de campania de chei unice și de cea de identificatori de
utilizator — dacă adaugi coloane `*_by` sau chei unice pe coloane naturale,
porțile din engine te vor prinde, dar e mai ieftin să știi dinainte.
