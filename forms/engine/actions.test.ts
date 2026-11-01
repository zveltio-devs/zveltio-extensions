// The forms actions over an in-memory data API: equality, null and `lte`
// filters, delete and paging. The engine's own data API and its checks are
// tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from "bun:test";
import { ActionRefusal } from "@zveltio/sdk/extension";
import { answers, formsActions as a, nextRun, score } from "./actions";

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
	forms: { active: true },
	form_recurrences: { is_active: true },
};

function fakeHost() {
	const tables: Record<string, Row[]> = {};
	let seq = 0;
	const rows = (c: string) => (tables[c] ??= []);
	const match = (r: Row, filter: Row) =>
		Object.entries(filter).every(([k, v]) =>
			v === null
				? r[k] == null
				: typeof v === "object" && v && "lte" in v
					? String(r[k]) <= String((v as { lte: unknown }).lte)
					: r[k] === v,
		);
	const host = {
		timezone: "UTC",
		enqueue: async () => "",
		collections: {
			read: async (c: string, id: string) => {
				const r = rows(c).find((x) => x.id === id);
				return r ? { ...r } : null;
			},
			list: async (c: string, q: { filter?: Row; limit?: number; page?: number } = {}) => {
				const out = rows(c).filter((r) => match(r, q.filter ?? {}));
				const lim = q.limit ?? 100;
				const from = ((q.page ?? 1) - 1) * lim;
				return { records: out.slice(from, from + lim).map((r) => ({ ...r })) };
			},
			insert: async (c: string, data: Row) => {
				const row = {
					...DEFAULTS[c],
					id: `00000000-0000-0000-0000-${String(++seq).padStart(12, "0")}`,
					created_at: new Date(Date.now() - 60_000).toISOString(),
					...data,
				};
				rows(c).push(row);
				return { ...row };
			},
			update: async (c: string, id: string, data: Row) => {
				const row = rows(c).find((r) => r.id === id);
				if (!row) throw new ActionRefusal(404, "not_found", "");
				return { ...Object.assign(row, data) };
			},
			delete: async (c: string, id: string) => {
				tables[c] = rows(c).filter((r) => r.id !== id);
			},
		},
	};
	return { host: host as never, rows };
}

const refusal = async (p: Promise<unknown>, code: string) => {
	const err = await p.then(
		() => null,
		(e) => e,
	);
	expect(err).toBeInstanceOf(ActionRefusal);
	expect((err as { code: string }).code).toBe(code);
};

const REC = "00000000-0000-0000-0000-0000000000aa";
const CONTACT = [
	{ id: "email", label: "Email", required: true },
	{ id: "note", label: "Note" },
];
const INSPECTION = [
	{ id: "brakes", label: "Brakes", type: "checkbox", required: true, weight: 3, assignee: "u1" },
	{ id: "lights", label: "Lights", type: "checkbox", weight: 1 },
	{ id: "remarks", label: "Remarks" },
];

async function setup() {
	const f = fakeHost();
	const c = (f.host as { collections: { insert: (c: string, d: Row) => Promise<Row> } }).collections;
	const contact = await c.insert("forms", { name: "Contact", slug: "contact", fields: JSON.stringify(CONTACT) });
	const inspection = await c.insert("forms", {
		name: "Inspection",
		slug: "inspection",
		collection: "vehicles",
		pass_threshold: 75,
		fields: INSPECTION,
	});
	return { ...f, contact, inspection };
}

