# PostGIS — context

**Verificat prin apăsare: 2026-08-10.** Zonă creată în jurul Bucureștiului,
vehicul intrat (`enter`) și ieșit (`exit`), ambele consemnate în bază.

## Cerință de instalare

Cere extensia Postgres: `CREATE EXTENSION postgis;`. Fără ea activarea refuză cu
un mesaj clar — nu e un bug.

## Ce era rupt

**Traversările de zonă se salvau doar dacă câștigau o cursă.** Verificarea era
lansată fără `await` — „check geofence rules asynchronously" — iar scrierile
rulau pe tranzacția cererii, pe care engine-ul o închide când handler-ul se
întoarce. Dacă interogarea spațială termina prima, mergea; altfel, nu.

**De obicei mergea.** Ăsta e cel mai rău fel de cursă: trece de fiecare dată când
te uiți la ea. A trecut și când m-am uitat eu — `enter` și `exit` au apărut
amândouă.

Iar cele două `.catch(() => {})` făceau pierderea cursei identică cu câștigarea
ei. **Traversarea E produsul**: un vehicul care iese dintr-o zonă fără să se
scrie nimic e o alertă ratată, și nimic n-o dă de gol — rândul de poziție se
salvează perfect.

Acum e așteptată: traversarea intră în aceeași tranzacție cu poziția care a
provocat-o. Ori sunt amândouă, ori niciuna.

## Notă istorică

Autorizarea pe geofences a fost reparată în auditul din 2026-07-20. **Nu o
raporta ca deschisă.**
