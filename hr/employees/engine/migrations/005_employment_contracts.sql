-- Contractul de muncă devine o entitate, nu câteva câmpuri plate pe angajat.
--
-- Până acum, ce leagă un om de firmă erau `hire_date`, `end_date`,
-- `employment_type`, `salary` și `probation_end_date`, direct pe
-- `zvd_employees`. Cu ele nu se poate reprezenta nimic din ce se întâmplă
-- efectiv într-un dosar de personal:
--
--   * un contract pe durată determinată prelungit printr-un act adițional;
--   * o normă parțială, sau o trecere de la 8 ore la 4;
--   * o suspendare pentru creșterea copilului, și revenirea din ea;
--   * al doilea contract al aceleiași persoane la aceeași firmă;
--   * ce anume s-a schimbat la 1 aprilie, cine a semnat și pe ce document.
--
-- Istoricul salarial exista deja (`zvd_salary_history`), dar nu era legat de
-- niciun act — o mărire apărea ca un rând fără document în spate.
--
-- ── Neutru față de țară, deliberat ──────────────────────────────────────────
--
-- Nimic aici nu e românesc. `contract_type` are cele două forme care există
-- peste tot (durată nedeterminată / determinată); norma e în ore pe săptămână,
-- nu în „normă întreagă"; iar temeiul încetării e un COD LIBER
-- (`end_reason_code`), nu o listă de articole dintr-un cod al muncii anume.
--
-- Vocabularul acelor coduri îl aduce o extensie de țară, pe același tipar ca
-- `identity.nationalId`: modulul de HR ține contractele, țara aduce regulile.
-- Un `end_reason_code` necunoscut e acceptat — o instanță nu trebuie să aștepte
-- o extensie ca să poată încheia un contract.
--
-- ── Câmpurile plate rămân ───────────────────────────────────────────────────
--
-- `zvd_employees.salary` și fraţii lui NU se șterg. `hr/payroll` citește
-- `salary` de acolo la fiecare generare de stat, iar `hr/leave` și organigrama
-- citesc `status`. Contractul activ le SINCRONIZEAZĂ în schimb — o singură
-- sursă de adevăr, cu o proiecție păstrată pentru consumatorii de azi.
--
-- Ștergerea lor e un al doilea pas, după ce fiecare consumator trece pe
-- contract. Făcută acum, ar rupe salarizarea în tăcere.

CREATE TABLE IF NOT EXISTS zvd_employment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES zvd_employees(id) ON DELETE CASCADE,

  -- Numărul din registrul propriu al firmei. Text, fiindcă formatul e al
  -- fiecărei firme; unic pe firmă, nu pe instanță.
  contract_number TEXT NOT NULL,

  contract_type TEXT NOT NULL DEFAULT 'indefinite'
    CHECK (contract_type IN ('indefinite', 'fixed_term')),

  start_date DATE NOT NULL,
  -- Obligatoriu în fapt pentru `fixed_term`, verificat în rută ca să dea un
  -- mesaj util în loc de o constrângere.
  end_date DATE,
  probation_end_date DATE,

  -- Norma. În ore pe săptămână, ca part-time-ul să fie un număr, nu o etichetă.
  weekly_hours NUMERIC(5,2) NOT NULL DEFAULT 40,

  salary NUMERIC(14,2),
  currency TEXT NOT NULL DEFAULT 'RON',
  salary_period TEXT NOT NULL DEFAULT 'month'
    CHECK (salary_period IN ('hour', 'day', 'month', 'year')),

  position_id UUID REFERENCES zvd_job_positions(id) ON DELETE SET NULL,
  department_id UUID REFERENCES zvd_departments(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'suspended', 'ended')),

  signed_at TIMESTAMPTZ,
  ended_at DATE,
  -- Codul temeiului de încetare. Vocabularul e al țării, nu al acestui modul.
  end_reason_code TEXT,
  end_notes TEXT,

  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id UUID NOT NULL DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Numărul de contract e unic PE FIRMĂ. Fără `tenant_id` în cheie, a doua firmă
