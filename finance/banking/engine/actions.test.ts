// The banking actions over an in-memory data API: equality and null filters,
// `expect` on update and paging; invoicing's actions run on the same data, as
// the engine runs them for `host.actions.run`. The engine's own data API and its checks are
// tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from "bun:test";
import { ActionRefusal } from "@zveltio/sdk/extension";
import { invoicingActions } from "../../invoicing/engine/actions";
import { bankingActions as a, categorize } from "./actions";

const DEFAULTS: Record<string, Record<string, unknown>> = {
	bank_transactions: { is_reconciled: false },
	invoices: { status: "sent", amount_paid: 0 },
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
				q: { filter?: Row; sort?: string; limit?: number; page?: number } = {},
			) => {
				let out = rows(c).filter((r) =>
					Object.entries(q.filter ?? {}).every(([k, v]) =>
						v === null ? r[k] == null : r[k] === v,
					),
				);
				if (q.sort)
					out = [...out].sort((x, y) =>
						String(x[q.sort!]).localeCompare(String(y[q.sort!]), "en", {
							numeric: true,
						}),
					);
				const lim = q.limit ?? 100;
				const from = ((q.page ?? 1) - 1) * lim;
				return { records: out.slice(from, from + lim).map((r) => ({ ...r })) };
			},
			insert: async (c: string, data: Row) => {
				const row = {
					...DEFAULTS[c],
					id: `00000000-0000-0000-0000-${String(++seq).padStart(12, "0")}`,
					created_at: String(seq).padStart(6, "0"),
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
		// What the engine does for `host.actions.run`: invoicing's own action, on this data.
		actions: {
			run: async (extension: string, action: string, input: unknown) => {
				expect(extension).toBe("finance/invoicing");
				return invoicingActions[action](input, host as never);
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

async function setup() {
	const f = fakeHost();
	const acc = await f.host.collections.insert("bank_accounts", {
		name: "Main",
		opening_balance: 1000,
		balance: 0,
	});
	const id = String(acc.id);
	return { ...f, id };
}

const MT940 = [
	":20:STMT",
	":61:2610301030C150,00NTRFREF1//X",
	":86:Client SRL invoice",
	":61:2610301030D20,50NTRFREF2//Y",
	":86:Bank fee",
].join("\n");

describe("import", () => {
	it("imports a statement once, categorizes it and settles the balance", async () => {
		const { host, rows, id } = await setup();
		await host.collections.insert("bank_rules", {
			account_id: null,
			name: "fees",
			match_field: "description",
			match_operator: "contains",
			match_value: "fee",
			category: "fees",
			priority: 0,
		});
		const tx = [
			{
				date: "2026-10-30",
				type: "credit",
				amount: 150,
				description: "Client SRL invoice",
			},
			{
				date: "2026-10-30",
				type: "debit",
				amount: 20.5,
				description: "Bank fee",
			},
		];
		expect(
			await a.importTransactions(
				{ account_id: id, transactions: tx },
				host as never,
			),
		).toMatchObject({ imported: 2, skipped: 0 });
		expect(
			await a.importTransactions(
				{ account_id: id, transactions: tx },
				host as never,
			),
		).toMatchObject({ imported: 0, skipped: 2 });
		expect(rows("bank_transactions").map((t) => t.category)).toEqual([
			null,
			"fees",
		]);
		expect(rows("bank_accounts")[0].balance).toBe(1129.5);
	});

	it("refuses an MT940 statement with a line it cannot read", async () => {
		const { host, rows, id } = await setup();
		const err = await a
			.importMT940(
				{ account_id: id, content: `${MT940}\n:61:garbage` },
				host as never,
			)
			.catch((e) => e);
		expect(err).toBeInstanceOf(ActionRefusal);
		expect(rows("bank_transactions")).toHaveLength(0);
	});
});

describe("reconcile", () => {
	it("a credit linked to an invoice pays it", async () => {
		const { host, rows, id } = await setup();
		const inv = await host.collections.insert("invoices", {
			total: 150,
			currency: "RON",
		});
		const tx = await a.addTransaction(
			{
				account_id: id,
				date: "2026-10-30",
				type: "credit",
				amount: 150,
				description: "x",
				reference: "R1",
			},
			host as never,
		);
		await a.reconcile(
			{ transaction_id: tx.id, linked_type: "invoice", linked_id: inv.id },
			host as never,
		);
		expect(rows("invoices")[0]).toMatchObject({
			status: "paid",
			amount_paid: 150,
		});
		expect(rows("invoice_payments")[0]).toMatchObject({
			amount: 150,
			reference: "R1",
			payment_date: "2026-10-30",
		});
		expect(rows("bank_transactions")[0].is_reconciled).toBe(true);
		await refusal(
			a.reconcile(
				{ transaction_id: tx.id, linked_type: "invoice", linked_id: inv.id },
				host as never,
			),
			"already_reconciled",
		);
		await refusal(
			a.reconcile(
				{ transaction_id: tx.id, linked_type: "manual" },
				host as never,
			),
			"already_reconciled",
		);
	});

	it("refuses a debit against an invoice", async () => {
		const { host, id } = await setup();
		const tx = await a.addTransaction(
			{
				account_id: id,
				date: "2026-10-30",
				type: "debit",
				amount: 5,
				description: "x",
			},
			host as never,
		);
		await refusal(
			a.reconcile(
				{ transaction_id: tx.id, linked_type: "invoice", linked_id: "i" },
				host as never,
			),
			"not_a_credit",
		);
	});
});

it("snapshotBalance keeps one row a day", async () => {
	const { host, rows, id } = await setup();
	await a.snapshotBalance({ account_id: id }, host as never);
	await a.snapshotBalance({ account_id: id }, host as never);
	expect(rows("bank_balance_history")).toHaveLength(1);
	expect(rows("bank_balance_history")[0].balance).toBe(1000);
});

it("categorize: priority first, a bad regex matches nothing", () => {
	const r = (
		category: string,
		match_operator: string,
		match_value: string,
		priority = 0,
	) => ({
		category,
		match_field: "description",
		match_operator,
		match_value,
		priority,
	});
	expect(
		categorize(
			[
				r("a", "regex", "("),
				r("b", "contains", "x", 1),
				r("c", "contains", "x", 5),
			],
			{ description: "X" },
		),
	).toBe("c");
	expect(categorize([r("a", "regex", "(")], { description: "(" })).toBeNull();
});
