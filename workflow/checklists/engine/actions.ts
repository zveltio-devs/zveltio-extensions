import {
	ActionRefusal,
	type ExtensionAction,
	todayIn,
} from "@zveltio/sdk/extension";

// What checklists does beyond plain edits, as actions (`POST /ext/workflow/checklists/actions/<name>`).
// Templates, their items, scoring schemes and recurrence schedules are plain
// edits through `/api/data`. A checklist, its items, its scores and a scheme's
// weights are written only by these actions (`writtenBy: actions`), so a tick
// always moves the checklist's completion and score with it. The engine runs
// each action as the caller, inside the request transaction: a refusal rolls
// back everything it wrote. Who may do what is the engine's rules on these
// collections; who ticked an item or completed a checklist is the row's
// `updated_by` and the audit log.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const T = "checklist_templates";
const TI = "checklist_template_items";
const C = "checklists";
const CI = "checklist_items";
const R = "checklist_recurrences";
const SC = "checklist_scoring_schemes";
const W = "checklist_scheme_weights";
const S = "checklist_scores";
const PAGE = 500;

/** A data API refusal of an `expect` (it comes as the engine's problem, not as an ActionRefusal); raised before anything is written. */
const lostRace = (err: unknown) => (err as { code?: unknown })?.code === "precondition_failed";

async function all(host: Host, collection: string, filter: Row): Promise<Row[]> {
	const out: Row[] = [];
	for (let page = 1; ; page++) {
		const res = await host.collections.list(collection, {
			filter,
			sort: "id",
			limit: PAGE,
			page,
			count: "none",
		});
		const rows = (res.records as Row[]) ?? [];
		out.push(...rows);
		if (rows.length < PAGE) return out;
	}
}

async function get(host: Host, collection: string, id: string, what: string) {
	const row = await host.collections.read(collection, id);
	if (!row)
		throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
	return row;
}

const byOrder = (a: Row, b: Row) => Number(a.order_idx) - Number(b.order_idx);

/**
 * `weighted_completion`: the weight of the checked items over the weight of
 * every item the scheme covers. An item the scheme gives no weight is outside
 * it, not a zero, so several schemes over one checklist each measure their
 * own part. Null when the scheme covers nothing on this checklist.
 */
export function weightedScore(
	items: Row[],
	weights: Map<string, number>,
	threshold: number | null,
) {
	let earned = 0;
	let possible = 0;
	const breakdown: Row[] = [];
	for (const item of items) {
		const weight = weights.get(String(item.template_item_id)) ?? 0;
		if (!item.template_item_id || weight === 0) continue;
		possible += weight;
		if (item.checked) earned += weight;
		breakdown.push({ label: item.label, weight, checked: Boolean(item.checked) });
	}
	if (possible === 0) return null;
	const score = Math.round((earned / possible) * 10000) / 100;
	return {
		score,
		passed: threshold === null ? null : score >= threshold,
		// Weights change; a score keeps what it was computed from.
		snapshot: { earned, possible, pass_threshold: threshold, items: breakdown },
	};
}

/**
 * The checklist, its row locked until the action commits (a write of the
 * value just read): a concurrent tick on a sibling item waits here, so the
 * completeness below is decided on a state that includes it.
 */
async function lockChecklist(host: Host, id: string): Promise<Row> {
	const { name } = await get(host, C, id, "checklist");
	await host.collections.update(C, id, { name });
	// Read again after the lock: the first read predates a concurrent tick's commit.
	return get(host, C, id, "checklist");
}

/**
 * Completion and score follow the items: complete once every required item is
 * checked (an unchecked one reopens it), and every active scheme of its
 * template rescored on each change, since optional items are often ticked
 * after the required ones. Call with the checklist locked.
 */
