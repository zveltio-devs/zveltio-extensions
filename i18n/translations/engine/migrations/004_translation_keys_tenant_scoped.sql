-- `key` e unic pe firmă, nu pe instanță.
--
-- Recuperează o constrângere care a existat și s-a pierdut. Tabela
-- `zvd_translation_keys` era creată de engine, cu `key TEXT NOT NULL UNIQUE`, iar
-- migrația 036 a engine-ului a lărgit cheia la `(tenant_id, key)` — era una din
-- cele 60 de chei unice reparate în campania de multi-tenancy.
--
-- Engine-ul nu mai deține tabela: cele cincisprezece rute `/api/translations` au
-- fost șterse fiindcă extensia servea aceleași cincisprezece, iar `001_initial.sql`
-- al engine-ului nu o mai creează. Creatorul e acum `001_initial.sql` al acestei
-- extensii — scris ÎNAINTE de campanie, deci cu `UNIQUE` simplu. Odată cu tabela,
-- reparația a plecat: pe orice instalare nouă, cheia e din nou îngustă.
--
-- Măsurat, comparând o bază ridicată pe lanțul vechi cu una instalată nou:
--
--   vechi: zvd_translation_keys_key_key UNIQUE (tenant_id, key)
--   nou:   zvd_translation_keys_key_key UNIQUE (key)
--
-- Efectul: a doua firmă nu-și poate crea propria cheie de traducere dacă prima a
-- folosit deja acel nume — și fiindcă RLS îi ascunde rândul care intră în
-- conflict, primește o eroare de bază de date despre un rând pe care nu-l vede.
-- Exact bug-ul pe care 036 îl reparase.
--
-- Ca migrație separată, nu editând 003: 003 a rulat deja pe bazele existente, iar
-- o migrație aplicată nu se rescrie. Pe o bază veche pașii de mai jos sunt fără
-- efect, fiindcă 036 a făcut deja aceeași lărgire — ceea ce e și dovada că sunt
-- sigure: lărgirea unei chei unice e strict mai permisivă.

UPDATE zvd_translation_keys
   SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
 WHERE tenant_id IS NULL;

ALTER TABLE zvd_translation_keys
  DROP CONSTRAINT IF EXISTS zvd_translation_keys_key_key;
ALTER TABLE zvd_translation_keys
  ADD CONSTRAINT zvd_translation_keys_key_key UNIQUE (tenant_id, key);

-- DOWN
-- Nu se pune la loc. Îngustarea ar eșua pe orice instanță unde două firme au
-- ajuns să folosească aceeași cheie — adică exact pe instanțele pe care această
-- migrație le-a reparat.
