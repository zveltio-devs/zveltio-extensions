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
var ASSETS = "assets";
var SCHEDULE = "asset_depreciation";
var TRIES = 5;
var n = (v) => Number(v ?? 0);
var round2 = (v) => Math.round(v * 100) / 100;
var busy = (err) => err.code === "precondition_failed";
var day = (v) => String(v).slice(0, 10);
async function load(host, id) {
  const row = await host.collections.read(ASSETS, id);
  if (!row)
    throw new ActionRefusal(404, "asset_not_found", "No such asset.");
  return row;
}
async function active(host, id) {
  const a = await load(host, id);
  if (a.status !== "active")
    throw new ActionRefusal(409, "asset_disposed", "The asset is disposed.");
  return a;
}
async function change(host, id, patch) {
  for (let attempt = 0;attempt < TRIES; attempt++) {
    const a = await active(host, id);
    try {
      return await host.collections.update(ASSETS, id, patch(a), {
        expect: {
          status: ["active"],
          current_value: [String(a.current_value)],
          accumulated_depreciation: [String(a.accumulated_depreciation)],
          location: [a.location ?? null]
        }
      });
    } catch (err) {
      if (!busy(err))
        throw err;
    }
  }
  throw new ActionRefusal(409, "asset_busy", "The asset is being changed by other requests; try again.");
}
function schedule(d) {
  const rows = [];
  const start = new Date(`${day(d.purchase_date)}T00:00:00Z`);
  let book = d.purchase_cost;
  for (let year = 1;year <= d.useful_life_years; year++) {
    const period = new Date(start);
    period.setUTCFullYear(start.getUTCFullYear() + year);
    const left = d.useful_life_years - year + 1;
    let amount = d.depreciation_method === "straight_line" ? round2((d.purchase_cost - d.residual_value) / d.useful_life_years) : round2(Math.max(book * 2 / d.useful_life_years, (book - d.residual_value) / left));
    if (year === d.useful_life_years || book - amount < d.residual_value)
      amount = round2(Math.max(book - d.residual_value, 0));
    book = round2(book - amount);
    rows.push({ period_date: period.toISOString().slice(0, 10), amount, book_value_after: book });
  }
  return rows;
}
var createAsset = async (input, host) => {
  const d = input;
  const residual_value = round2(d.residual_value ?? 0);
  if (residual_value >= d.purchase_cost) {
    throw new ActionRefusal(400, "residual_too_high", "The residual value is below the purchase cost.");
  }
  const depreciation_method = d.depreciation_method ?? "straight_line";
  const purchase_cost = round2(d.purchase_cost);
  const asset = await host.collections.insert(ASSETS, {
    ...d,
    residual_value,
    depreciation_method,
    purchase_cost,
    current_value: purchase_cost
  });
  for (const row of schedule({ ...d, purchase_cost, residual_value, depreciation_method })) {
    await host.collections.insert(SCHEDULE, { asset_id: asset.id, ...row });
  }
  return asset;
};
var postDepreciation = async (input, host) => {
  const d = input;
  const a = await active(host, d.asset_id);
  const res = await host.collections.list(SCHEDULE, { filter: { asset_id: d.asset_id, period_date: d.period_date }, limit: 1, count: "none" });
  const dep = (res.records ?? [])[0];
  if (!dep)
    throw new ActionRefusal(404, "period_not_found", "The asset has no depreciation for that period.");
  if (dep.is_posted)
    throw new ActionRefusal(409, "period_posted", "That period is already posted.");
  if (!a.depreciation_account_id || !a.accumulated_dep_account_id) {
    throw new ActionRefusal(409, "accounts_missing", "The asset needs a depreciation and an accumulated depreciation account.");
  }
  if (!host.actions)
    throw new ActionRefusal(409, "engine_too_old", "This engine cannot run another extension's action.");
  const amount = n(dep.amount);
  await host.collections.update(SCHEDULE, String(dep.id), { is_posted: true }, { expect: { is_posted: [false] } }).catch((err) => {
    throw busy(err) ? new ActionRefusal(409, "period_posted", "That period is already posted.") : err;
  });
  const entry = await host.actions.run("finance/accounting", "createEntry", {
    date: d.journal_date ?? d.period_date,
    description: `Depreciation: ${a.name}`,
    reference: `DEP-${dep.id}`,
    lines: [
      { account_id: a.depreciation_account_id, debit: amount, credit: 0, description: "Depreciation expense" },
      { account_id: a.accumulated_dep_account_id, debit: 0, credit: amount, description: "Accumulated depreciation" }
    ]
  });
  await host.actions.run("finance/accounting", "postEntry", { id: entry.id });
  await host.collections.update(SCHEDULE, String(dep.id), { journal_entry_id: entry.id });
  await change(host, d.asset_id, (x) => ({
    accumulated_depreciation: round2(n(x.accumulated_depreciation) + amount),
    current_value: round2(n(x.current_value) - amount)
  }));
  return entry;
};
var disposeAsset = async (input, host) => {
  const d = input;
  return change(host, d.id, () => ({
    status: "disposed",
    disposed_at: d.disposal_date,
    disposal_value: round2(d.disposal_value ?? 0),
    disposal_reason: d.reason ?? null,
    current_value: 0
  }));
};
var transferAsset = async (input, host) => {
  const d = input;
  let from = null;
  await change(host, d.id, (a) => {
    from = a.location ?? null;
    return { location: d.to_location };
  });
  return host.collections.insert("asset_transfers", {
    asset_id: d.id,
    from_location: from,
    to_location: d.to_location,
    transfer_date: d.transfer_date,
    reason: d.reason ?? null
  });
};
var revalueAsset = async (input, host) => {
  const d = input;
  let previous = 0;
  await change(host, d.id, (a) => {
    previous = n(a.current_value);
    return { current_value: round2(d.new_value) };
  });
  return host.collections.insert("asset_revaluations", {
    asset_id: d.id,
    revaluation_date: d.revaluation_date,
    previous_value: previous,
    new_value: round2(d.new_value),
    method: d.method ?? "market",
    notes: d.notes ?? null
  });
};
var assetsActions = {
  createAsset,
  postDepreciation,
  disposeAsset,
  transferAsset,
  revalueAsset
};

// engine/index.ts
var extension = {
  name: "operations/assets",
  category: "operations",
  mountStrategy: "subapp",
  actions: assetsActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