-- de pe o instanță nu poate avea contractul nr. 1 — exact clasa reparată în
-- campania de chei unice.
CREATE UNIQUE INDEX IF NOT EXISTS zvd_employment_contracts_number_key
  ON zvd_employment_contracts (tenant_id, contract_number);
CREATE INDEX IF NOT EXISTS idx_zvd_employment_contracts_employee
  ON zvd_employment_contracts (employee_id, status);

-- ── Acte adiționale ─────────────────────────────────────────────────────────
--
-- Ce s-a schimbat, de când, și pe ce document. `changes` e liber pentru că un
-- act adițional poate atinge orice — salariu, normă, funcție, durată — și
-- fiecare combinație e legitimă.
CREATE TABLE IF NOT EXISTS zvd_contract_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES zvd_employment_contracts(id) ON DELETE CASCADE,
  amendment_number TEXT NOT NULL,
  effective_date DATE NOT NULL,
  changes JSONB NOT NULL DEFAULT '{}',
  reason TEXT,
  signed_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id UUID NOT NULL DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid)
);

CREATE UNIQUE INDEX IF NOT EXISTS zvd_contract_amendments_number_key
  ON zvd_contract_amendments (tenant_id, contract_id, amendment_number);

-- ── Suspendări ──────────────────────────────────────────────────────────────
--
-- `end_date` NULL înseamnă „în curs". Codul motivului e tot al țării.
CREATE TABLE IF NOT EXISTS zvd_contract_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES zvd_employment_contracts(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  reason_code TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id UUID NOT NULL DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid)
);

CREATE INDEX IF NOT EXISTS idx_zvd_contract_suspensions_contract
  ON zvd_contract_suspensions (contract_id, end_date);

-- ── Izolare pe firmă ────────────────────────────────────────────────────────
ALTER TABLE zvd_employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_employment_contracts FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_zvd_employment_contracts ON zvd_employment_contracts;
CREATE POLICY tenant_isolation_zvd_employment_contracts ON zvd_employment_contracts
  USING (zveltio_tenant_scope_ok(tenant_id)) WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

ALTER TABLE zvd_contract_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_contract_amendments FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_zvd_contract_amendments ON zvd_contract_amendments;
CREATE POLICY tenant_isolation_zvd_contract_amendments ON zvd_contract_amendments
  USING (zveltio_tenant_scope_ok(tenant_id)) WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

ALTER TABLE zvd_contract_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_contract_suspensions FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_zvd_contract_suspensions ON zvd_contract_suspensions;
CREATE POLICY tenant_isolation_zvd_contract_suspensions ON zvd_contract_suspensions
  USING (zveltio_tenant_scope_ok(tenant_id)) WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- ── Preluarea a ce există deja ──────────────────────────────────────────────
--
-- Fiecare angajat cu o dată de angajare primește un contract construit din
-- câmpurile lui plate. Numărul e derivat din `employee_number` ca să fie unic și
-- recognoscibil; firma îl poate schimba după.
--
-- Fără asta, o instalare existentă ar arăta zero contracte pentru oameni care
-- lucrează de ani de zile, iar prima impresie ar fi că funcția nu merge.
INSERT INTO zvd_employment_contracts (
  employee_id, contract_number, contract_type, start_date, end_date,
  probation_end_date, salary, currency, position_id, department_id, status, tenant_id
)
SELECT
  e.id,
  'CTR-' || COALESCE(NULLIF(e.employee_number, ''), LEFT(e.id::text, 8)),
  CASE WHEN e.end_date IS NOT NULL THEN 'fixed_term' ELSE 'indefinite' END,
  e.hire_date,
  e.end_date,
  e.probation_end_date,
  e.salary,
  COALESCE(e.currency, 'RON'),
  e.position_id,
  e.department_id,
  CASE WHEN e.status = 'terminated' THEN 'ended' ELSE 'active' END,
  e.tenant_id
FROM zvd_employees e
WHERE e.hire_date IS NOT NULL
ON CONFLICT DO NOTHING;

-- DOWN
DROP TABLE IF EXISTS zvd_contract_suspensions;
DROP TABLE IF EXISTS zvd_contract_amendments;
DROP TABLE IF EXISTS zvd_employment_contracts;
