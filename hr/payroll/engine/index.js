// @bun
// /zveltio-extension/packages/sdk/src/extension/action-refusal.ts
var ACTION_REFUSAL = Symbol.for("zveltio.extension.action-refusal");

class ActionRefusal extends Error {
  status;
  code;
  [ACTION_REFUSAL] = true;
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ActionRefusal";
  }
}
// /zveltio-extension/packages/sdk/src/extension/reserved-paths.ts
var RESERVED_PATH_SEGMENTS = Object.freeze([
  "api",
  "ext",
  "admin",
  "app",
  "auth",
  "_app",
  "_server",
  ".well-known",
  "robots.txt",
  "sitemap.xml"
]);
// engine/actions.ts
var PER = "payroll_periods";
var ENT = "payroll_entries";
var PAGE = 500;
var RO_RATES = {
  cas_employee: 0.25,
  cass_employee: 0.1,
  income_tax: 0.1,
  cas_employer: 0.04,
  cam_employer: 0.0225,
  personal_deduction_base: 500
};
var n = (v) => Number(v ?? 0);
var cents = (v) => Math.round(v * 100) / 100;
async function load(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}
async function all(host, collection, filter) {
  const out = [];
  for (let page = 1;; page++) {
    const res = await host.collections.list(collection, { filter, limit: PAGE, page, sort: "id", count: "none" });
    const recs = res.records ?? [];
    out.push(...recs);
    if (recs.length < PAGE)
      return out;
  }
}
async function loadRates(host) {
  const res = await host.collections.list("payroll_rates", { sort: "updated_at", order: "desc", limit: 1, count: "none" });
  const r = (res.records ?? [])[0];
  if (!r)
    return RO_RATES;
  return Object.fromEntries(Object.keys(RO_RATES).map((k) => [k, n(r[k])]));
}
function computeRO(input, rates = RO_RATES) {
  const {
    gross,
    personal_deduction = rates.personal_deduction_base,
    sick_leave_amount = 0,
    meal_vouchers = 0,
    overtime_amount = 0,
    night_shift_bonus = 0,
    taxable_bonuses = 0,
    deductions = 0
  } = input;
  const total_gross = gross + overtime_amount + night_shift_bonus + taxable_bonuses;
  const cas_employee = total_gross * rates.cas_employee;
  const cass_employee = total_gross * rates.cass_employee;
  const taxable_income = Math.max(0, total_gross - cas_employee - cass_employee - personal_deduction);
  const income_tax = taxable_income * rates.income_tax;
  const net_salary = total_gross - cas_employee - cass_employee - income_tax + meal_vouchers + sick_leave_amount - deductions;
  const cas_employer = total_gross * rates.cas_employer;
  const cam = total_gross * rates.cam_employer;
  return {
    gross_salary: gross,
    cas_employee: cents(cas_employee),
    cass_employee: cents(cass_employee),
    personal_deduction,
    taxable_income: cents(taxable_income),
    income_tax: cents(income_tax),
    net_salary: cents(net_salary),
    cas_employer: cents(cas_employer),
    cam: cents(cam),
    total_employer_cost: cents(total_gross + cas_employer + cam)
  };
}
async function terms(host, emp) {
  const [c] = await all(host, "employment_contracts", { employee_id: emp.id, status: "active" });
  return {
    employee_id: emp.id,
    employee_name: `${emp.first_name} ${emp.last_name}`,
    salary: n(c?.salary ?? emp.salary),
    salary_period: c?.salary_period ?? "month",
    weekly_hours: n(c?.weekly_hours ?? 40) || 40,
    national_id: emp.national_id ?? "",
    hire_date: c?.start_date ?? emp.hire_date ?? "",
    end_date: c?.end_date ?? emp.end_date ?? "",
    contract_id: c?.id ?? ""
  };
}
async function subjects(host) {
  const suspended = new Set((await all(host, "employment_contracts", { status: "suspended" })).map((c) => c.employee_id));
  const out = [];
  for (const e of await all(host, "employees", { status: "active" })) {
    if (e.employment_type === "contractor" || suspended.has(e.id))
      continue;
    out.push(await terms(host, e));
  }
  return out.sort((a, b) => a.employee_name.localeCompare(b.employee_name));
}
async function termsOf(host, employee_id) {
  return terms(host, await load(host, "employees", employee_id, "employee"));
}
async function openPeriod(host, id) {
  const p = await load(host, PER, id, "period");
  if (p.status !== "open" && p.status !== "calculated") {
    throw new ActionRefusal(409, "period_locked", "This period is approved or closed.");
  }
  return p;
}
var sum = (rows, k) => rows.reduce((s, r) => s + n(r[k]), 0);
var generatePayroll = async (input, host) => {
  const { period_id } = input;
  const p = await openPeriod(host, period_id);
  const rates = await loadRates(host);
  const of = async (c) => all(host, c, { period_id });
  const [sick, vouchers, overtime, existing] = await Promise.all([
    of("payroll_sick_leave"),
    of("payroll_meal_vouchers"),
    of("payroll_overtime"),
    of(ENT)
  ]);
  const mine = (rows, id) => rows.filter((r) => r.employee_id === id);
  let generated = 0;
  const skipped = [];
  for (const emp of await subjects(host)) {
    if (emp.salary_period !== "month") {
      skipped.push({ employee: emp.employee_name, reason: `salary_period=${emp.salary_period}` });
      continue;
    }
    const entry = existing.find((e) => e.employee_id === emp.employee_id);
    const adjs = entry ? await all(host, "payroll_adjustments", { entry_id: entry.id }) : [];
    const ot = mine(overtime, emp.employee_id);
    const figures = {
      sick_leave_days: sum(mine(sick, emp.employee_id), "days"),
      sick_leave_amount: cents(sum(mine(sick, emp.employee_id), "amount")),
      meal_vouchers_amount: cents(mine(vouchers, emp.employee_id).reduce((s, v) => s + n(v.quantity) * n(v.face_value), 0)),
      overtime_amount: cents(sum(ot.filter((o) => !o.is_night_shift), "amount")),
      night_shift_bonus: cents(sum(ot.filter((o) => o.is_night_shift), "amount")),
      taxable_bonuses: cents(sum(adjs.filter((a) => a.type === "bonus"), "amount")),
      deductions: cents(sum(adjs.filter((a) => a.type === "deduction" || a.type === "advance"), "amount"))
    };
    const calc = computeRO({ gross: emp.salary, ...figures, meal_vouchers: figures.meal_vouchers_amount }, rates);
    const row = {
      ...figures,
      ...calc,
      employee_name: emp.employee_name,
      cas_employee_rate: rates.cas_employee,
      cass_employee_rate: rates.cass_employee,
      income_tax_rate: rates.income_tax,
      cas_employer_rate: rates.cas_employer,
      cam_rate: rates.cam_employer
    };
    if (entry)
      await host.collections.update(ENT, entry.id, row, { expect: { status: ["draft"] } });
    else
      await host.collections.insert(ENT, { ...row, period_id, employee_id: emp.employee_id });
    generated++;
  }
  await host.collections.update(PER, period_id, { status: "calculated" }, { expect: { status: [p.status] } });
  return { generated, skipped };
};
async function advance(host, id, from, to, stamp, entries) {
  const p = await load(host, PER, id, "period");
  if (p.status !== from)
    throw new ActionRefusal(409, "period_not_ready", `Only a ${from} period can become ${to}.`);
  for (const e of await all(host, ENT, { period_id: id, status: entries[0] })) {
    await host.collections.update(ENT, e.id, entries[1]);
  }
  return host.collections.update(PER, id, { status: to, [stamp]: new Date().toISOString() }, { expect: { status: [from] } });
}
var approvePeriod = async (input, host) => advance(host, input.id, "calculated", "approved", "approved_at", ["draft", { status: "approved" }]);
var payPeriod = async (input, host) => advance(host, input.id, "approved", "closed", "paid_at", [
  "approved",
  { paid_at: new Date().toISOString() }
]);
var recordSickLeave = async (input, host) => {
  const d = input;
  await openPeriod(host, d.period_id);
  const t = await termsOf(host, d.employee_id);
  return host.collections.insert("payroll_sick_leave", { ...d, amount: cents(t.salary / 21.75 * d.days * 0.75) });
};
var recordOvertime = async (input, host) => {
  const d = input;
  await openPeriod(host, d.period_id);
  const t = await termsOf(host, d.employee_id);
  const mult = d.rate_multiplier ?? 1.75;
  const hourly = t.salary / (t.weekly_hours * 52 / 12);
  return host.collections.insert("payroll_overtime", { ...d, rate_multiplier: mult, amount: cents(hourly * d.hours * mult) });
};
var xml = (v) => String(v ?? "").replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
var exportD112 = async (input, host) => {
  const { period_id } = input;
  const p = await load(host, PER, period_id, "period");
  const ids = new Map;
  const lines = [];
  for (const e of await all(host, ENT, { period_id })) {
    if (!ids.has(e.employee_id))
      ids.set(e.employee_id, await host.collections.read("employees", e.employee_id) ?? {});
    const emp = ids.get(e.employee_id);
    const gross = n(e.gross_salary) + n(e.overtime_amount) + n(e.night_shift_bonus) + n(e.taxable_bonuses);
    lines.push(`
    <Declarant>
      <CIF>${xml(emp.national_id)}</CIF>
      <Nume>${xml(e.employee_name)}</Nume>
      <VenBrut>${gross.toFixed(2)}</VenBrut>
      <CASAngajat>${n(e.cas_employee).toFixed(2)}</CASAngajat>
      <CASSAngajat>${n(e.cass_employee).toFixed(2)}</CASSAngajat>
      <ImpozitVenit>${n(e.income_tax).toFixed(2)}</ImpozitVenit>
      <CASAngajator>${n(e.cas_employer).toFixed(2)}</CASAngajator>
      <CAM>${n(e.cam).toFixed(2)}</CAM>
      <NetPlata>${n(e.net_salary).toFixed(2)}</NetPlata>
    </Declarant>`);
  }
  const file_content = `<?xml version="1.0" encoding="UTF-8"?>
<D112 xmlns="mfp:anaf:dgti:d112:declaratie:v3">
  <Antet>
    <PerioadaRaportare>${p.year}-${String(p.month).padStart(2, "0")}</PerioadaRaportare>
    <TipDeclaratie>N</TipDeclaratie>
  </Antet>
  <Declaranti>${lines.join("")}
  </Declaranti>
</D112>`;
  return host.collections.insert("payroll_exports", { period_id, type: "d112", file_content });
};
var csv = (v) => {
  const raw = String(v ?? "");
  const safe = /^[=+\-@\t\r]/.test(raw) && !/^[+-]?\d+(\.\d+)?$/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};
var exportRevisal = async (_input, host) => {
  const rows = (await subjects(host)).map((e) => {
    const cut = e.employee_name.lastIndexOf(" ");
    const first = cut === -1 ? e.employee_name : e.employee_name.slice(0, cut);
    const last = cut === -1 ? "" : e.employee_name.slice(cut + 1);
    return [e.national_id, last, first, e.hire_date, e.contract_id, e.salary, e.salary_period, e.end_date].map(csv).join(",");
  });
  const file_content = ["CNP,Nume,Prenume,DataAngajare,FunctieId,Salariu,ContractTip,DataSfarsit", ...rows].join(`
`);
  return host.collections.insert("payroll_exports", { type: "revisal", file_content });
};
var simulate = async (input, host) => {
  const d = input;
  const rates = await loadRates(host);
  return { ...computeRO({ ...d, gross: d.gross_salary }, rates), rates };
};
var payrollActions = {
  generatePayroll,
  approvePeriod,
  payPeriod,
  recordSickLeave,
  recordOvertime,
  exportD112,
  exportRevisal,
  simulate
};

// engine/index.ts
var extension = {
  name: "hr/payroll",
  category: "hr",
  mountStrategy: "subapp",
  actions: payrollActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
