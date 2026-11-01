// The checklists actions over an in-memory data API: equality, null and `lte`
// filters, delete and paging. The engine's own data API and its checks are
// tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from "bun:test";
import { ActionRefusal } from "@zveltio/sdk/extension";
import { checklistsActions as a, nextRun, weightedScore } from "./actions";

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
	checklist_items: { checked: false, required: false },
	checklist_templates: { is_active: true },
	checklist_recurrences: { is_active: true },
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
	return { host, rows };
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

async function setup() {
	const f = fakeHost();
	const c = f.host.collections;
	const t = await c.insert("checklist_templates", { name: "Inspection", collection: "vehicles" });
	const req = await c.insert("checklist_template_items", { template_id: t.id, label: "Brakes", required: true, order_idx: 1 });
	const opt = await c.insert("checklist_template_items", { template_id: t.id, label: "Wipers", required: false, order_idx: 2 });
	const scheme = await c.insert("checklist_scoring_schemes", {
		template_id: t.id,
		name: "safety",
		method: "weighted_completion",
		pass_threshold: 50,
		is_active: true,
	});
	return { ...f, t, req, opt, scheme };
}

const attach = (host: unknown, template_id: string) =>
	a.attachChecklist({ collection: "vehicles", record_id: REC, name: "Monthly", template_id }, host as never) as Promise<Row & { items: Row[] }>;

describe("attachChecklist", () => {
	it("copies the template's items in order, linked for scoring", async () => {
		const { host, t, req, opt } = await setup();
		const cl = await attach(host, String(t.id));
		expect(cl.items.map((i) => [i.label, i.template_item_id])).toEqual([
			["Brakes", req.id],
			["Wipers", opt.id],
		]);
	});

	it("refuses another collection's template, an inactive one, and template plus items", async () => {
		const { host, t, rows } = await setup();
		await refusal(
			a.attachChecklist({ collection: "people", record_id: REC, name: "x", template_id: t.id }, host as never),
			"template_collection_mismatch",
		);
		await refusal(
			a.attachChecklist({ collection: "vehicles", record_id: REC, name: "x", template_id: t.id, items: [] }, host as never),
			"template_or_items",
		);
		rows("checklist_templates")[0].is_active = false;
		await refusal(attach(host, String(t.id)), "template_inactive");
	});
});

describe("ticking", () => {
	it("completes on the last required item, reopens on untick, and rescores every change", async () => {
		const { host, rows, t, req, opt, scheme } = await setup();
		await a.setSchemeWeights(
			{ id: scheme.id, weights: [{ template_item_id: req.id, weight: 3 }, { template_item_id: opt.id, weight: 1 }] },
			host as never,
		);
		const cl = await attach(host, String(t.id));
		const [brakes, wipers] = cl.items;

		await a.updateItem({ id: brakes.id, checked: true }, host as never);
		const done = rows("checklists")[0];
		expect(done.completed_at).toBeTruthy();
		expect(Number(done.time_to_complete_minutes)).toBeGreaterThanOrEqual(1);
		expect(rows("checklist_scores")).toHaveLength(1);
		expect(rows("checklist_scores")[0]).toMatchObject({ score: 75, passed: true, scheme_name: "safety" });

		// An optional item ticked after completion still moves the score, on the same row.
		await a.updateItem({ id: wipers.id, checked: true, notes: "new blades" }, host as never);
		expect(rows("checklist_scores")).toHaveLength(1);
		expect(rows("checklist_scores")[0].score).toBe(100);
		expect(rows("checklist_items")[1]).toMatchObject({ notes: "new blades", checked: true });

		await a.checkItems({ item_ids: [brakes.id, wipers.id], checked: false }, host as never);
		expect(rows("checklists")[0].completed_at).toBeNull();
		expect(rows("checklist_items").every((i) => !i.checked && i.checked_at === null)).toBe(true);
		expect(rows("checklist_scores")[0]).toMatchObject({ score: 0, passed: false });
	});

	it("refuses a bulk tick naming a missing item before writing anything", async () => {
		const { host, rows, t } = await setup();
		const cl = await attach(host, String(t.id));
		await refusal(
			a.checkItems({ item_ids: [cl.items[0].id, "00000000-0000-0000-0000-00000000ffff"], checked: true }, host as never),
			"item_not_found",
		);
		expect(rows("checklist_items").some((i) => i.checked)).toBe(false);
	});
});

