-- Cotele legale devin date, nu constante compilate.
--
-- `RO_RATES` era un obiect literal în `routes.ts`, marcat „RO 2024 statutory
-- rates", iar `computeRO(input, rates = RO_RATES)` are un parametru pe care
-- niciun apel nu-l folosea. Deci cotele erau împachetate în bundle: o schimbare
-- legislativă — și se schimbă în fiecare an — cerea o versiune nouă de extensie,
-- livrată prin registry, pe fiecare instalare. Un contabil care ȘTIE noua cotă
-- nu avea unde s-o scrie.
--
-- Valorile de start sunt exact cele din cod, deci nimic nu se schimbă la
-- instalare. Ce se schimbă e că de acum se pot corecta.
--
-- Fără datare pe intervale, deliberat: fiecare rând din `zvd_payroll_entries`
-- își păstrează cotele cu care a fost calculat (`cas_employee_rate` și
-- celelalte), deci o perioadă închisă nu se rescrie când cotele se schimbă. Ce
-- e aici înseamnă „cotele de acum înainte".
--
-- `tenant_id` e cheia primară: pe o instanță cu mai multe firme, fiecare își
-- poate avea propriile cote — un angajator cu condiții deosebite de muncă
-- datorează CAS 4%, unul cu condiții normale nu datorează deloc, iar asta e o
-- proprietate a firmei, nu a instalării.

CREATE TABLE IF NOT EXISTS zvd_payroll_rates (
  tenant_id UUID NOT NULL DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  cas_employee            NUMERIC(6,4) NOT NULL DEFAULT 0.2500,
  cass_employee           NUMERIC(6,4) NOT NULL DEFAULT 0.1000,
  income_tax              NUMERIC(6,4) NOT NULL DEFAULT 0.1000,
  cas_employer            NUMERIC(6,4) NOT NULL DEFAULT 0.0400,
  cam_employer            NUMERIC(6,4) NOT NULL DEFAULT 0.0225,
  personal_deduction_base NUMERIC(12,2) NOT NULL DEFAULT 500,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id)
);

ALTER TABLE zvd_payroll_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_rates FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zvd_payroll_rates ON zvd_payroll_rates;
CREATE POLICY tenant_isolation_zvd_payroll_rates ON zvd_payroll_rates
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- DOWN
DROP POLICY IF EXISTS tenant_isolation_zvd_payroll_rates ON zvd_payroll_rates;
DROP TABLE IF EXISTS zvd_payroll_rates;
