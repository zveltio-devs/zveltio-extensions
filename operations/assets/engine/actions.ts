import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';

// What the asset register does beyond plain edits, as actions
// (`POST /ext/operations/assets/actions/<name>`). The engine runs each as the
// caller, inside the request transaction, through the data API
// (`host.collections`): a refusal rolls back everything the action wrote.
// An asset's cost, life, method, value, location and disposal, its
// depreciation schedule, revaluations and transfers are written only here
// (`writtenBy`); its name, code, serial, accounts, maintenance and insurance
// are plain edits through `/api/data`. A depreciation is posted to the ledger
// through accounting's `createEntry` and `postEntry` (`host.actions.run`,
// manifest `calls`), in the same transaction. Who may do what is the engine's
// rules on these collections, not this file's.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const ASSETS = 'assets';
const SCHEDULE = 'asset_depreciation';
const TRIES = 5;

const n = (v: unknown) => Number(v ?? 0);
const round2 = (v: number) => Math.round(v * 100) / 100;
const busy = (err: unknown) => (err as { code?: unknown }).code === 'precondition_failed';
/** A `date` may come back as an ISO timestamp; the day is what counts. */
const day = (v: unknown) => String(v).slice(0, 10);

async function load(host: Host, id: string) {
  const row = await host.collections.read(ASSETS, id);
  if (!row) throw new ActionRefusal(404, 'asset_not_found', 'No such asset.');
  return row;
}

async function active(host: Host, id: string) {
  const a = await load(host, id);
  if (a.status !== 'active') throw new ActionRefusal(409, 'asset_disposed', 'The asset is disposed.');
  return a;
}

/**
 * Write `change(asset)` only if nobody changed the asset's value, depreciation,
 * location or status since it was read: a posting and a revaluation at once
 * cannot both start from the same value.
 */
async function change(host: Host, id: string, patch: (a: Row) => Row) {
  for (let attempt = 0; attempt < TRIES; attempt++) {
    const a = await active(host, id);
    try {
      return await host.collections.update(ASSETS, id, patch(a), {
        expect: {
          status: ['active'],
          current_value: [String(a.current_value)],
          accumulated_depreciation: [String(a.accumulated_depreciation)],
          location: [(a.location as string | null) ?? null],
        },
      });
    } catch (err) {
      if (!busy(err)) throw err;
    }
  }
  throw new ActionRefusal(409, 'asset_busy', 'The asset is being changed by other requests; try again.');
}

/**
 * One row per year of useful life; the last year lands exactly on the residual
 * value. Declining balance is double the straight-line rate, switching to
 * straight line on what is left once that writes down more.
 */
export function schedule(d: { purchase_date: string; purchase_cost: number; residual_value: number; useful_life_years: number; depreciation_method: string }) {
  const rows: { period_date: string; amount: number; book_value_after: number }[] = [];
  const start = new Date(`${day(d.purchase_date)}T00:00:00Z`);
  let book = d.purchase_cost;
  for (let year = 1; year <= d.useful_life_years; year++) {
    const period = new Date(start);
    period.setUTCFullYear(start.getUTCFullYear() + year);
    const left = d.useful_life_years - year + 1;
    let amount =
      d.depreciation_method === 'straight_line'
        ? round2((d.purchase_cost - d.residual_value) / d.useful_life_years)
        : round2(Math.max((book * 2) / d.useful_life_years, (book - d.residual_value) / left));
    if (year === d.useful_life_years || book - amount < d.residual_value) amount = round2(Math.max(book - d.residual_value, 0));
    book = round2(book - amount);
    rows.push({ period_date: period.toISOString().slice(0, 10), amount, book_value_after: book });
  }
  return rows;
}

const createAsset: ExtensionAction = async (input, host) => {
  const d = input as Row & { purchase_date: string; purchase_cost: number; useful_life_years: number; residual_value?: number; depreciation_method?: string };
  const residual_value = round2(d.residual_value ?? 0);
  if (residual_value >= d.purchase_cost) {
    throw new ActionRefusal(400, 'residual_too_high', 'The residual value is below the purchase cost.');
  }
  const depreciation_method = d.depreciation_method ?? 'straight_line';
  const purchase_cost = round2(d.purchase_cost);
  const asset = await host.collections.insert(ASSETS, {
    ...d,
    residual_value,
    depreciation_method,
    purchase_cost,
    current_value: purchase_cost,
  });
  // An asset without its schedule never depreciates: there is no period to post.
  for (const row of schedule({ ...d, purchase_cost, residual_value, depreciation_method })) {
    await host.collections.insert(SCHEDULE, { asset_id: asset.id, ...row });
  }
  return asset;
};

