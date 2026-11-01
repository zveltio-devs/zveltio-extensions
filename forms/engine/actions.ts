import {
	ActionRefusal,
	type ExtensionAction,
	todayIn,
} from "@zveltio/sdk/extension";

// What forms does beyond plain edits, as actions (`POST /ext/forms/actions/<name>`).
// A form, its fields and its recurrence schedules are plain edits through
// `/api/data`. A response (`form_submissions`) and its answers
// (`form_answers`, one row per field) are written only by these actions
// (`writtenBy: actions`), so an answer always moves the response's completion,
// score and `data` with it. A response is either one-shot (`submit`: every
// required field at once, closed afterwards) or attached to a record
// (`attach`) and filled field by field (`answer`, `updateAnswer`). The engine
// runs each action as the caller, inside the request transaction: a refusal
// rolls back everything it wrote. A public form is a page holding an API key
// the operator issues; what the key may read and run is the engine's rules on
// these collections. Who answered is the row's `updated_by` and the audit log.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;
type Field = {
	id: string;
	label?: string;
	type?: string;
	required?: boolean;
	weight?: number;
	assignee?: string;
};

const F = "forms";
const S = "form_submissions";
const A = "form_answers";
const R = "form_recurrences";
const PAGE = 500;
const WORKING = ["notes", "assignee_user_id", "due_at", "time_spent_minutes"];

/** A data API refusal of an `expect` (it comes as the engine's problem, not as an ActionRefusal); raised before anything is written. */
const lostRace = (err: unknown) => (err as { code?: unknown })?.code === "precondition_failed";

const empty = (v: unknown) =>
	v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

// An answer's `value` is JSON text: a `json` field holds an object or a list,
// and an answer is as often `true` or `"ok"`. Null is no answer.
const encode = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));
const decode = (v: unknown) => (v == null ? null : JSON.parse(String(v)));

/** A checkbox is answered when ticked; any other field when it holds something. */
const answered = (f: Field, v: unknown) => (f.type === "checkbox" ? v === true : !empty(v));

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
	if (!row) throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
	return row;
}

/** The form's fields; a form whose fields are not a list would keep no answer at all. */
function fieldsOf(form: Row): Field[] {
	let fields = form.fields;
	try {
		if (typeof fields === "string") fields = JSON.parse(fields);
	} catch {
		fields = null;
	}
	if (!Array.isArray(fields))
		throw new ActionRefusal(409, "form_fields_invalid", "This form's fields are not a list; fix the form.");
	return fields as Field[];
}

/**
 * The answers to keep: only the form's own field ids, every required one
 * answered. Refuses with the labels of the missing ones.
 */
export function answers(fields: unknown, data: Row): Row {
	const list = fieldsOf({ fields });
	const missing = list.filter((f) => f.required && !answered(f, data[f.id])).map((f) => f.label ?? f.id);
	if (missing.length)
		throw new ActionRefusal(422, "missing_fields", `Missing required fields: ${missing.join(", ")}`);
	const ids = new Set(list.map((f) => f.id));
	return Object.fromEntries(Object.entries(data).filter(([k]) => ids.has(k)));
}

/**
 * Weighted completion: the weight of the answered fields over the weight of
 * every weighted field. Null when no field has a weight. Weights change with
 * the form; a score keeps what it was computed from.
 */
export function score(fields: Field[], values: Row, threshold: number | null) {
	let earned = 0;
	let possible = 0;
	const items: Row[] = [];
	for (const f of fields) {
		const weight = Number(f.weight ?? 0);
		if (!(weight > 0)) continue;
		const ok = answered(f, values[f.id]);
		possible += weight;
		if (ok) earned += weight;
		items.push({ field_id: f.id, label: f.label ?? f.id, weight, answered: ok });
	}
	if (possible === 0) return { score: null, passed: null, score_snapshot: null };
	const value = Math.round((earned / possible) * 10000) / 100;
	return {
		score: value,
		passed: threshold === null ? null : value >= threshold,
		score_snapshot: { earned, possible, pass_threshold: threshold, items },
	};
}

const thresholdOf = (form: Row) => (form.pass_threshold == null ? null : Number(form.pass_threshold));

/**
 * Completion, score and `data` follow the answers: complete once every
 * required field is answered (an emptied one reopens it). Call with the
 * response locked.
 */
