# Panoul de bord — context

**Verificat prin apăsare: 2026-08-10.** Toate widget-urile citite, valorile
confruntate cu baza.

## Ce era rupt

**`audit_log: true` era scris literal în cod** — în widget-ul al cărui propriu
comentariu spune că e „pentru un consiliu / un auditor". Ar fi răspuns „da" și cu
tabelul șters. Acum e derivat și poartă marcajul ultimei intrări, deci se vede și
un scriitor blocat.

**`zv_collections` nu există** — tabelul e `zvd_collections`. `.catch(() => 0)`
transforma interogarea stricată într-un zero credibil. Arăta ca o instalare
goală, nu ca ceva rupt.

**Resetarea aranjamentului înghițea eșecul ștergerii** și răspundea „gata".

## Capcana cea mai instructivă din tot produsul

Un singur tabel lipsă a produs asta:

```
widget count "zv_audit_log" failed: relation "zv_audit_log" does not exist
recent activity failed: current transaction is aborted…
trust "audit_log" failed: current transaction is aborted…
trust "last_backup" failed: current transaction is aborted…
```

`last_backup` citește `zv_backups`, tabel perfect sănătos, și a raportat totuși
„nicio copie de siguranță". **Widget-urile împart o tranzacție.** O interogare
stricată produce patru valori false, toate plauzibile.

Etichetele fac acum cauza vizibilă într-o linie. Contaminarea rămâne — cere
SAVEPOINT per widget, deci și trecerea de la paralel la secvenţial (savepoint-urile
nu se compun cu instrucţiuni paralele pe aceeaşi conexiune). Panoul rulează în
76 ms, deci costul e neglijabil.

## Ce e corect și nu trebuie „reparat"

`health` care raportează `ok: false` **e** semnalul onest — nu-l face să tacă.
Verificările de permisiuni care refuză închis sunt corecte așa.