describe("submit", () => {
	it("keeps only the form's fields, one answer row each, closed at once", async () => {
		const { host, rows } = await setup();
		const { submission_id } = (await a.submit({ slug: "contact", data: { email: "a@b.c", is_admin: true } }, host)) as Row;
		const [sub] = rows("form_submissions");
		expect(sub).toMatchObject({ id: submission_id, data: { email: "a@b.c" }, time_to_complete_minutes: 0, score: null });
		expect(sub.completed_at).toBeTruthy();
		expect(rows("form_answers").map((r) => [r.field_id, r.value])).toEqual([["email", '"a@b.c"']]);
		await refusal(a.answer({ submission_id, answers: { note: "x" } }, host), "submission_closed");
	});

	it("refuses an inactive form, a missing required answer, and fields that are not a list", async () => {
		const { host, rows } = await setup();
		await refusal(a.submit({ slug: "inspection", data: { brakes: true } }, host), "form_for_records");
		rows("forms")[0].active = false;
		await refusal(a.submit({ slug: "contact", data: { email: "a@b.c" } }, host), "form_not_found");
		expect(() => answers(CONTACT, { email: "", note: "x" })).toThrow("Missing required fields: Email");
		expect(() => answers(INSPECTION, { brakes: false })).toThrow("Missing required fields: Brakes");
		expect(() => answers("not a list", { x: 1 })).toThrow("not a list");
		expect(() => answers("{broken", { x: 1 })).toThrow("not a list");
	});
});

describe("a response attached to a record", () => {
	it("starts with an empty answer per field carrying the field's assignee", async () => {
		const { host, rows, inspection } = await setup();
		await a.attach({ form_id: inspection.id, collection: "vehicles", record_id: REC }, host);
		expect(rows("form_submissions")[0]).toMatchObject({ name: "Inspection", collection: "vehicles", record_id: REC });
		expect(rows("form_answers").map((r) => [r.field_id, r.value, r.assignee_user_id])).toEqual([
			["brakes", null, "u1"],
			["lights", null, null],
			["remarks", null, null],
		]);
	});

	it("is complete at once when the form has no required field", async () => {
		const { host, rows, contact } = await setup();
		rows("forms")[0].fields = [{ id: "note", label: "Note" }];
		await a.attach({ form_id: contact.id, collection: "vehicles", record_id: REC }, host);
		expect(rows("form_submissions")[0].completed_at).toBeTruthy();
	});

	it("refuses a form for another collection, or no longer in use", async () => {
		const { host, rows, inspection } = await setup();
		await refusal(a.attach({ form_id: inspection.id, collection: "drivers", record_id: REC }, host), "form_collection_mismatch");
		rows("forms")[1].active = false;
		await refusal(a.attach({ form_id: inspection.id, collection: "vehicles", record_id: REC }, host), "form_inactive");
	});

	it("completes once every required field is answered, reopens when one is emptied, and scores the weights", async () => {
		const { host, rows, inspection } = await setup();
		const sub = (await a.attach({ form_id: inspection.id, collection: "vehicles", record_id: REC }, host)) as Row;
		await a.answer({ submission_id: sub.id, answers: { lights: true, remarks: "ok" } }, host);
		let s = rows("form_submissions")[0];
		expect(s).toMatchObject({ score: 25, passed: false, data: { brakes: null, lights: true, remarks: "ok" } });
		expect(s.completed_at).toBeUndefined();

		await a.answer({ submission_id: sub.id, answers: { brakes: true } }, host);
		s = rows("form_submissions")[0];
		expect(s).toMatchObject({ score: 100, passed: true });
		expect(s.completed_at).toBeTruthy();
		expect(s.time_to_complete_minutes).toBe(1);
		expect(s.score_snapshot).toMatchObject({ earned: 4, possible: 4, pass_threshold: 75 });

		const brakes = rows("form_answers").find((r) => r.field_id === "brakes") as Row;
		await a.updateAnswer({ id: brakes.id, value: false }, host);
		s = rows("form_submissions")[0];
		expect(s).toMatchObject({ completed_at: null, time_to_complete_minutes: null, score: 25 });
		expect((rows("form_answers").find((r) => r.field_id === "brakes") as Row).answered_at).toBeNull();
	});

	it("a note moves nothing; a stray field is refused; a field added later gets its row", async () => {
		const { host, rows, inspection } = await setup();
		const sub = (await a.attach({ form_id: inspection.id, collection: "vehicles", record_id: REC }, host)) as Row;
		const lights = rows("form_answers").find((r) => r.field_id === "lights") as Row;
		await a.updateAnswer({ id: lights.id, notes: "bulb dim", time_spent_minutes: 5 }, host);
		expect(rows("form_submissions")[0].score).toBe(0);
		expect(rows("form_answers").find((r) => r.id === lights.id)).toMatchObject({ notes: "bulb dim", time_spent_minutes: 5 });

		await refusal(a.answer({ submission_id: sub.id, answers: { is_admin: true } }, host), "field_not_in_form");
		rows("forms")[1].fields = [...INSPECTION, { id: "tyres", label: "Tyres", type: "checkbox" }];
		await a.answer({ submission_id: sub.id, answers: { tyres: true } }, host);
		expect(rows("form_answers").filter((r) => r.field_id === "tyres")).toHaveLength(1);
	});

	it("deleteSubmission removes a response; an unknown one is refused", async () => {
		const { host, rows, inspection } = await setup();
		const sub = (await a.attach({ form_id: inspection.id, collection: "vehicles", record_id: REC }, host)) as Row;
		await a.deleteSubmission({ id: sub.id }, host);
		expect(rows("form_submissions")).toHaveLength(0);
		await refusal(a.deleteSubmission({ id: sub.id }, host), "submission_not_found");
	});
});