async function settle(host: Host, sub: Row, form: Row): Promise<void> {
	const fields = fieldsOf(form);
	const values: Row = {};
	for (const a of await all(host, A, { submission_id: String(sub.id) })) values[String(a.field_id)] = decode(a.value);
	const data = Object.fromEntries(fields.filter((f) => f.id in values).map((f) => [f.id, values[f.id]]));
	const complete = fields.every((f) => !f.required || answered(f, values[f.id]));
	const now = new Date();
	await host.collections.update(S, String(sub.id), {
		data,
		...score(fields, values, thresholdOf(form)),
		...(complete && !sub.completed_at
			? {
					completed_at: now.toISOString(),
					time_to_complete_minutes: Math.round((now.getTime() - Date.parse(String(sub.created_at))) / 60000),
				}
			: {}),
		...(!complete && sub.completed_at ? { completed_at: null, time_to_complete_minutes: null } : {}),
	});
}

/**
 * A record-attached response, its row locked until the action commits (a
 * write of the value just read): a concurrent answer waits here, so the
 * completeness is decided on a state that includes it. A one-shot response
 * is closed.
 */
async function lockOpen(host: Host, id: string): Promise<Row> {
	const { form_id } = await get(host, S, id, "submission");
	await host.collections.update(S, id, { form_id });
	// Read again after the lock: the first read predates a concurrent answer's commit.
	const sub = await get(host, S, id, "submission");
	if (!sub.record_id)
		throw new ActionRefusal(409, "submission_closed", "A one-shot submission is not edited afterwards.");
	return sub;
}

/** A form still in use, for `collection`'s records when it names one. */
function usable(form: Row, collection: string) {
	if (form.active === false) throw new ActionRefusal(409, "form_inactive", "This form is no longer in use.");
	if (form.collection && form.collection !== collection)
		throw new ActionRefusal(409, "form_collection_mismatch", `This form is for ${form.collection}.`);
}

/** A response on a record, with an empty answer per field carrying the field's assignee. */
async function attachTo(host: Host, form: Row, d: { collection: string; record_id: string; name?: string }) {
	const fields = fieldsOf(form);
	const sub = await host.collections.insert(S, {
		form_id: form.id,
		collection: d.collection,
		record_id: d.record_id,
		name: d.name ?? form.name,
		data: {},
	});
	for (const f of fields)
		await host.collections.insert(A, {
			submission_id: sub.id,
			field_id: f.id,
			value: null,
			assignee_user_id: f.assignee ?? null,
		});
	// A form with no required field is complete as soon as it is attached, as a submission of it would be.
	await settle(host, sub, form);
	return sub;
}

/** Records one complete, one-shot submission of an active form, found by its slug. */
const submit: ExtensionAction = async (input, host) => {
	const d = input as { slug: string; data: Row };
	const res = await host.collections.list(F, {
		filter: { slug: d.slug, active: true },
		limit: 1,
		count: "none",
	});
	const form = ((res.records as Row[]) ?? [])[0];
	if (!form) throw new ActionRefusal(404, "form_not_found", "No such form.");
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
		...score(fields, data, thresholdOf(form)),
	});
	for (const [field_id, value] of Object.entries(data))
		await host.collections.insert(A, {
			submission_id: submission.id,
			field_id,
			value: encode(value),
			answered_at: now,
		});
	return { submission_id: submission.id };
};

/** Attaches a response of an active form to a record (of the form's collection, when it names one). */
const attach: ExtensionAction = async (input, host) => {
	const d = input as { form_id: string; collection: string; record_id: string; name?: string };
	const form = await get(host, F, d.form_id, "form");
	usable(form, d.collection);
	return attachTo(host, form, d);
};

/** Fills fields of a record-attached response: `answers` maps field ids to values. */
const answer: ExtensionAction = async (input, host) => {
	const d = input as { submission_id: string; answers: Row };
	const sub = await lockOpen(host, d.submission_id);
	const form = await get(host, F, String(sub.form_id), "form");
	const fields = new Map(fieldsOf(form).map((f) => [f.id, f]));
	const stray = Object.keys(d.answers).filter((k) => !fields.has(k));
	if (stray.length)
		throw new ActionRefusal(400, "field_not_in_form", `Not fields of this form: ${stray.join(", ")}`);
	const rows = new Map((await all(host, A, { submission_id: d.submission_id })).map((a) => [String(a.field_id), a]));
	const now = new Date().toISOString();
	for (const [field_id, value] of Object.entries(d.answers)) {
		const data = { value: encode(value), answered_at: answered(fields.get(field_id) as Field, value) ? now : null };
		const row = rows.get(field_id);
		// A field added to the form after the response was attached has no row yet.
		if (row) await host.collections.update(A, String(row.id), data);
		else await host.collections.insert(A, { submission_id: d.submission_id, field_id, ...data });
	}
	await settle(host, sub, form);
	return { updated: Object.keys(d.answers).length };
};