async function settle(host: Host, cl: Row): Promise<void> {
	const id = String(cl.id);
	const items = await all(host, CI, { checklist_id: id });
	const complete = items.filter((i) => i.required).every((i) => i.checked);
	if (complete && !cl.completed_at) {
		const now = new Date();
		await host.collections.update(C, id, {
			completed_at: now.toISOString(),
			time_to_complete_minutes: Math.round(
				(now.getTime() - Date.parse(String(cl.created_at))) / 60000,
			),
		});
	} else if (!complete && cl.completed_at) {
		await host.collections.update(C, id, {
			completed_at: null,
			time_to_complete_minutes: null,
		});
	}

	// An ad-hoc checklist is a list of things to do, not a measurement.
	if (!cl.template_id) return;
	const schemes = await all(host, SC, {
		template_id: String(cl.template_id),
		is_active: true,
	});
	for (const scheme of schemes) {
		const weights = await all(host, W, { scheme_id: String(scheme.id) });
		const result = weightedScore(
			items,
			new Map(weights.map((w) => [String(w.template_item_id), Number(w.weight)])),
			scheme.pass_threshold == null ? null : Number(scheme.pass_threshold),
		);
		if (!result) continue;
		const data = {
			scheme_name: scheme.name,
			method: scheme.method,
			...result,
			computed_at: new Date().toISOString(),
		};
		const [prior] = await all(host, S, {
			checklist_id: id,
			scheme_id: String(scheme.id),
		});
		if (prior) await host.collections.update(S, String(prior.id), data);
		else
			await host.collections.insert(S, {
				checklist_id: id,
				scheme_id: scheme.id,
				...data,
			});
	}
}

/** A checklist on a record, with its items copied from a template (keeping the link scoring needs) or given. */
async function createChecklist(
	host: Host,
	d: {
		collection: string;
		record_id: string;
		name: string;
		template?: Row;
		items?: Row[];
	},
): Promise<Row> {
	const checklist = await host.collections.insert(C, {
		template_id: d.template?.id ?? null,
		collection: d.collection,
		record_id: d.record_id,
		name: d.name,
	});
	const items = d.template
		? (await all(host, TI, { template_id: String(d.template.id) })).sort(byOrder)
		: (d.items ?? []);
	const created: Row[] = [];
	for (const [i, item] of items.entries()) {
		created.push(
			await host.collections.insert(CI, {
				checklist_id: checklist.id,
				template_item_id: d.template ? item.id : null,
				label: item.label,
				description: item.description ?? null,
				required: item.required ?? false,
				order_idx: item.order_idx ?? i,
				...(!d.template && {
					due_at: item.due_at ?? null,
					assignee_user_id: item.assignee_user_id ?? null,
				}),
			}),
		);
	}
	return { ...checklist, items: created };
}

/** A template still in use, for `collection`'s records when it names one. */
function usable(template: Row, collection: string) {
	if (template.is_active === false)
		throw new ActionRefusal(409, "template_inactive", "This template is no longer in use.");
	if (template.collection && template.collection !== collection)
		throw new ActionRefusal(409, "template_collection_mismatch", `This template is for ${template.collection}.`);
}

/**
 * Attaches a checklist to a record, from a template (whose collection, when
 * set, must be the record's) or from the items given.
 */
const attachChecklist: ExtensionAction = async (input, host) => {
	const d = input as {
		collection: string;
		record_id: string;
		name: string;
		template_id?: string;
		items?: Row[];
	};
	if (d.template_id && d.items)
		throw new ActionRefusal(400, "template_or_items", "A checklist comes from a template or from items, not both.");
	const template = d.template_id
		? await get(host, T, d.template_id, "template")
		: undefined;
	if (template) usable(template, d.collection);
	return createChecklist(host, { ...d, template });
};

const ITEM_FIELDS = ["time_spent_minutes", "notes", "assignee_user_id", "due_at"];

/** Ticks or unticks one item and edits its working fields; the checklist's completion and score follow. */
const updateItem: ExtensionAction = async (input, host) => {
	const d = input as { id: string; checked?: boolean } & Row;
	const item = await get(host, CI, d.id, "item");
	const cl = await lockChecklist(host, String(item.checklist_id));
	const data: Row = {};
	for (const k of ITEM_FIELDS) if (d[k] !== undefined) data[k] = d[k];
	if (d.checked !== undefined) {
		data.checked = d.checked;
		data.checked_at = d.checked ? new Date().toISOString() : null;
	}
	const updated = await host.collections.update(CI, d.id, data);
	// Only a tick moves completion; a note on a list with no required item does not complete it.
	if (d.checked !== undefined) await settle(host, cl);
	return updated;
};

/** Ticks or unticks several items at once: all of them or none. */
const checkItems: ExtensionAction = async (input, host) => {
	const d = input as { item_ids: string[]; checked: boolean };
	const ids = [...new Set(d.item_ids)];
	const items: Row[] = [];
	for (const id of ids) items.push(await get(host, CI, id, "item"));
	// Checklists locked in one order: two bulk ticks never deadlock.
	const checklistIds = [...new Set(items.map((i) => String(i.checklist_id)))].sort();
	const checklists = [];
	for (const id of checklistIds) checklists.push(await lockChecklist(host, id));
	const at = d.checked ? new Date().toISOString() : null;
	for (const id of ids)
		await host.collections.update(CI, id, { checked: d.checked, checked_at: at });
	for (const cl of checklists) await settle(host, cl);
	return { updated: ids.length };
};

