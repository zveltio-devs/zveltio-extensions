// The subscription actions over an in-memory data API: equality and null
// filters, `expect` on update and paging. The engine's own data API and its
// checks are tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from "bun:test";
import { ActionRefusal } from "@zveltio/sdk/extension";
import { subscriptionsActions as a, addInterval, proration } from "./actions";

const DEFAULTS: Record<string, Record<string, unknown>> = {
	subscribers: { cancel_at_period_end: false, dunning_count: 0 },
	subscription_invoices: { status: "open" },
};

type Row = Record<string, unknown>;

function fakeHost() {
	const tables: Record<string, Row[]> = {};
	let seq = 0;
	const rows = (c: string) => (tables[c] ??= []);
	const host = {
		timezone: "UTC",
		enqueue: async () => "",
		collections: {
			read: async (c: string, id: string) => {
				const r = rows(c).find((x) => x.id === id);
				return r ? { ...r } : null;
			},
			list: async (
				c: string,
				q: { filter?: Row; limit?: number; page?: number } = {},
			) => {
				const out = rows(c).filter((r) =>
					Object.entries(q.filter ?? {}).every(([k, v]) =>
						v === null ? r[k] == null : r[k] === v,
					),
				);
				const lim = q.limit ?? 100;
				const from = ((q.page ?? 1) - 1) * lim;
				return { records: out.slice(from, from + lim).map((r) => ({ ...r })) };
			},
			insert: async (c: string, data: Row) => {
				const row = {
					...DEFAULTS[c],
					id: `00000000-0000-0000-0000-${String(++seq).padStart(12, "0")}`,
					...data,
				};
				rows(c).push(row);
				return { ...row };
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
					const met = vs.some((v) =>
						v === null ? row[k] == null : String(row[k]) === String(v),
					);
					if (!met) throw new ActionRefusal(409, "precondition_failed", k);
				}
				return { ...Object.assign(row, data) };
			},
			delete: async () => {},
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

async function setup(plan: Row = {}) {
	const f = fakeHost();
	const p = await f.host.collections.insert("subscription_plans", {
		name: "Pro",
		price: "49.00",
		currency: "RON",
		interval: "monthly",
		trial_days: 0,
		is_active: true,
		usage_billing: true,
		usage_unit_price: "0.50",
		...plan,
	});
	const run = (name: string, input: Row) => a[name](input, f.host as never) as Promise<Row>;
	const s = await run("subscribe", {
		plan_id: p.id,
		name: "Acme",
		email: "a@acme.test",
		start_date: "2020-01-31",
	});
	return { ...f, run, plan: p, s };
}

describe("dates", () => {
	it("adds an interval and clamps a month-end start", () => {
		expect(addInterval("2026-01-31", "monthly")).toBe("2026-02-28");
		expect(addInterval("2026-11-30", "quarterly")).toBe("2027-02-28");
		expect(addInterval("2024-02-29", "yearly")).toBe("2025-02-28");
	});

	it("prorates the price difference over the share of the period left", () => {
		expect(proration(30, 60, "2026-01-01", "2026-01-31", "2026-01-16")).toBe(15);
		expect(proration(30, 60, "2026-01-01", "2026-01-31", "2026-03-01")).toBe(0);
		expect(proration(60, 30, "2026-01-01", "2026-01-31", "2025-12-01")).toBe(-30);
	});
});

describe("subscribe", () => {
	it("starts billing after the trial", async () => {
		const { s } = await setup({ trial_days: 14 });
		expect(s).toMatchObject({
			status: "trialing",
			trial_end: "2020-02-14",
			current_period_start: "2020-02-14",
			current_period_end: "2020-03-14",
		});
	});

	it("refuses an inactive plan", async () => {
		const { run, host } = await setup();
		const off = await host.collections.insert("subscription_plans", { is_active: false });
		await refusal(run("subscribe", { plan_id: off.id, name: "x", email: "x@x.test" }), "plan_inactive");
	});
});

describe("invoices", () => {
	it("bills the period with its usage once and moves to the next period", async () => {
		const { run, rows, s } = await setup();
		await run("recordUsage", { id: s.id, metric_name: "api", quantity: 20 });
		const inv = await run("issueInvoice", { id: s.id });
		expect(inv).toMatchObject({
			amount: 49,
			usage_amount: 10,
			total_amount: 59,
			period_start: "2020-01-31",
			period_end: "2020-02-29",
		});
		expect(rows("subscription_usage")[0].invoice_id).toBe(inv.id);
		expect(rows("subscribers")[0]).toMatchObject({
			current_period_start: "2020-02-29",
			current_period_end: "2020-03-29",
		});
		const next = await run("issueInvoice", { id: s.id });
		expect(next).toMatchObject({ usage_amount: 0, period_start: "2020-02-29" });
	});

	it("bills nothing ahead of the period, and ends a scheduled cancel instead of billing", async () => {
		const { run, rows, s } = await setup();
		await run("cancel", { id: s.id, at_period_end: true });
		expect(rows("subscribers")[0].status).toBe("active");
		const r = await run("issueInvoice", { id: s.id });
		expect(r.invoice).toBeNull();
		expect(rows("subscribers")[0]).toMatchObject({ status: "cancelled", cancel_at_period_end: false });
		expect(rows("subscription_invoices")).toHaveLength(0);
		// Only the decision is a settlement; the cancel that billing carries out is not.
		expect(rows("subscription_settlements").map((x) => [x.subscriber_id, x.kind])).toEqual([[s.id, "cancel_at_period_end"]]);
		const t = await run("subscribe", {
			plan_id: s.plan_id,
			name: "Later",
			email: "l@x.test",
			start_date: "2999-01-01",
		});
		await refusal(run("issueInvoice", { id: t.id }), "period_not_started");
	});

	it("dunning makes the subscriber past due, and payment makes it active again", async () => {
		const { run, rows, s } = await setup();
		const inv = await run("issueInvoice", { id: s.id });
		for (let i = 1; i <= 4; i++) {
			const r = await run("recordPaymentFailure", { id: inv.id });
			expect(r.attempt).toBe(i);
			expect(r.next_attempt_at).not.toBeNull();
		}
		expect(rows("subscribers")[0].status).toBe("active");
		expect((await run("recordPaymentFailure", { id: inv.id })).next_attempt_at).toBeNull();
		expect(rows("subscribers")[0]).toMatchObject({ status: "past_due", dunning_count: 5 });
		// Another open invoice keeps the subscriber in dunning until it is paid too.
		const later = await run("issueInvoice", { id: s.id });
		await run("markInvoicePaid", { id: inv.id });
		expect(rows("subscribers")[0]).toMatchObject({ status: "past_due", dunning_count: 5 });
		await run("recordPaymentFailure", { id: later.id });
		expect(rows("subscribers")[0].dunning_count).toBe(5);
		await run("markInvoicePaid", { id: later.id });
		expect(rows("subscribers")[0]).toMatchObject({ status: "active", dunning_count: 0 });
		await refusal(run("markInvoicePaid", { id: inv.id }), "invoice_not_open");
		// Each payment is a row of the collection markInvoicePaid is gated on.
		expect(rows("subscription_settlements").map((x) => [x.invoice_id, x.kind])).toEqual([
			[inv.id, "invoice_paid"],
			[later.id, "invoice_paid"],
		]);
	});
});

describe("lifecycle", () => {
	it("prorates over the billed period and bills it on the next invoice", async () => {
		const { run, host, rows, plan } = await setup();
		const today = new Date().toISOString().slice(0, 10);
		const s = await run("subscribe", { plan_id: plan.id, name: "Now", email: "n@x.test", start_date: today });
		const first = await run("issueInvoice", { id: s.id });
		const big = await host.collections.insert("subscription_plans", {
			price: "99.00",
			currency: "RON",
			interval: "monthly",
			is_active: true,
		});
		const r = await run("changePlan", { id: s.id, plan_id: big.id });
		// Changed on the period's first day: the whole difference.
		expect(r.proration_amount).toBe(50);
		expect(rows("subscribers")[1].plan_id).toBe(big.id);
		expect(first.period_start).toBe(today);
		// The next period starts in the future; the proration waits for its invoice.
		expect(rows("plan_changes")[0]).toMatchObject({ from_plan_id: plan.id, to_plan_id: big.id });
		expect(rows("plan_changes")[0].invoice_id).toBeUndefined();
		await refusal(run("changePlan", { id: s.id, plan_id: big.id }), "same_plan");
		const eur = await host.collections.insert("subscription_plans", { currency: "EUR", interval: "monthly", is_active: true });
		await refusal(run("changePlan", { id: s.id, plan_id: eur.id }), "currency_mismatch");
		const yearly = await host.collections.insert("subscription_plans", { currency: "RON", interval: "yearly", is_active: true });
		await refusal(run("changePlan", { id: s.id, plan_id: yearly.id }), "interval_mismatch");
	});

	it("adds unbilled proration to the next invoice", async () => {
		const { run, host, rows, s } = await setup();
		const big = await host.collections.insert("subscription_plans", { price: "99.00", currency: "RON", interval: "monthly", is_active: true });
		// No billed period covers today: nothing to settle.
		expect((await run("changePlan", { id: s.id, plan_id: big.id })).proration_amount).toBe(0);
		rows("plan_changes")[0].proration_amount = "12.50";
		const inv = await run("issueInvoice", { id: s.id });
		expect(inv).toMatchObject({ amount: 99, proration_amount: 12.5, total_amount: 111.5 });
		expect(rows("plan_changes")[0].invoice_id).toBe(inv.id);
		expect((await run("issueInvoice", { id: s.id })).proration_amount).toBe(0);
	});

	it("cancels and reactivates from today", async () => {
		const { run, rows, s } = await setup();
		await run("cancel", { id: s.id });
		expect(rows("subscribers")[0].status).toBe("cancelled");
		await refusal(run("cancel", { id: s.id }), "already_cancelled");
		await refusal(run("issueInvoice", { id: s.id }), "subscriber_not_billable");
		const back = await run("reactivate", { id: s.id });
		expect(back).toMatchObject({ status: "active", cancelled_at: null });
		expect(back.current_period_start).not.toBe("2020-01-31");
		await refusal(run("reactivate", { id: s.id }), "not_cancelled");
		await run("cancel", { id: s.id });
		await refusal(run("recordUsage", { id: s.id, metric_name: "api", quantity: 1 }), "subscriber_cancelled");
	});

	it("refuses usage on a plan that does not bill it", async () => {
		const { run, s } = await setup({ usage_billing: false });
		await refusal(run("recordUsage", { id: s.id, metric_name: "api", quantity: 1 }), "usage_not_billed");
	});
});
