// The approvals actions over an in-memory data API: equality and `lt`
// filters, sort and `expect` on update. The engine's own data API and its
// checks are tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from "bun:test";
import { ActionRefusal } from "@zveltio/sdk/extension";
import { approvalsActions as a } from "./actions";

type Row = Record<string, unknown>;

function fakeHost() {
	const tables: Record<string, Row[]> = {};
	let seq = 0;
	const rows = (c: string) => (tables[c] ??= []);
	const match = (r: Row, f: Row) =>
		Object.entries(f).every(([k, v]) =>
			v && typeof v === "object" && "lt" in v
				? r[k] != null && String(r[k]) < String((v as { lt: unknown }).lt)
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
			list: async (c: string, q: { filter?: Row; sort?: string; limit?: number } = {}) => {
				// The data API refuses a page over 500.
				if ((q.limit ?? 20) > 500) throw new ActionRefusal(400, "limit", "");
				let out = rows(c).filter((r) => match(r, q.filter ?? {}));
				if (q.sort) out = [...out].sort((x, y) => Number(x[q.sort!]) - Number(y[q.sort!]));
				return { records: out.map((r) => ({ ...r })) };
			},
			insert: async (c: string, data: Row) => {
				const row = { id: `id${++seq}`, ...data };
				rows(c).push(row);
				return { ...row };
			},
			update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
				const row = rows(c).find((r) => r.id === id);
				if (!row) throw new ActionRefusal(404, "not_found", "");
				for (const [k, vs] of Object.entries(opts?.expect ?? {}))
					if (!vs.some((v) => (v === null ? row[k] == null : String(row[k]) === String(v))))
						throw new ActionRefusal(409, "precondition_failed", k);
				return { ...Object.assign(row, data) };
			},
			delete: async () => {},
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

async function setup() {
	const f = fakeHost();
	const c = (f.host as { collections: { insert: (c: string, d: Row) => Promise<Row> } }).collections;
	const wf = await c.insert("approval_workflows", { name: "Spend", collection: "expenses", is_active: true });
	// Inserted out of order: the request follows step_order.
	const s2 = await c.insert("approval_steps", { workflow_id: wf.id, step_order: 2, name: "Finance" });
	const s1 = await c.insert("approval_steps", { workflow_id: wf.id, step_order: 1, name: "Manager", deadline_hours: 24 });
	const open = () =>
		a.requestApproval({ workflow_id: wf.id, collection: "expenses", record_id: "e1" }, f.host) as Promise<Row>;
	return { ...f, wf, s1, s2, open };
}

describe("requestApproval", () => {
	it("opens at the first step with its deadline", async () => {
		const { open, s1 } = await setup();
		const rq = await open();
		expect(rq).toMatchObject({ status: "pending", current_step_id: s1.id, priority: "normal" });
		expect(Date.parse(String(rq.sla_due_at))).toBeGreaterThan(Date.now() + 23 * 3_600_000);
	});

	it("refuses another collection, an inactive workflow and one without steps", async () => {
		const { host, rows, wf } = await setup();
		await refusal(a.requestApproval({ workflow_id: wf.id, collection: "leave", record_id: "x" }, host), "workflow_collection_mismatch");
		rows("approval_steps").length = 0;
		await refusal(a.requestApproval({ workflow_id: wf.id, collection: "expenses", record_id: "x" }, host), "workflow_has_no_steps");
		rows("approval_workflows")[0].is_active = false;
		await refusal(a.requestApproval({ workflow_id: wf.id, collection: "expenses", record_id: "x" }, host), "workflow_inactive");
	});
});

describe("decide", () => {
	it("moves step by step, records each decision, and approves after the last", async () => {
		const { host, rows, open, s2 } = await setup();
		const rq = await open();
		const mid = (await a.decide({ id: rq.id, decision: "approved" }, host)) as Row;
		expect(mid).toMatchObject({ status: "pending", current_step_id: s2.id, sla_due_at: null });
		const done = (await a.decide({ id: rq.id, decision: "approved", comment: "ok" }, host)) as Row;
		expect(done).toMatchObject({ status: "approved", current_step_id: null });
		expect(rows("approval_decisions").map((d) => d.step_name)).toEqual(["Manager", "Finance"]);
		await refusal(a.decide({ id: rq.id, decision: "approved" }, host), "request_not_pending");
	});

	it("a rejection ends the request with its reason", async () => {
		const { host, open } = await setup();
		const rq = await open();
		expect(await a.decide({ id: rq.id, decision: "rejected", comment: "too much" }, host)).toMatchObject({
			status: "rejected",
			rejection_reason: "too much",
		});
	});

	it("decideMany reports what it could not decide and decides the rest", async () => {
		const { host, open } = await setup();
		const r1 = await open();
		const r2 = await open();
		await a.cancel({ id: r2.id }, host);
		const out = (await a.decideMany({ ids: [r1.id, r2.id, "nope"], decision: "rejected" }, host)) as Row;
		expect(out).toMatchObject({ succeeded: 1, failed: 2 });
		expect((out.results as Row[]).map((r) => r.error ?? "ok")).toEqual(["ok", "request_not_pending", "request_not_found"]);
	});
});

describe("cancel and markOverdue", () => {
	it("cancels only a pending request", async () => {
		const { host, open } = await setup();
		const rq = await open();
		expect(await a.cancel({ id: rq.id }, host)).toMatchObject({ status: "cancelled" });
		await refusal(a.cancel({ id: rq.id }, host), "request_not_pending");
	});

	it("flags a pending request past its deadline once", async () => {
		const { host, rows, open } = await setup();
		await open();
		rows("approval_requests")[0].sla_due_at = new Date(Date.now() - 1000).toISOString();
		rows("approval_requests")[0].sla_breached = false;
		expect(await a.markOverdue({}, host)).toEqual({ newly_breached: 1 });
		expect(await a.markOverdue({}, host)).toEqual({ newly_breached: 0 });
	});
});