const postDepreciation: ExtensionAction = async (input, host) => {
  const d = input as { asset_id: string; period_date: string; journal_date?: string };
  const a = await active(host, d.asset_id);
  const res = await host.collections.list(SCHEDULE, { filter: { asset_id: d.asset_id, period_date: d.period_date }, limit: 1, count: 'none' });
  const dep = ((res.records as Row[]) ?? [])[0];
  if (!dep) throw new ActionRefusal(404, 'period_not_found', 'The asset has no depreciation for that period.');
  if (dep.is_posted) throw new ActionRefusal(409, 'period_posted', 'That period is already posted.');
  if (!a.depreciation_account_id || !a.accumulated_dep_account_id) {
    throw new ActionRefusal(409, 'accounts_missing', 'The asset needs a depreciation and an accumulated depreciation account.');
  }
  if (!host.actions) throw new ActionRefusal(409, 'engine_too_old', "This engine cannot run another extension's action.");
  const amount = n(dep.amount);
  // Claimed under the precondition first, so the same period is never posted twice.
  await host.collections.update(SCHEDULE, String(dep.id), { is_posted: true }, { expect: { is_posted: [false] } }).catch((err) => {
    throw busy(err) ? new ActionRefusal(409, 'period_posted', 'That period is already posted.') : err;
  });
  const entry = (await host.actions.run('finance/accounting', 'createEntry', {
    date: d.journal_date ?? d.period_date,
    description: `Depreciation: ${a.name}`,
    reference: `DEP-${dep.id}`,
    lines: [
      { account_id: a.depreciation_account_id, debit: amount, credit: 0, description: 'Depreciation expense' },
      { account_id: a.accumulated_dep_account_id, debit: 0, credit: amount, description: 'Accumulated depreciation' },
    ],
  })) as Row;
  await host.actions.run('finance/accounting', 'postEntry', { id: entry.id });
  await host.collections.update(SCHEDULE, String(dep.id), { journal_entry_id: entry.id });
  await change(host, d.asset_id, (x) => ({
    accumulated_depreciation: round2(n(x.accumulated_depreciation) + amount),
    // Down by the amount, not to the schedule's book value: a revaluation stands.
    current_value: round2(n(x.current_value) - amount),
  }));
  return entry;
};

const disposeAsset: ExtensionAction = async (input, host) => {
  const d = input as { id: string; disposal_date: string; disposal_value?: number; reason?: string };
  return change(host, d.id, () => ({
    status: 'disposed',
    disposed_at: d.disposal_date,
    disposal_value: round2(d.disposal_value ?? 0),
    disposal_reason: d.reason ?? null,
    current_value: 0,
  }));
};

const transferAsset: ExtensionAction = async (input, host) => {
  const d = input as { id: string; to_location: string; transfer_date: string; reason?: string };
  // The move and its record are one act: no asset somewhere without a trail.
  let from: unknown = null;
  await change(host, d.id, (a) => {
    from = a.location ?? null;
    return { location: d.to_location };
  });
  return host.collections.insert('asset_transfers', {
    asset_id: d.id,
    from_location: from,
    to_location: d.to_location,
    transfer_date: d.transfer_date,
    reason: d.reason ?? null,
  });
};

const revalueAsset: ExtensionAction = async (input, host) => {
  const d = input as { id: string; revaluation_date: string; new_value: number; method?: string; notes?: string };
  // The revaluation is the reason for the new value: both, or neither.
  let previous = 0;
  await change(host, d.id, (a) => {
    previous = n(a.current_value);
    return { current_value: round2(d.new_value) };
  });
  return host.collections.insert('asset_revaluations', {
    asset_id: d.id,
    revaluation_date: d.revaluation_date,
    previous_value: previous,
    new_value: round2(d.new_value),
    method: d.method ?? 'market',
    notes: d.notes ?? null,
  });
};

export const assetsActions: Record<string, ExtensionAction> = {
  createAsset,
  postDepreciation,
  disposeAsset,
  transferAsset,
  revalueAsset,
};
