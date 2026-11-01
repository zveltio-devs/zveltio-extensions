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
// /zveltio-extension/packages/sdk/src/extension/dates.ts
function todayIn(timeZone, now = new Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
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
var F = "forms";
var S = "form_submissions";
var A = "form_answers";
var R = "form_recurrences";
var PAGE = 500;
var WORKING = ["notes", "assignee_user_id", "due_at", "time_spent_minutes"];
var lostRace = (err) => err?.code === "precondition_failed";
var empty = (v) => v === undefined || v === null || v === "" || Array.isArray(v) && v.length === 0;
var encode = (v) => v === undefined || v === null ? null : JSON.stringify(v);
var decode = (v) => v == null ? null : JSON.parse(String(v));
var answered = (f, v) => f.type === "checkbox" ? v === true : !empty(v);
async function all(host, collection, filter) {
  const out = [];
  for (let page = 1;; page++) {
    const res = await host.collections.list(collection, {
      filter,
      sort: "id",
      limit: PAGE,
      page,
      count: "none"
    });
    const rows = res.records ?? [];
    out.push(...rows);
    if (rows.length < PAGE)
      return out;
  }
}
async function get(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}
function fieldsOf(form) {
  let fields = form.fields;
  try {
    if (typeof fields === "string")
      fields = JSON.parse(fields);
  } catch {
    fields = null;
  }
  if (!Array.isArray(fields))
    throw new ActionRefusal(409, "form_fields_invalid", "This form's fields are not a list; fix the form.");
  return fields;
}
function answers(fields, data) {
  const list = fieldsOf({ fields });
  const missing = list.filter((f) => f.required && !answered(f, data[f.id])).map((f) => f.label ?? f.id);
  if (missing.length)
    throw new ActionRefusal(422, "missing_fields", `Missing required fields: ${missing.join(", ")}`);
  const ids = new Set(list.map((f) => f.id));
  return Object.fromEntries(Object.entries(data).filter(([k]) => ids.has(k)));
}
function score(fields, values, threshold) {
  let earned = 0;
  let possible = 0;
  const items = [];
  for (const f of fields) {
    const weight = Number(f.weight ?? 0);
    if (!(weight > 0))
      continue;
    const ok = answered(f, values[f.id]);
    possible += weight;
    if (ok)
      earned += weight;
    items.push({ field_id: f.id, label: f.label ?? f.id, weight, answered: ok });
  }
  if (possible === 0)
    return { score: null, passed: null, score_snapshot: null };
  const value = Math.round(earned / possible * 1e4) / 100;
  return {
    score: value,
    passed: threshold === null ? null : value >= threshold,
    score_snapshot: { earned, possible, pass_threshold: threshold, items }
  };
}
var thresholdOf = (form) => form.pass_threshold == null ? null : Number(form.pass_threshold);
async function settle(host, sub, form) {
  const fields = fieldsOf(form);
  const values = {};
  for (const a of await all(host, A, { submission_id: String(sub.id) }))
    values[String(a.field_id)] = decode(a.value);
  const data = Object.fromEntries(fields.filter((f) => (f.id in values)).map((f) => [f.id, values[f.id]]));
  const complete = fields.every((f) => !f.required || answered(f, values[f.id]));
  const now = new Date;
  await host.collections.update(S, String(sub.id), {
    data,
    ...score(fields, values, thresholdOf(form)),
    ...complete && !sub.completed_at ? {
      completed_at: now.toISOString(),
      time_to_complete_minutes: Math.round((now.getTime() - Date.parse(String(sub.created_at))) / 60000)
    } : {},
    ...!complete && sub.completed_at ? { completed_at: null, time_to_complete_minutes: null } : {}
  });
}
async function lockOpen(host, id) {
  const { form_id } = await get(host, S, id, "submission");
  await host.collections.update(S, id, { form_id });
  const sub = await get(host, S, id, "submission");
  if (!sub.record_id)
    throw new ActionRefusal(409, "submission_closed", "A one-shot submission is not edited afterwards.");
  return sub;
}
function usable(form, collection) {
  if (form.active === false)
    throw new ActionRefusal(409, "form_inactive", "This form is no longer in use.");
  if (form.collection && form.collection !== collection)
    throw new ActionRefusal(409, "form_collection_mismatch", `This form is for ${form.collection}.`);
}
async function attachTo(host, form, d) {
  const fields = fieldsOf(form);
  const sub = await host.collections.insert(S, {
    form_id: form.id,
    collection: d.collection,
    record_id: d.record_id,
    name: d.name ?? form.name,
    data: {}
  });
  for (const f of fields)
    await host.collections.insert(A, {
      submission_id: sub.id,
      field_id: f.id,
      value: null,
      assignee_user_id: f.assignee ?? null
    });
  await settle(host, sub, form);
  return sub;
}
var submit = async (input, host) => {
  const d = input;
  const res = await host.collections.list(F, {
    filter: { slug: d.slug, active: true },
    limit: 1,
    count: "none"
  });
  const form = (res.records ?? [])[0];
  if (!form)
    throw new ActionRefusal(404, "form_not_found", "No such form.");
  if (form.collection)
    throw new ActionRefusal(409, "form_for_records", `This form is filled on records of ${form.collection}.`);
  const fields = fieldsOf(form);
  const data = answers(fields, d.data);
  const now = new Date().toISOString();
  const submission = await host.collections.insert(S, {
    form_id: form.id,
    data,
    completed_at: now,
    time_to_complete_minutes: 0,
    ...score(fields, data, thresholdOf(form))
  });
  for (const [field_id, value] of Object.entries(data))
    await host.collections.insert(A, {
      submission_id: submission.id,
      field_id,
      value: encode(value),
      answered_at: now
    });
  return { submission_id: submission.id };
};
var attach = async (input, host) => {
  const d = input;
  const form = await get(host, F, d.form_id, "form");
  usable(form, d.collection);
  return attachTo(host, form, d);
};
var answer = async (input, host) => {
  const d = input;
  const sub = await lockOpen(host, d.submission_id);
  const form = await get(host, F, String(sub.form_id), "form");
  const fields = new Map(fieldsOf(form).map((f) => [f.id, f]));
  const stray = Object.keys(d.answers).filter((k) => !fields.has(k));
  if (stray.length)
    throw new ActionRefusal(400, "field_not_in_form", `Not fields of this form: ${stray.join(", ")}`);
  const rows = new Map((await all(host, A, { submission_id: d.submission_id })).map((a) => [String(a.field_id), a]));
  const now = new Date().toISOString();
  for (const [field_id, value] of Object.entries(d.answers)) {
    const data = { value: encode(value), answered_at: answered(fields.get(field_id), value) ? now : null };
    const row = rows.get(field_id);
    if (row)
      await host.collections.update(A, String(row.id), data);
    else
      await host.collections.insert(A, { submission_id: d.submission_id, field_id, ...data });
  }
  await settle(host, sub, form);
  return { updated: Object.keys(d.answers).length };
};
var updateAnswer = async (input, host) => {
  const d = input;
  const row = await get(host, A, d.id, "answer");
  const sub = await lockOpen(host, String(row.submission_id));
  const form = await get(host, F, String(sub.form_id), "form");
  const data = {};
  for (const k of WORKING)
    if (d[k] !== undefined)
      data[k] = d[k];
  if (d.value !== undefined) {
    const field = fieldsOf(form).find((f) => f.id === row.field_id) ?? { id: String(row.field_id) };
    data.value = encode(d.value);
    data.answered_at = answered(field, d.value) ? new Date().toISOString() : null;
  }
  const updated = await host.collections.update(A, d.id, data);
  if (d.value !== undefined)
    await settle(host, sub, form);
  return updated;
};
var deleteSubmission = async (input, host) => {
  const { id } = input;
  await get(host, S, id, "submission");
  await host.collections.delete(S, id);
  return { deleted: id };
};
var lastDay = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
function nextRun(at, frequency) {
  const d = new Date(at);
  if (frequency === "daily" || frequency === "weekly") {
    d.setUTCDate(d.getUTCDate() + (frequency === "daily" ? 1 : 7));
    return d;
  }
  const months = frequency === "quarterly" ? 3 : 1;
  const day = d.getUTCDate();
  const monthEnd = day === lastDay(d.getUTCFullYear(), d.getUTCMonth());
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = lastDay(d.getUTCFullYear(), d.getUTCMonth());
  d.setUTCDate(monthEnd ? last : Math.min(day, last));
  return d;
}
var runDueRecurrences = async (_input, host) => {
  const now = new Date;
  const due = await all(host, R, { is_active: true, next_run_at: { lte: now.toISOString() } });
  const created = [];
  const skipped = [];
  for (const schedule of due) {
    const id = String(schedule.id);
    const locked = await host.collections.update(R, id, { is_active: true }, { expect: { is_active: [true] } }).then(() => true, (err) => {
      if (lostRace(err))
        return false;
      throw err;
    });
    if (!locked)
      continue;
    const s = await get(host, R, id, "schedule");
    if (Date.parse(String(s.next_run_at)) > now.getTime())
      continue;
    const form = await host.collections.read(F, String(s.form_id));
    try {
      if (!form)
        throw new ActionRefusal(404, "form_not_found", "No such form.");
      usable(form, String(s.collection));
      fieldsOf(form);
    } catch (err) {
      skipped.push({ schedule_id: id, error: err.code });
      continue;
    }
    const sub = await attachTo(host, form, {
      collection: String(s.collection),
      record_id: String(s.record_id),
      name: `${form.name} (${todayIn(host.timezone)})`
    });
    let next = nextRun(new Date(String(s.next_run_at)), s.frequency);
    while (next <= now)
      next = nextRun(next, s.frequency);
    await host.collections.update(R, id, { last_run_at: now.toISOString(), next_run_at: next.toISOString() });
    created.push({ schedule_id: id, submission_id: sub.id });
  }
  return { triggered: created.length, created, skipped };
};
var formsActions = {
  submit,
  attach,
  answer,
  updateAnswer,
  deleteSubmission,
  runDueRecurrences
};

// engine/index.ts
var extension = {
  name: "forms",
  category: "forms",
  mountStrategy: "subapp",
  actions: formsActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
