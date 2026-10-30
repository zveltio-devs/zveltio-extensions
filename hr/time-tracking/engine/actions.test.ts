// The time-tracking actions over an in-memory data API: the filter operators
// they use (eq, gte), `expect` on update, and paging. The engine's own data API
// and its checks are tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from "bun:test";
import { ActionRefusal } from "@zveltio/sdk/extension";
import { timeTrackingActions as a } from "./actions";

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
	timesheets: { status: "draft" },
};

function fakeHost() {
	const tables: Record<string, Row[]> = {};
	let seq = 0;
	const rows = (c: string) => (tables[c] ??= []);
	const match = (r: Row, filter: Row) =>
		Object.entries(filter).every(([k, cond]) => {
			if (cond === null || typeof cond !== "object") return r[k] === cond;
			const [op, v] = Object.entries(cond)[0] as [string, unknown];
			const x = r[k] as string;
			if (op === "in") return (v as unknown[]).includes(r[k]);
			if (op === "lte") return x <= (v as string);
			if (op === "gte") return x >= (v as string);
			throw new Error(`op ${op}`);
		});
	const host = {
		timezone: "UTC",
		enqueue: async () => "",
		collections: {
			read: async (c: string, id: string) =>
				rows(c).find((r) => r.id === id) ?? null,
			list: async (
				c: string,
				q: { filter?: Row; sort?: string; limit?: number; page?: number } = {},
			) => {
				let out = rows(c).filter((r) => match(r, q.filter ?? {}));
				if (q.sort)
					out = [...out].sort((x, y) =>
						String(x[q.sort!]).localeCompare(String(y[q.sort!])),
					);
				const lim = q.limit ?? 100;
				const from = ((q.page ?? 1) - 1) * lim;
				return { records: out.slice(from, from + lim) };
			},
			insert: async (c: string, data: Row) => {
				const row = {
					id: `00000000-0000-0000-0000-${String(++seq).padStart(12, "0")}`,
					...DEFAULTS[c],
					...data,
				};
				rows(c).push(row);
				return row;
			},
			update: async (
				c: string,
				id: string,
				data: Row,
				opts?: { expect?: Record<string, unknown[]> },
			) => {
				const row = rows(c).find((r) => r.id === id);
				if (!row) throw new ActionRefusal(404, "not_found", "");
				for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
					if (!vs.map(String).includes(String(row[k])))
						throw new ActionRefusal(409, "precondition_failed", k);
				}
				return Object.assign(row, data);
			},
			delete: async (c: string, id: string) => {
				tables[c] = rows(c).filter((r) => r.id !== id);
			},
		},
	};
	return { host, rows };
}

const refusal = async (p: Promise<unknown>, code: string) => {
	const e = await p.then(
		() => null,
		(err) => err,
	);
	expect(e).toBeInstanceOf(ActionRefusal);
	expect((e as ActionRefusal).code).toBe(code);
};

const EMP = "10000000-0000-0000-0000-000000000001";

async function setup() {
	const f = fakeHost();
	const project = await f.host.collections.insert("time_projects", {
		name: "Site",
		hourly_rate: 100,
	});
	return { ...f, project };
}

describe("hr/time-tracking actions", () => {
	it("logTime snapshots the project rate", async () => {
		const { host, project } = await setup();
		const e = await a.logTime(
			{
				employee_id: EMP,
				project_id: project.id,
				date: "2026-08-17",
				duration_minutes: 90,
			},
			host,
		);
		expect(e).toMatchObject({ hourly_rate: 100, duration_minutes: 90 });
		project.hourly_rate = 200;
		await refusal(
			a.logTime(
				{
					employee_id: EMP,
					project_id: "nope",
					date: "2026-08-17",
					duration_minutes: 5,
				},
				host,
			),
			"project_not_found",
		);
	});

	it("a timer restarts on a new project and stops into an entry", async () => {
		const { host, rows, project } = await setup();
		const other = await host.collections.insert("time_projects", {
			name: "Other",
			hourly_rate: 50,
		});
		await a.startTimer({ employee_id: EMP, project_id: project.id }, host);
		await a.startTimer(
			{ employee_id: EMP, project_id: other.id, task_description: "x" },
			host,
		);
		expect(rows("active_timers")).toHaveLength(1);
		rows("active_timers")[0].started_at = new Date(
			Date.now() - 30 * 60_000,
		).toISOString();
		const e = await a.stopTimer({ employee_id: EMP }, host);
		expect(e).toMatchObject({
			project_id: other.id,
			hourly_rate: 50,
			duration_minutes: 30,
			task_description: "x",
		});
		expect(rows("active_timers")).toHaveLength(0);
		await refusal(a.stopTimer({ employee_id: EMP }, host), "no_timer");
	});

	it("a timer under a minute is discarded", async () => {
		const { host, rows, project } = await setup();
		await a.startTimer({ employee_id: EMP, project_id: project.id }, host);
		expect(await a.stopTimer({ employee_id: EMP }, host)).toEqual({
			discarded: true,
		});
		expect(rows("time_entries")).toHaveLength(0);
	});

	it("computeTimesheet totals the week and refuses once submitted", async () => {
		const { host, project } = await setup();
		for (const [date, m] of [
			["2026-08-16", 60],
			["2026-08-17", 90],
			["2026-08-23", 30],
			["2026-08-24", 60],
		] as const) {
			await a.logTime(
				{ employee_id: EMP, project_id: project.id, date, duration_minutes: m },
				host,
			);
		}
		const s = await a.computeTimesheet(
			{ employee_id: EMP, week_start: "2026-08-17" },
			host,
		);
		expect(s).toMatchObject({
			week_end: "2026-08-23",
			total_hours: 2,
			status: "draft",
		});
		await a.logTime(
			{
				employee_id: EMP,
				project_id: project.id,
				date: "2026-08-18",
				duration_minutes: 30,
			},
			host,
		);
		expect(
			await a.computeTimesheet(
				{ employee_id: EMP, week_start: "2026-08-17" },
				host,
			),
		).toMatchObject({ total_hours: 2.5 });
		(s as Row).status = "submitted";
		await refusal(
			a.computeTimesheet({ employee_id: EMP, week_start: "2026-08-17" }, host),
			"timesheet_not_draft",
		);
	});
});

