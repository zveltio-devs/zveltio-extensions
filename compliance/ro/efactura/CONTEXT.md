# e-Factura — context

Pentru o instanță care urmează să atingă extensia asta. Ce nu se vede din cod.

**Verificat prin apăsare: 2026-08-10.** Factură generată din bază, XML validat de
serviciul ANAF (`stare: ok`, zero mesaje), setări salvate și recitite. **NU** a
fost testat un ciclu complet de depunere — cere certificat și aplicație
înregistrată, care sunt ale clientului.

## Ce era rupt, și de ce n-a văzut nimeni

**Depunerea era fabricată.** `/submit` inventa indexul de încărcare ANAF,
scria „transmis" în bază și răspundea `Submitted to ANAF`. Nimic nu pleca
nicăieri. A supraviețuit fiindcă XML-ul era doar o precondiție pentru o depunere
falsă, care nu-l citea niciodată — deci generatorul n-a rulat niciodată pe un
rând real.

**Generatorul crăpa pe orice factură reală.** `NUMERIC` vine ca șir din driver
(refuză să piardă precizie), `date` vine ca obiect `Date`. `vat_total.toFixed()`
și `d.split('T')` mureau amândouă. Conversia se face acum o singură dată, în
`toInvoiceData`, la granița rând → `InvoiceData`.

**Trei migrații nedeclarate** în `getMigrations()` — pe instalare nouă nu exista
nimic din conformitate, iar extensia se activa perfect.

## Capcane specifice

**Ordinea rutelor.** `/:id` înregistrat înaintea lui `/settings` înghite
„settings" — ruta de setări dădea 404. Fișierul documenta deja capcana pentru
`/stats` și tot s-a repetat.

**Secretele nu se întorc niciodată.** `client_secret` se stochează `enc:v1:` și
la re-salvare cu câmp gol rămâne cel dinainte. E intenționat.

**Validatorul ANAF e gratuit și fără autentificare** —
`webservicesp.anaf.ro/prod/FCTEL/rest/validare/FACT1`. Folosește-l înainte de
orice depunere; a respins opt reguli pe un XML care „arăta corect".

## Rămâne deschis

Generatorul UBL e monolitic. Împărțirea în nucleu EN 16931 + profil de țară e
ce deblochează o extensie germană — vezi principiul: extensiile regionale nu
trebuie să rupă modelul generic.

## Proprietate

Toate tabelele `zv_efactura_*` sunt ale extensiei. `zv_efactura_daily_stats` are
cheia primară `(tenant_id, date, seller_cui)` — lărgită în campania de chei,
iar `ON CONFLICT` a fost mutat odată cu ea.

## De citit înainte

`SETUP.md` — ghidul pentru administratorul instanței, scris pentru client, nu
pentru dezvoltator. Explică de ce testul „Hello" poate trece și e-Factura să nu:
token bun, aplicație neînrolată.
