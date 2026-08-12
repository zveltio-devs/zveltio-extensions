-- Mută configurația SAML din `zv_settings` într-un tabel al extensiei.
--
-- Aceeași cauză ca la `auth/ldap` (migrația 004 de acolo), găsită prin aceeași
-- metodă: `zv_settings` e tabel de sistem al engine-ului, iar `ctx.db` îl refuză
-- (regula D1). Deci `selectFrom('zv_settings')` arunca pe FIECARE rută —
-- `POST /config` răspundea 500, iar `/login`, `/callback` și `/metadata`
-- raportau „not configured", fiindcă `catch { return null }` din `getSamlConfig`
-- transformă un tabel refuzat, o capabilitate neaprobată și o decriptare eșuată
-- în același răspuns.
--
-- Reparația NU e un grant pe `zv_settings`: grantul e per TABEL, nu per cheie,
-- deci extensia de autentificare ar fi căpătat acces la configurația de mail, la
-- cea LDAP și la orice altă setare de instanță. Cheia privată a SP-ului stă
-- aici; cu ea se semnează AuthnRequest-urile, deci cine o citește poate
-- impersona acest Service Provider.
--
-- Cheia primară e `tenant_id`: o configurație per firmă. Vechea cheie
-- `zv_settings.key` era globală, deci a doua firmă de pe o instanță partajată nu
-- putea avea propriul IdP — aceeași clasă pe care migrația 003 a reparat-o în
-- tabelele `zvd_saml_*` și a ratat-o aici, fiindcă a fost căutată doar acolo.

CREATE TABLE IF NOT EXISTS zvd_saml_config (
  tenant_id UUID NOT NULL DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id)
);

ALTER TABLE zvd_saml_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_saml_config FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zvd_saml_config ON zvd_saml_config;
CREATE POLICY tenant_isolation_zvd_saml_config ON zvd_saml_config
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- Preia o configurație existentă, dacă instalarea a apucat să aibă una (rutele
-- scriau în `zv_settings` înainte ca restricția de tabel să existe).
--
-- Codul vechi făcea `JSON.stringify(...)` într-o coloană `jsonb`, deci valoarea
-- e un ȘIR JSON care conține JSON, nu un obiect. `jsonb_typeof` distinge cele
-- două forme; fără asta configurația preluată ar fi ilizibilă pentru codul nou.
INSERT INTO zvd_saml_config (tenant_id, config)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  CASE WHEN jsonb_typeof(value) = 'string' THEN (value #>> '{}')::jsonb ELSE value END
FROM zv_settings
WHERE key = 'saml_config'
ON CONFLICT (tenant_id) DO NOTHING;

-- Rândul vechi din `zv_settings` rămâne pe loc, intenționat: e al engine-ului,
-- iar o migrație de extensie care șterge rânduri din tabelele lui e exact ce
-- interzice regula D1. Cheia privată de acolo e criptată (`enc:v1:`). Se curăță
-- manual, dacă se dorește.

-- DOWN
DROP POLICY IF EXISTS tenant_isolation_zvd_saml_config ON zvd_saml_config;
DROP TABLE IF EXISTS zvd_saml_config;
