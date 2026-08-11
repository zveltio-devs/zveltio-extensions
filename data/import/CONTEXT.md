# data/import — context

Verificat 2026-08-11, pe bază virgină, cu control pozitiv. Rutele trec, importul
scrie rânduri, iar coloanele marcate `encrypted` ajung criptate pe disc.

## De ce n-a văzut nimeni că importul nu funcționa deloc

Importul a fost funcție de core înainte să devină extensie, iar engine-ul încă
are `routes/import.ts` peste **același tabel**, `zv_import_logs`. Cele două
migrații îl creează amândouă condiționat, cu vocabulare diferite în trei locuri:

| | engine | extensia |
|---|---|---|
| format fișier | `file_format` | `format` |
| rânduri eșuate | `error_rows` | `failed_rows` |
| job în lucru | `processing` | `running` |

Migrațiile de core rulează la boot, înaintea oricărei extensii. Deci pe **orice
instalare nouă** tabelul e al engine-ului, iar prima instrucțiune a extensiei îl
încalcă: `POST /ext/data/import/:collection` răspundea 500 cu
`column "format" does not exist`.

Pe o instalare veche nu se vede: acolo coloanele s-au acumulat din ambele părți
de-a lungul lunilor. Iar auditul se uita la `/api/import`, care merge perfect —
peste tabelul pe care tot el l-a creat, cu numele pe care tot el le-a ales.
Ruta aia n-are niciun apelant: Studio și SDK-ul intră pe `/ext/`.

Migrația 003 ia reuniunea ambelor forme, aditiv, ca să fie corectă pe oricare și
să supraviețuiască ștergerii copiei din engine.

## De ce eșecul era invizibil

După reparația coloanelor, jobul murea la primul `status: 'running'` și rămânea
`pending`, `errors: []`, fără nicio linie în log. Handler-ul de eroare scria prin
`ctx.db`, iar jobul e pornit **în interiorul** handler-ului, deci moștenește
contextul async al cererii: scrierea de recuperare mergea într-o tranzacție deja
comisă, iar propriul ei `.catch` arunca eroarea. Un import mort se citea ca unul
lent.

Acum: `stderr` întâi, apoi scrierea prin `withTenantIsolation` propriu.

## Capcana care merită reținută

`fieldTypeRegistry.deserialize` e **async** și nu era așteptat, deci în rând
intra un Promise. Ajungea totuși în tabel, fiindcă Bun.SQL rezolvă un promise
dat ca parametru de interogare — de asta n-a deranjat pe nimeni ani de zile.

S-a văzut abia când am adăugat criptarea: `maybeEncrypt` a primit un Promise, a
luat ieșirea `typeof value !== 'string'` și l-a returnat neatins, iar coloana a
rămas în clar **cu garda pusă**. Verificarea prin citire ar fi zis „e reparat".
Tipărirea valorii a zis altceva.

**Un `await` lipsă nu se manifestă ca eroare aici. Se manifestă ca o gardă care
nu se aplică.**

## Ce e încă deschis

`routes/import.ts` din engine (2 rute, zero consumatori) și tipul
`zv_import_logs` din `schema.ts` trebuie șterse. Când se întâmplă, coloanele
duplicate din migrația 003 pot dispărea și ele.