describe("score", () => {
	it("is null when no field has a weight, and has no verdict without a threshold", () => {
		expect(score(CONTACT, {}, 50).score).toBeNull();
		expect(score(INSPECTION, { brakes: true }, null)).toMatchObject({ score: 75, passed: null });
	});
});

describe("runDueRecurrences", () => {
	it("attaches one response per due schedule, moves it past now, and skips a form for another collection", async () => {
		const { host, rows, inspection } = await setup();
		const c = (host as { collections: { insert: (c: string, d: Row) => Promise<Row> } }).collections;
		const past = new Date(Date.now() - 20 * 86_400_000).toISOString();
		await c.insert("form_recurrences", { form_id: inspection.id, collection: "vehicles", record_id: REC, frequency: "weekly", next_run_at: past });
		const bad = await c.insert("form_recurrences", { form_id: inspection.id, collection: "drivers", record_id: REC, frequency: "daily", next_run_at: past });
		const out = (await a.runDueRecurrences({}, host)) as { triggered: number; skipped: Row[] };
		expect(out.triggered).toBe(1);
		expect(out.skipped).toEqual([{ schedule_id: bad.id, error: "form_collection_mismatch" }]);
		expect(rows("form_submissions")).toHaveLength(1);
		expect(Date.parse(String(rows("form_recurrences")[0].next_run_at))).toBeGreaterThan(Date.now());
		expect((await a.runDueRecurrences({}, host)) as Row).toMatchObject({ triggered: 0 });
	});

	it("nextRun keeps a month-end date on the last day of a shorter month", () => {
		expect(nextRun(new Date("2026-01-31T09:00:00Z"), "monthly").toISOString()).toBe("2026-02-28T09:00:00.000Z");
		expect(nextRun(new Date("2026-11-30T09:00:00Z"), "quarterly").toISOString()).toBe("2027-02-28T09:00:00.000Z");
		// A month end stays one: no drift to the 28th.
		let d = new Date("2026-01-31T09:00:00Z");
		const ends = [];
		for (let i = 0; i < 3; i++) ends.push((d = nextRun(d, "monthly")).toISOString().slice(0, 10));
		expect(ends).toEqual(["2026-02-28", "2026-03-31", "2026-04-30"]);
		expect(nextRun(new Date("2026-03-15T09:00:00Z"), "monthly").toISOString().slice(0, 10)).toBe("2026-04-15");
	});
});
