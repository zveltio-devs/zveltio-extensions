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
var E = "employees";
var K = "employment_contracts";
var LIVE = ["active", "suspended"];
async function load(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}
async function records(host, collection, filter, limit = 500) {
  const page = await host.collections.list(collection, { filter, limit, sort: "id", count: "none" });
  return page.records ?? [];
}
async function project(host, contract) {
  if (contract.status !== "active")
    return;
  const emp = await load(host, E, contract.employee_id, "employee");
  await host.collections.update(E, emp.id, {
    salary: contract.salary ?? null,
    currency: contract.currency,
    hire_date: contract.start_date,
    end_date: contract.end_date ?? null,
    probation_end_date: contract.probation_end_date ?? null,
    position_id: contract.position_id ?? emp.position_id ?? null,
    department_id: contract.department_id ?? emp.department_id ?? null,
    ...emp.status === "terminated" && { status: "active" }
  });
}
var hire = async (input, host) => {
  const { salary_type = "gross", ...d } = input;
  const last = await host.collections.list(E, { sort: "employee_number", order: "desc", limit: 1, count: "none" });
  const lastNumber = String(last.records[0]?.employee_number ?? "EMP-000000");
  const employee_number = `EMP-${String((Number.parseInt(lastNumber.slice(4), 10) || 0) + 1).padStart(6, "0")}`;
  const emp = await host.collections.insert(E, { ...d, employee_number, status: "active" });
  if (d.salary != null) {
    await host.collections.insert("salary_history", {
      employee_id: emp.id,
      effective_date: d.hire_date,
      salary: d.salary,
      salary_type,
      currency: emp.currency,
      reason: "Initial salary"
    });
  }
  return emp;
};
var terminate = async (input, host) => {
  const { id, end_date, reason } = input;
  const emp = await load(host, E, id, "employee");
  if (emp.status === "terminated")
    throw new ActionRefusal(409, "employee_terminated", "This employee is already terminated.");
  return host.collections.update(E, id, { status: "terminated", end_date, ...reason && { notes: reason } }, { expect: { status: [emp.status] } });
};
var setSalary = async (input, host) => {
  const { id, ...d } = input;
  const emp = await load(host, E, id, "employee");
  if ((await records(host, K, { employee_id: id, status: { in: LIVE } }, 1)).length) {
    throw new ActionRefusal(409, "contract_live", "This employee has an active contract: amend it to change the salary.");
  }
  const currency = d.currency ?? emp.currency;
  const row = await host.collections.insert("salary_history", { employee_id: id, ...d, currency });
  await host.collections.update(E, id, { salary: d.salary, currency });
  return row;
};
var addEmergencyContact = async (input, host) => {
  const { employee_id, ...d } = input;
  await load(host, E, employee_id, "employee");
  if (d.is_primary) {
    for (const c of await records(host, "employee_emergency_contacts", { employee_id, is_primary: true })) {
      await host.collections.update("employee_emergency_contacts", c.id, { is_primary: false });
    }
  }
  return host.collections.insert("employee_emergency_contacts", { employee_id, ...d });
};
var submitReview = async (input, host) => {
  const { id, ...d } = input;
  const review = await load(host, "performance_reviews", id, "review");
  if (review.status !== "pending")
    throw new ActionRefusal(409, "review_not_pending", "Only a pending review can be submitted.");
  return host.collections.update("performance_reviews", id, { ...d, status: "submitted", submitted_at: new Date().toISOString() }, { expect: { status: ["pending"] } });
};
var acknowledgeReview = async (input, host) => {
  const { id } = input;
  const review = await load(host, "performance_reviews", id, "review");
  if (review.status !== "submitted")
    throw new ActionRefusal(409, "review_not_submitted", "Only a submitted review can be acknowledged.");
  return host.collections.update("performance_reviews", id, { status: "acknowledged", acknowledged_at: new Date().toISOString() }, { expect: { status: ["submitted"] } });
};
var signContract = async (input, host) => {
  const d = input;
  if (d.contract_type === "fixed_term" && !d.end_date) {
    throw new ActionRefusal(400, "end_date_required", "A fixed-term contract needs an end date.");
  }
  if (d.end_date && d.end_date < d.start_date) {
    throw new ActionRefusal(400, "end_before_start", "The end date is before the start date.");
  }
  await load(host, E, d.employee_id, "employee");
  if ((await records(host, K, { employee_id: d.employee_id, status: { in: LIVE } }, 1)).length) {
    throw new ActionRefusal(409, "contract_live", "This employee already has an active contract. End it, or amend it.");
  }
  const contract = await host.collections.insert(K, { ...d, status: "active" });
  await project(host, contract);
  return contract;
};
var amendContract = async (input, host) => {
  const { id, changes, ...d } = input;
  const contract = await load(host, K, id, "contract");
  if (contract.status === "ended")
    throw new ActionRefusal(409, "contract_ended", "An ended contract cannot be amended.");
  await host.collections.insert("contract_amendments", { contract_id: id, changes, ...d });
  const updated = await host.collections.update(K, id, changes, { expect: { status: [contract.status] } });
  if (changes.salary !== undefined) {
    await host.collections.insert("salary_history", {
      employee_id: contract.employee_id,
      effective_date: d.effective_date,
      salary: changes.salary,
      currency: changes.currency ?? contract.currency,
      reason: `Amendment ${d.amendment_number}${d.reason ? ` \u2014 ${d.reason}` : ""}`
    });
  }
  await project(host, updated);
  return updated;
};
var suspendContract = async (input, host) => {
  const { id, ...d } = input;
  const contract = await load(host, K, id, "contract");
  if (contract.status !== "active")
    throw new ActionRefusal(409, "contract_not_active", "Only an active contract can be suspended.");
  await host.collections.update(K, id, { status: "suspended" }, { expect: { status: ["active"] } });
  return host.collections.insert("contract_suspensions", { contract_id: id, ...d });
};
var resumeContract = async (input, host) => {
  const { id, end_date } = input;
  const open = await records(host, "contract_suspensions", { contract_id: id, end_date: { null: true } }, 1);
  if (!open.length)
    throw new ActionRefusal(409, "contract_not_suspended", "This contract is not suspended.");
  await host.collections.update("contract_suspensions", open[0].id, { end_date });
  return host.collections.update(K, id, { status: "active" }, { expect: { status: ["suspended"] } });
};
var endContract = async (input, host) => {
  const { id, ended_at, end_reason_code, notes } = input;
  const contract = await load(host, K, id, "contract");
  if (contract.status === "ended")
    throw new ActionRefusal(409, "contract_ended", "This contract has already ended.");
  const ended = await host.collections.update(K, id, { status: "ended", ended_at, end_date: contract.end_date ?? ended_at, end_reason_code: end_reason_code ?? null, end_notes: notes ?? null }, { expect: { status: [contract.status] } });
  const employee_id = contract.employee_id;
  if (!(await records(host, K, { employee_id, status: { in: LIVE } }, 1)).length) {
    await host.collections.update(E, employee_id, { status: "terminated", end_date: ended_at });
  }
  return ended;
};
var employeesActions = {
  hire,
  terminate,
  setSalary,
  addEmergencyContact,
  submitReview,
  acknowledgeReview,
  signContract,
  amendContract,
  suspendContract,
  resumeContract,
  endContract
};

// engine/index.ts
var extension = {
  name: "hr/employees",
  category: "hr",
  mountStrategy: "subapp",
  actions: employeesActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