/** Sets one answer's value or its working fields (notes, assignee, due date, time spent). */
const updateAnswer: ExtensionAction = async (input, host) => {
	const d = input as { id: string; value?: unknown } & Row;
	const row = await get(host, A, d.id, "answer");
	const sub = await lockOpen(host, String(row.submission_id));
	const form = await get(host, F, String(sub.form_id), "form");
	const data: Row = {};
	for (const k of WORKING) if (d[k] !== undefined) data[k] = d[k];
	if (d.value !== undefined) {
		// A field since removed from the form is answered when it holds something.
		const field = fieldsOf(form).find((f) => f.id === row.field_id) ?? { id: String(row.field_id) };
		data.value = encode(d.value);
		data.answered_at = answered(field, d.value) ? new Date().toISOString() : null;
	}
	const updated = await host.collections.update(A, d.id, data);
	// Only a value moves completion; a note does not.
	if (d.value !== undefined) await settle(host, sub, form);
	return updated;
};

/** Removes one response with its answers (a correction or an erasure request). */
const deleteSubmission: ExtensionAction = async (input, host) => {
	const { id } = input as { id: string };
	await get(host, S, id, "submission");
	await host.collections.delete(S, id);
	return { deleted: id };
};

const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/**
 * `at` moved forward by one `frequency`. A date past a shorter month's end
 * lands on its last day, and a last day stays a last day (Jan 31, Feb 28,
 * Mar 31), so the month end does not drift to the 28th.
 */
export function nextRun(at: Date, frequency: unknown): Date {
	// ponytail: a schedule on the 29th or 30th becomes a month-end one after February; store the anchor day if that matters.
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

/**
 * Attaches the response of every active schedule that is due and moves the
 * schedule past now: one response per run, however many runs were missed.
 * A schedule whose form is gone, inactive or for another collection is
 * skipped and reported, and stays due. Meant for a flow on a timer.
 */
const runDueRecurrences: ExtensionAction = async (_input, host) => {
	const now = new Date();
	const due = await all(host, R, { is_active: true, next_run_at: { lte: now.toISOString() } });
	const created: Row[] = [];
	const skipped: Row[] = [];
	for (const schedule of due) {
		const id = String(schedule.id);
		// Locked, then read again: a concurrent run waits here and then finds
		// the schedule already moved past now, so it creates nothing twice. A
		// schedule deactivated meanwhile fails the precondition and is left alone.
		const locked = await host.collections.update(R, id, { is_active: true }, { expect: { is_active: [true] } }).then(
			() => true,
			(err) => {
				if (lostRace(err)) return false;
				throw err;
			},
		);
		if (!locked) continue;
		const s = await get(host, R, id, "schedule");
		if (Date.parse(String(s.next_run_at)) > now.getTime()) continue;
		const form = await host.collections.read(F, String(s.form_id));
		try {
			if (!form) throw new ActionRefusal(404, "form_not_found", "No such form.");
			usable(form, String(s.collection));
			fieldsOf(form);
		} catch (err) {
			// Raised before this schedule wrote anything; the others go ahead.
			skipped.push({ schedule_id: id, error: (err as ActionRefusal).code });
			continue;
		}
		const sub = await attachTo(host, form, {
			collection: String(s.collection),
			record_id: String(s.record_id),
			name: `${form.name} (${todayIn(host.timezone)})`,
		});
		let next = nextRun(new Date(String(s.next_run_at)), s.frequency);
		while (next <= now) next = nextRun(next, s.frequency);
		await host.collections.update(R, id, { last_run_at: now.toISOString(), next_run_at: next.toISOString() });
		created.push({ schedule_id: id, submission_id: sub.id });
	}
	return { triggered: created.length, created, skipped };
};

export const formsActions: Record<string, ExtensionAction> = {
	submit,
	attach,
	answer,
	updateAnswer,
	deleteSubmission,
	runDueRecurrences,
};
