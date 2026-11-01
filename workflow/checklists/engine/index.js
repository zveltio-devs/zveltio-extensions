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
var T = "checklist_templates";
var TI = "checklist_template_items";
var C = "checklists";
var CI = "checklist_items";
var R = "checklist_recurrences";
var SC = "checklist_scoring_schemes";
var W = "checklist_scheme_weights";
var S = "checklist_scores";
var PAGE = 500;
var lostRace = (err) => err?.code === "precondition_failed";
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
var byOrder = (a, b) => Number(a.order_idx) - Number(b.order_idx);
function weightedScore(items, weights, threshold) {
  let earned = 0;
  let possible = 0;
  const breakdown = [];
  for (const item of items) {
    const weight = weights.get(String(item.template_item_id)) ?? 0;
    if (!item.template_item_id || weight === 0)
      continue;
    possible += weight;
    if (item.checked)
      earned += weight;
    breakdown.push({ label: item.label, weight, checked: Boolean(item.checked) });
  }
  if (possible === 0)
    return null;
  const score = Math.round(earned / possible * 1e4) / 100;
  return {
    score,
    passed: threshold === null ? null : score >= threshold,
    snapshot: { earned, possible, pass_threshold: threshold, items: breakdown }
  };
}
async function lockChecklist(host, id) {
  const { name } = await get(host, C, id, "checklist");
  await host.collections.update(C, id, { name });
  return get(host, C, id, "checklist");
}
async function settle(host, cl) {
  const id = String(cl.id);
  const items = await all(host, CI, { checklist_id: id });
  const complete = items.filter((i) => i.required).every((i) => i.checked);
  if (complete && !cl.completed_at) {
    const now = new Date;
    await host.collections.update(C, id, {
      completed_at: now.toISOString(),
      time_to_complete_minutes: Math.round((now.getTime() - Date.parse(String(cl.created_at))) / 60000)
    });
  } else if (!complete && cl.completed_at) {
    await host.collections.update(C, id, {
      completed_at: null,
      time_to_complete_minutes: null
    });
  }
  if (!cl.template_id)
    return;
  const schemes = await all(host, SC, {
    template_id: String(cl.template_id),
    is_active: true
  });
  for (const scheme of schemes) {
    const weights = await all(host, W, { scheme_id: String(scheme.id) });
    const result = weightedScore(items, new Map(weights.map((w) => [String(w.template_item_id), Number(w.weight)])), scheme.pass_threshold == null ? null : Number(scheme.pass_threshold));
    if (!result)
      continue;
    const data = {
      scheme_name: scheme.name,
      method: scheme.method,
      ...result,
      computed_at: new Date().toISOString()
    };
    const [prior] = await all(host, S, {
      checklist_id: id,
      scheme_id: String(scheme.id)
    });
    if (prior)
      await host.collections.update(S, String(prior.id), data);
    else
      await host.collections.insert(S, {
        checklist_id: id,
        scheme_id: scheme.id,
        ...data
      });
  }
}
async function createChecklist(host, d) {
  const checklist = await host.collections.insert(C, {
    template_id: d.template?.id ?? null,
    collection: d.collection,
    record_id: d.record_id,
    name: d.name
  });
  const items = d.template ? (await all(host, TI, { template_id: String(d.template.id) })).sort(byOrder) : d.items ?? [];
  const created = [];
  for (const [i, item] of items.entries()) {
    created.push(await host.collections.insert(CI, {
      checklist_id: checklist.id,
      template_item_id: d.template ? item.id : null,
      label: item.label,
      description: item.description ?? null,
      required: item.required ?? false,
      order_idx: item.order_idx ?? i,
      ...!d.template && {
        due_at: item.due_at ?? null,
        assignee_user_id: item.assignee_user_id ?? null
      }
    }));
  }
  return { ...checklist, items: created };
}
function usable(template, collection) {
  if (template.is_active === false)
    throw new ActionRefusal(409, "template_inactive", "This template is no longer in use.");
  if (template.collection && template.collection !== collection)
    throw new ActionRefusal(409, "template_collection_mismatch", `This template is for ${template.collection}.`);
}
var attachChecklist = async (input, host) => {
  const d = input;
  if (d.template_id && d.items)
    throw new ActionRefusal(400, "template_or_items", "A checklist comes from a template or from items, not both.");
  const template = d.template_id ? await get(host, T, d.template_id, "template") : undefined;
  if (template)
    usable(template, d.collection);
  return createChecklist(host, { ...d, template });
};
var ITEM_FIELDS = ["time_spent_minutes", "notes", "assignee_user_id", "due_at"];
var updateItem = async (input, host) => {
  const d = input;
  const item = await get(host, CI, d.id, "item");
  const cl = await lockChecklist(host, String(item.checklist_id));
  const data = {};
  for (const k of ITEM_FIELDS)
    if (d[k] !== undefined)
      data[k] = d[k];
  if (d.checked !== undefined) {
    data.checked = d.checked;
    data.checked_at = d.checked ? new Date().toISOString() : null;
  }
  const updated = await host.collections.update(CI, d.id, data);
  if (d.checked !== undefined)
    await settle(host, cl);
  return updated;
};
var checkItems = async (input, host) => {
  const d = input;
  const ids = [...new Set(d.item_ids)];
  const items = [];
  for (const id of ids)
    items.push(await get(host, CI, id, "item"));
  const checklistIds = [...new Set(items.map((i) => String(i.checklist_id)))].sort();
  const checklists = [];
  for (const id of checklistIds)
    checklists.push(await lockChecklist(host, id));
  const at = d.checked ? new Date().toISOString() : null;
  for (const id of ids)
    await host.collections.update(CI, id, { checked: d.checked, checked_at: at });
  for (const cl of checklists)
    await settle(host, cl);
  return { updated: ids.length };
};
var deleteChecklist = async (input, host) => {
  const { id } = input;
  await get(host, C, id, "checklist");
  await host.collections.delete(C, id);
  return { deleted: id };
};
var setSchemeWeights = async (input, host) => {
  const d = input;
  const scheme = await get(host, SC, d.id, "scheme");
  await host.collections.update(SC, d.id, { name: scheme.name });
  const allowed = new Set((await all(host, TI, { template_id: String(scheme.template_id) })).map((i) => String(i.id)));
  const stray = d.weights.filter((w) => !allowed.has(w.template_item_id));
  if (stray.length)
    throw new ActionRefusal(400, "item_not_in_template", `${stray.length} item(s) do not belong to this scheme's template.`);
  if (new Set(d.weights.map((w) => w.template_item_id)).size !== d.weights.length)
    throw new ActionRefusal(400, "item_twice", "An item has one weight.");
  for (const w of await all(host, W, { scheme_id: d.id }))
    await host.collections.delete(W, String(w.id));
  for (const w of d.weights)
    await host.collections.insert(W, { scheme_id: d.id, ...w });
  return { count: d.weights.length };
};
function nextRun(at, frequency) {
  const d = new Date(at);
  if (frequency === "daily" || frequency === "weekly") {
    d.setUTCDate(d.getUTCDate() + (frequency === "daily" ? 1 : 7));
    return d;
  }
  const months = frequency === "quarterly" ? 3 : 1;
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}
var runDueRecurrences = async (_input, host) => {
  const now = new Date;
  const due = await all(host, R, {
    is_active: true,
    next_run_at: { lte: now.toISOString() }
  });
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
    const template = await host.collections.read(T, String(s.template_id));
    try {
      if (!template)
        throw new ActionRefusal(404, "template_not_found", "No such template.");
      usable(template, String(s.collection));
    } catch (err) {
      skipped.push({ schedule_id: id, error: err.code });
      continue;
    }
    const checklist = await createChecklist(host, {
      collection: String(s.collection),
      record_id: String(s.record_id),
      name: `${template.name} (${todayIn(host.timezone)})`,
      template
    });
    let next = nextRun(new Date(String(s.next_run_at)), s.frequency);
    while (next <= now)
      next = nextRun(next, s.frequency);
    await host.collections.update(R, id, {
      last_run_at: now.toISOString(),
      next_run_at: next.toISOString()
    });
    created.push({ schedule_id: id, checklist_id: checklist.id });
  }
  return { triggered: created.length, created, skipped };
};
var checklistsActions = {
  attachChecklist,
  updateItem,
  checkItems,
  deleteChecklist,
  setSchemeWeights,
  runDueRecurrences
};

// engine/index.ts
var extension = {
  name: "workflow/checklists",
  category: "workflow",
  mountStrategy: "subapp",
  actions: checklistsActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