/** Removes a checklist with its items and scores. */
const deleteChecklist: ExtensionAction = async (input, host) => {
	const { id } = input as { id: string };
	await get(host, C, id, "checklist");
	await host.collections.delete(C, id);
	return { deleted: id };
};

/**
 * Replaces a scheme's weights. A weight left out means the item is not part
 * of the scheme; every item must be one of the scheme's template.
 */
const setSchemeWeights: ExtensionAction = async (input, host) => {
	const d = input as {
		id: string;
		weights: { template_item_id: string; weight: number }[];
	};
	const scheme = await get(host, SC, d.id, "scheme");
	// Locked: a concurrent replacement waits, then replaces this one whole.
	await host.collections.update(SC, d.id, { name: scheme.name });
	const allowed = new Set(
		(await all(host, TI, { template_id: String(scheme.template_id) })).map((i) => String(i.id)),
	);
	const stray = d.weights.filter((w) => !allowed.has(w.template_item_id));
	if (stray.length)
		throw new ActionRefusal(400, "item_not_in_template", `${stray.length} item(s) do not belong to this scheme's template.`);
	if (new Set(d.weights.map((w) => w.template_item_id)).size !== d.weights.length)
		throw new ActionRefusal(400, "item_twice", "An item has one weight.");
	for (const w of await all(host, W, { scheme_id: d.id }))
		await host.collections.delete(W, String(w.id));
	for (const w of d.weights) await host.collections.insert(W, { scheme_id: d.id, ...w });
	return { count: d.weights.length };
};

/** `at` moved forward by one `frequency`; a month-end date ends on the last day of a shorter month. */
export function nextRun(at: Date, frequency: unknown): Date {
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

/**
 * Creates the checklist of every active schedule that is due and moves the
 * schedule past now: one checklist per run, however many runs were missed.
 * A schedule whose template is gone, inactive or for another collection is
 * skipped and reported, and stays due. Meant for a flow on a timer.
 */
const runDueRecurrences: ExtensionAction = async (_input, host) => {
	const now = new Date();
	const due = await all(host, R, {
		is_active: true,
		next_run_at: { lte: now.toISOString() },
	});
	const created: Row[] = [];
	const skipped: Row[] = [];
	for (const schedule of due) {
		const id = String(schedule.id);
		// Locked, then read again: a concurrent run waits here and then finds
		// the schedule already moved past now, so it creates nothing twice. A
		// schedule deactivated meanwhile fails the precondition and is left alone.
		const locked = await host.collections
			.update(R, id, { is_active: true }, { expect: { is_active: [true] } })
			.then(
				() => true,
				(err) => {
					if (lostRace(err)) return false;
					throw err;
				},
			);
		if (!locked) continue;
		const s = await get(host, R, id, "schedule");
		if (Date.parse(String(s.next_run_at)) > now.getTime()) continue;
		const template = await host.collections.read(T, String(s.template_id));
		try {
			if (!template) throw new ActionRefusal(404, "template_not_found", "No such template.");
			usable(template, String(s.collection));
		} catch (err) {
			// Raised before this schedule wrote anything; the others go ahead.
			skipped.push({ schedule_id: id, error: (err as ActionRefusal).code });
			continue;
		}
		const checklist = await createChecklist(host, {
			collection: String(s.collection),
			record_id: String(s.record_id),
			name: `${template.name} (${todayIn(host.timezone)})`,
			template,
		});
		let next = nextRun(new Date(String(s.next_run_at)), s.frequency);
		while (next <= now) next = nextRun(next, s.frequency);
		await host.collections.update(R, id, {
			last_run_at: now.toISOString(),
			next_run_at: next.toISOString(),
		});
		created.push({ schedule_id: id, checklist_id: checklist.id });
	}
	return { triggered: created.length, created, skipped };
};

export const checklistsActions: Record<string, ExtensionAction> = {
	attachChecklist,
	updateItem,
	checkItems,
	deleteChecklist,
	setSchemeWeights,
	runDueRecurrences,
};
