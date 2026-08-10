# Editor de bază de date — context

**Verificat prin apăsare: 2026-08-10.** Interogare salvată și recitită.

## Ce era rupt

**Listarea interogărilor salvate returna 500 tuturor, întotdeauna.** Citirea cerea
`config::text AS query` de la un tabel a cărui coloană e `query`, și aliasa
`created_at` ca `updated_at` deși există un `updated_at` real. `INSERT`-ul de
alături scrie `query` corect — cele două instrucțiuni erau în dezacord despre
același tabel.

A durat fiindcă un `catch` gol numea **ruta**, niciodată coloana: „Failed to list
saved queries" te trimite să cauți o funcție stricată, nu o coloană inexistentă.

## Capcană de proprietate

Extensia scria cândva în `zv_saved_queries` — tabelul **engine-ului** pentru
interogări pe colecții, cu alt model mental. Tabelul ei e
`zv_developer_database_snippets`. O extensie nu alterează tabelele engine-ului.
