// The quotes actions over an in-memory data API: equality filters, `expect` on
// update (null included) and paging. The engine's own data API and its checks
// are tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from "bun:test";
import { ActionRefusal } from "@zveltio/sdk/extension";
import { quotesActions as a } from "./actions";

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
					Object.entries(q.filter ?? {}).every(([k, v]) => r[k] === v),
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
	await f.host.collections.insert("document_series", {
		doc_type: "quote",
		series: "QUO",
		next_number: 3,
		padding: 4,
		is_default: true,
	});
	await f.host.collections.insert("document_series", {
		doc_type: "invoice",
		series: "INV",
		next_number: 7,
		padding: 4,
		is_default: true,
	});
	return f;
}

const QUOTE = {
	title: "Website",
	client_name: "Client SRL",
	discount_percent: 10,
	lines: [
		{
			description: "Design",
			quantity: 2,
			unit_price: 100,
			tax_rate: 19,
			discount: 50,
		},
		{ description: "Hosting", quantity: 1, unit_price: 50, tax_rate: 9 },
	],
};

describe("createQuote", () => {
	it("claims a quote number and totals the lines", async () => {
		const { host, rows } = await setup();
		const q = await a.createQuote(QUOTE, host as never);
		// net 100 + 50 = 150; less 10 % = 135; VAT 90*19 % + 45*9 % = 17.10 + 4.05
		expect(q).toMatchObject({
			number: "QUO-0003",
			subtotal: 135,
			discount_amount: 15,
			tax_amount: 21.15,
			total: 156.15,
		});
		expect(rows("quote_lines").map((l) => l.total)).toEqual([107.1, 49.05]);
		expect(rows("document_series")[0].next_number).toBe(4);
	});

	it("refuses without a quote series", async () => {
		const { host } = fakeHost();
		await refusal(a.createQuote(QUOTE, host as never), "no_series");
	});
});

describe("convertToInvoice", () => {
	async function accepted() {
		const f = await setup();
		const q = await a.createQuote(QUOTE, f.host as never);
		await f.host.collections.update("quotes", String(q.id), {
			status: "accepted",
		});
		return { ...f, q };
	}

	it("invoices an accepted quote once, its line discounts folded into the price", async () => {
		const { host, rows, q } = await accepted();
		const inv = await a.convertToInvoice({ id: q.id }, host as never);
		expect(inv).toMatchObject({
			number: "INV-0007",
			client_name: "Client SRL",
			subtotal: 135,
			total: 156.15,
		});
		expect(rows("invoice_lines").map((l) => l.unit_price)).toEqual([50, 50]);
		expect(rows("quotes")[0].converted_to_invoice_id).toBe(inv.id);
		await refusal(
			a.convertToInvoice({ id: q.id }, host as never),
			"quote_converted",
		);
	});

	it("a line discount does not move the invoice total by a cent", async () => {
		const { host } = await setup();
		const q = await a.createQuote(
			{
				title: "t",
				client_name: "c",
				tax_rate: 9,
				lines: [
					{ description: "x", quantity: 3, unit_price: 33.33, discount: 10 },
				],
			},
			host as never,
		);
		await host.collections.update("quotes", String(q.id), {
			status: "accepted",
		});
		const inv = await a.convertToInvoice({ id: q.id }, host as never);
		expect([inv.subtotal, inv.total]).toEqual([q.subtotal, q.total]);
		expect(q.tax_amount).toBe(8.1);
	});

	it("refuses a quote that is not accepted", async () => {
		const { host } = await setup();
		const q = await a.createQuote(QUOTE, host as never);
		await refusal(
			a.convertToInvoice({ id: q.id }, host as never),
			"quote_not_accepted",
		);
	});

	it("a conversion that lost the race fails, so its invoice rolls back", async () => {
		const { host, q } = await accepted();
		const read = host.collections.read;
		// Both read the quote unconverted; the other one records its invoice first.
		host.collections.read = async (c: string, id: string) => {
			const r = await read(c, id);
			if (c === "quotes")
				await host.collections.update("quotes", id, {
					converted_to_invoice_id: "other",
				});
			return r;
		};
		await refusal(
			a.convertToInvoice({ id: q.id }, host as never),
			"precondition_failed",
		);
	});
});