describe("setSchemeWeights", () => {
	it("replaces the set and refuses another template's item", async () => {
		const { host, rows, req, opt, scheme } = await setup();
		await a.setSchemeWeights({ id: scheme.id, weights: [{ template_item_id: req.id, weight: 2 }] }, host as never);
		await a.setSchemeWeights({ id: scheme.id, weights: [{ template_item_id: opt.id, weight: 1 }] }, host as never);
		expect(rows("checklist_scheme_weights").map((w) => w.template_item_id)).toEqual([opt.id]);
		await refusal(
			a.setSchemeWeights({ id: scheme.id, weights: [{ template_item_id: scheme.id, weight: 1 }] }, host as never),
			"item_not_in_template",
		);
	});
});

describe("runDueRecurrences", () => {
	it("creates one linked checklist per due schedule and moves it past now", async () => {
		const { host, rows, t, req } = await setup();
		await host.collections.insert("checklist_recurrences", {
			template_id: t.id,
			collection: "vehicles",
			record_id: REC,
			frequency: "daily",
			next_run_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
		});
		const out = (await a.runDueRecurrences({}, host as never)) as { triggered: number };
		expect(out.triggered).toBe(1);
		// Linked to the template item: 1.x left recurring checklists unscorable.
		expect(rows("checklist_items")[0].template_item_id).toBe(req.id);
		expect(Date.parse(String(rows("checklist_recurrences")[0].next_run_at))).toBeGreaterThan(Date.now());
		expect(((await a.runDueRecurrences({}, host as never)) as { triggered: number }).triggered).toBe(0);
	});
});

describe("helpers", () => {
	it("nextRun clamps month ends", () => {
		expect(nextRun(new Date("2026-01-31T08:00:00Z"), "monthly").toISOString()).toBe("2026-02-28T08:00:00.000Z");
		expect(nextRun(new Date("2026-11-30T08:00:00Z"), "quarterly").toISOString()).toBe("2027-02-28T08:00:00.000Z");
		expect(nextRun(new Date("2026-11-01T08:00:00Z"), "weekly").toISOString()).toBe("2026-11-08T08:00:00.000Z");
	});

	it("weightedScore leaves unweighted items out and scores nothing it does not cover", () => {
		const items = [
			{ template_item_id: "a", checked: true, label: "A" },
			{ template_item_id: "b", checked: false, label: "B" },
		];
		expect(weightedScore(items, new Map([["a", 1]]), null)?.score).toBe(100);
		expect(weightedScore(items, new Map(), 50)).toBeNull();
	});
});

describe("review cases", () => {
	it("a note on a list with no required item does not complete it", async () => {
		const { host, rows } = fakeHost();
		const cl = (await a.attachChecklist(
			{ collection: "vehicles", record_id: REC, name: "Ad hoc", items: [{ label: "Optional" }] },
			host as never,
		)) as Row & { items: Row[] };
		await a.updateItem({ id: cl.items[0].id, notes: "later" }, host as never);
		expect(rows("checklists")[0].completed_at).toBeUndefined();
	});

	it("a schedule on an inactive template is skipped, reported and stays due", async () => {
		const { host, rows, t } = await setup();
		rows("checklist_templates")[0].is_active = false;
		const due = new Date(Date.now() - 1000).toISOString();
		await host.collections.insert("checklist_recurrences", {
			template_id: t.id,
			collection: "vehicles",
			record_id: REC,
			frequency: "weekly",
			next_run_at: due,
		});
		const out = (await a.runDueRecurrences({}, host as never)) as { triggered: number; skipped: Row[] };
		expect(out.triggered).toBe(0);
		expect(out.skipped[0].error).toBe("template_inactive");
		expect(rows("checklist_recurrences")[0].next_run_at).toBe(due);
		expect(rows("checklists")).toHaveLength(0);
	});
});
