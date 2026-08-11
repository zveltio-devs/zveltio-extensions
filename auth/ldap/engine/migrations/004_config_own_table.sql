-- Mută configurația LDAP din `zv_settings` într-un tabel al extensiei.
--
-- `zv_settings` e tabel de sistem al engine-ului. `ctx.db` îl refuză (regula
-- D1), deci `selectFrom('zv_settings')` arunca ExtensionSecurityError pe FIECARE
-- rută: salvarea răspundea 500, iar citirea, autentificarea și testul raportau
-- „not configured" fiindcă eroarea era înghițită. Extensia nu a putut autentifica
-- pe nimeni, pe nicio instalare.
--
-- Reparația NU e un grant pe `zv_settings` în engine: grant-ul e per TABEL, nu
-- per cheie, deci ar fi dat extensiei de autentificare acces la configurația de
-- mail, la cea SAML și la orice altă setare de instanță. Extensia își ține
-- propriile date în propriul tabel.
--
-- Cheia primară e `tenant_id`: o configurație per firmă, nu una pe toată
-- instanța. Vechea cheie `zv_settings.key` era globală (fără `tenant_id`), deci
-- a doua firmă de pe o instanță partajată nu putea avea propriul director —
-- exact clasa reparată de migrația 003, ratată atunci fiindcă a fost căutată
-- doar în tabelele `zvd_ldap_*`.

CREATE TABLE IF NOT EXISTS zvd_ldap_config (
  tenant_id UUID NOT NULL DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id)
);

ALTER TABLE zvd_ldap_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_ldap_config FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zvd_ldap_config ON zvd_ldap_config;
CREATE POLICY tenant_isolation_zvd_ldap_config ON zvd_ldap_config
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- Preia o configurație existentă, dacă instalarea a apucat să aibă una (rutele
-- scriau în `zv_settings` înainte ca restricția de tabel să existe).
--
-- Codul vechi făcea `JSON.stringify(...)` într-o coloană `jsonb`, deci valoarea
-- e un ȘIR JSON care conține JSON, nu un obiect. `jsonb_typeof` distinge cele
-- două forme; fără asta, configurația preluată ar fi ilizibilă pentru codul nou.
INSERT INTO zvd_ldap_config (tenant_id, config)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  CASE WHEN jsonb_typeof(value) = 'string' THEN (value #>> '{}')::jsonb ELSE value END
FROM zv_settings
WHERE key = 'ldap_config'
ON CONFLICT (tenant_id) DO NOTHING;

-- Rândul vechi din `zv_settings` rămâne pe loc, intenționat: e al engine-ului,
-- iar o migrație de extensie care șterge rânduri din tabelele engine-ului e
-- exact lucrul pe care regula D1 îl interzice. Parola de bind de acolo e
-- criptată (`enc:v1:`). Se curăță manual, dacă se dorește.

-- DOWN
DROP POLICY IF EXISTS tenant_isolation_zvd_ldap_config ON zvd_ldap_config;
DROP TABLE IF EXISTS zvd_ldap_config;