describe("invoiceEntries", () => {
	async function billable() {
		const f = await setup();
		f.project.client_name = "Client SRL";
		await f.host.collections.insert("document_series", {
			doc_type: "invoice",
			series: "INV",
			next_number: 1,
			padding: 3,
			is_default: true,
		});
		const e1 = await a.logTime(
			{
				employee_id: EMP,
				project_id: f.project.id,
				date: "2026-08-18",
				duration_minutes: 90,
				is_billable: true,
				is_billed: false,
				task_description: "Build",
			},
			f.host,
		);
		const e2 = await a.logTime(
			{
				employee_id: EMP,
				project_id: f.project.id,
				date: "2026-08-19",
				duration_minutes: 30,
				is_billable: true,
				is_billed: false,
			},
			f.host,
		);
		return { ...f, ids: [e1.id, e2.id] as string[] };
	}

	it("bills the hours once, at the rate each entry carries", async () => {
		const { host, rows, project, ids } = await billable();
		const inv = await a.invoiceEntries(
			{ project_id: project.id, entry_ids: ids },
			host,
		);
		expect(inv).toMatchObject({
			number: "INV-001",
			client_name: "Client SRL",
			subtotal: 200,
		});
		expect(
			rows("invoice_lines").map((l) => [
				l.description,
				l.quantity,
				l.unit_price,
			]),
		).toEqual([
			["Build", 1.5, 100],
			["Time entry", 0.5, 100],
		]);
		expect(
			rows("time_entries").every((e) => e.is_billed && e.invoice_id === inv.id),
		).toBe(true);
		await refusal(
			a.invoiceEntries({ project_id: project.id, entry_ids: ids }, host),
			"entry_not_billable",
		);
	});

	it("three 20-minute entries bill one full hour", async () => {
		const f = await setup();
		f.project.client_name = "C";
		await f.host.collections.insert("document_series", {
			doc_type: "invoice",
			series: "INV",
			next_number: 1,
			padding: 3,
			is_default: true,
		});
		const ids: string[] = [];
		for (const date of ["2026-08-18", "2026-08-19", "2026-08-20"]) {
			ids.push(
				(
					await a.logTime(
						{
							employee_id: EMP,
							project_id: f.project.id,
							date,
							duration_minutes: 20,
							is_billable: true,
							is_billed: false,
						},
						f.host,
					)
				).id as string,
			);
		}
		expect(
			await a.invoiceEntries(
				{ project_id: f.project.id, entry_ids: ids },
				f.host,
			),
		).toMatchObject({ subtotal: 100 });
	});

	it("two invoices for the same hours: the second fails", async () => {
		const { host, rows, project, ids } = await billable();
		const read = host.collections.read;
		// Both read the entries unbilled; the other one marks them billed first.
		host.collections.read = async (c: string, id: string) => {
			const r = await read(c, id);
			const copy = r && { ...r };
			if (c === "time_entries" && r) r.is_billed = true;
			return copy;
		};
		await refusal(
			a.invoiceEntries({ project_id: project.id, entry_ids: ids }, host),
			"precondition_failed",
		);
		expect(rows("time_entries").some((e) => e.invoice_id)).toBe(false);
	});
});
