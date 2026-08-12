-- Mută comutatorul „documentație publică" din `zv_settings` într-un tabel al
-- extensiei.
--
-- Aceeași cauză ca la `auth/ldap` și `auth/saml`: `zv_settings` e tabel de
-- sistem al engine-ului, iar `ctx.db` îl refuză (regula D1). `getSettingValue`
-- avea `catch { return null }`, deci citirea lui `api_docs_public` returna
-- mereu `null` și `checkDocsAccess` cădea de fiecare dată pe ramura „cere
-- sesiune". Comutatorul nu putea fi pornit de nicăieri: nu era o setare pe
-- `false`, era una imposibil de citit.
--
-- Peste asta, `/` și `/openapi.json` stăteau după poarta fail-closed `/ext/*`,
-- deci un vizitator anonim primea 401 înainte ca `checkDocsAccess` să apuce să
-- decidă. Trei straturi peste aceeași funcție, fiecare suficient s-o anuleze.
--
-- `tenant_id` e cheia primară: fiecare firmă decide singură dacă îşi publică
-- documentaţia. `zv_settings.key` era global, deci a doua firmă de pe o instanţă
-- ar fi moştenit alegerea primei.

CREATE TABLE IF NOT EXISTS zvd_api_docs_config (
  tenant_id UUID NOT NULL DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id)
);

ALTER TABLE zvd_api_docs_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_api_docs_config FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zvd_api_docs_config ON zvd_api_docs_config;
CREATE POLICY tenant_isolation_zvd_api_docs_config ON zvd_api_docs_config
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- Preia alegerea existentă, dacă cineva a apucat s-o scrie în `zv_settings`
-- (prin UI-ul de setări al engine-ului — extensia n-a putut niciodată). Valoarea
-- e fie `true` boolean, fie şirul "true", fie un şir JSON care conţine una din
-- ele, fiindcă scrierile au trecut prin `JSON.stringify`.
INSERT INTO zvd_api_docs_config (tenant_id, is_public)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  CASE
    WHEN jsonb_typeof(value) = 'boolean' THEN (value)::text::boolean
    WHEN jsonb_typeof(value) = 'string'  THEN lower(value #>> '{}') IN ('true', '"true"')
    ELSE false
  END
FROM zv_settings
WHERE key = 'api_docs_public'
ON CONFLICT (tenant_id) DO NOTHING;

-- Rândul vechi din `zv_settings` rămâne pe loc: e al engine-ului, iar o migraţie
-- de extensie care şterge din tabelele lui e exact ce interzice regula D1.

-- DOWN
DROP POLICY IF EXISTS tenant_isolation_zvd_api_docs_config ON zvd_api_docs_config;
DROP TABLE IF EXISTS zvd_api_docs_config;
