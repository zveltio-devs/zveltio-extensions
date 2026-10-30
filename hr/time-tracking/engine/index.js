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
var P = "time_projects";
var E = "time_entries";
var T = "active_timers";
var PAGE = 500;
async function load(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}
async function timerOf(host, employee_id) {
  const res = await host.collections.list(T, { filter: { employee_id }, limit: 1, count: "none" });
  return (res.records ?? [])[0] ?? null;
}
async function insertEntry(host, d) {
  const project = await load(host, P, d.project_id, "project");
  return host.collections.insert(E, { ...d, hourly_rate: project.hourly_rate });
}
var logTime = async (input, host) => insertEntry(host, input);
var startTimer = async (input, host) => {
  const d = input;
  await load(host, P, d.project_id, "project");
  const data = { task_description: "", is_billable: true, notes: null, ...d, started_at: new Date().toISOString() };
  const running = await timerOf(host, d.employee_id);
  return running ? host.collections.update(T, running.id, data) : host.collections.insert(T, data);
};
var stopTimer = async (input, host) => {
  const { employee_id } = input;
  const t = await timerOf(host, employee_id);
  if (!t)
    throw new ActionRefusal(409, "no_timer", "This employee has no running timer.");
  await host.collections.delete(T, t.id);
  const end = new Date;
  const duration_minutes = Math.round((end.getTime() - new Date(t.started_at).getTime()) / 60000);
  if (duration_minutes < 1)
    return { discarded: true };
  return insertEntry(host, {
    employee_id,
    project_id: t.project_id,
    task_description: t.task_description,
    is_billable: t.is_billable,
    notes: t.notes ?? null,
    date: end.toISOString().slice(0, 10),
    start_time: t.started_at,
    end_time: end.toISOString(),
    duration_minutes
  });
};
var computeTimesheet = async (input, host) => {
  const { employee_id, week_start } = input;
  const end = new Date(`${week_start}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  const week_end = end.toISOString().slice(0, 10);
  let minutes = 0;
  for (let page = 1;; page++) {
    const res = await host.collections.list(E, {
      filter: { employee_id, date: { gte: week_start } },
      limit: PAGE,
      page,
      sort: "id",
      count: "none"
    });
    const recs = res.records ?? [];
    for (const e of recs)
      if (String(e.date).slice(0, 10) <= week_end)
        minutes += Number(e.duration_minutes);
    if (recs.length < PAGE)
      break;
  }
  const total_hours = Math.round(minutes / 60 * 100) / 100;
  const found = await host.collections.list("timesheets", { filter: { employee_id, week_start }, limit: 1, count: "none" });
  const sheet = (found.records ?? [])[0];
  if (!sheet)
    return host.collections.insert("timesheets", { employee_id, week_start, week_end, total_hours });
  if (sheet.status !== "draft")
    throw new ActionRefusal(409, "timesheet_not_draft", "Only a draft timesheet is recomputed.");
  return host.collections.update("timesheets", sheet.id, { total_hours }, { expect: { status: ["draft"] } });
};
var timeTrackingActions = { logTime, startTimer, stopTimer, computeTimesheet };

// engine/index.ts
var extension = {
  name: "hr/time-tracking",
  category: "hr",
  mountStrategy: "subapp",
  actions: timeTrackingActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
