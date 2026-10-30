import { createHash } from "node:crypto";
import {
	ActionRefusal,
	type ExtensionAction,
	todayIn,
} from "@zveltio/sdk/extension";
// ponytail: invoicing's own code, inlined into this bundle when it is packed —
// a reconciled bank credit pays the invoice exactly as invoicing records a
// payment. A change to invoicing's actions needs a repack of banking too;
// check-bundle-sources hashes only this extension's engine/, so it will not say so.
import { invoicingActions } from "../../invoicing/engine/actions.js";
import { parseMT940 } from "./mt940.js";

// What banking does beyond plain edits, as actions (`POST /ext/finance/banking/actions/<name>`).
// Accounts, rules and cash-flow entries are plain edits through `/api/data`.
// The engine runs each action as the caller, inside the request transaction,
// through the data API: a refusal rolls back everything it wrote. Who may do
// what is the engine's rules on these collections, not this file's.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const A = "bank_accounts";
const T = "bank_transactions";
const PAGE = 500;
const n = (v: unknown) => Number(v ?? 0);
const round2 = (x: number) => Math.round(x * 100) / 100;

async function all(
	host: Host,
	collection: string,
	filter: Row,
	sort = "id",
): Promise<Row[]> {
	const out: Row[] = [];
	for (let page = 1; ; page++) {
		const res = await host.collections.list(collection, {
			filter,
			sort,
			limit: PAGE,
			page,
			count: "none",
		});
		const rows = (res.records as Row[]) ?? [];
		out.push(...rows);
		if (rows.length < PAGE) return out;
	}
}

async function account(host: Host, id: string): Promise<Row> {
	const row = await host.collections.read(A, id);
	if (!row)
		throw new ActionRefusal(404, "account_not_found", "No such bank account.");
	return row;
}

/**
 * The account, its row locked until the action commits (a write of the value
 * just read): a second import on the same account waits here, so its balance
 * is summed after the first one's transactions are visible.
 */
async function lockAccount(host: Host, id: string): Promise<Row> {
	const acc = await account(host, id);
	await host.collections.update(A, id, { balance: acc.balance });
	return acc;
}

type TxIn = {
	date: string;
	type: "credit" | "debit";
	amount: number;
	description: string;
	reference?: string | null;
	counterparty_name?: string | null;
};

/** The first active rule that matches names the category; account rules and global ones, highest priority first. */
export function categorize(rules: Row[], tx: Row): string | null {
	const sorted = [...rules]
		.filter((r) => r.is_active !== false)
		.sort(
			(a, b) =>
				n(b.priority) - n(a.priority) ||
				String(a.created_at).localeCompare(String(b.created_at)),
		);
	for (const rule of sorted) {
		const field = String(tx[String(rule.match_field)] ?? "").toLowerCase();
		const raw = String(rule.match_value);
		const value = raw.toLowerCase();
		let hit = false;
		switch (rule.match_operator) {
			case "contains":
				hit = field.includes(value);
				break;
			case "equals":
				hit = field === value;
				break;
			case "starts_with":
				hit = field.startsWith(value);
				break;
			case "ends_with":
				hit = field.endsWith(value);
				break;
			case "regex":
				try {
					hit = new RegExp(raw, "i").test(field);
				} catch {
					hit = false;
				}
				break;
			case "gt":
				hit = Number.parseFloat(field) > Number.parseFloat(raw);
				break;
			case "lt":
				hit = Number.parseFloat(field) < Number.parseFloat(raw);
				break;
		}
		if (hit) return String(rule.category);
	}
	return null;
}

async function rulesFor(host: Host, accountId: string): Promise<Row[]> {
	const [own, global] = await Promise.all([
		all(host, "bank_rules", { account_id: accountId }),
		all(host, "bank_rules", { account_id: null }),
	]);
	return [...own, ...global];
}

/** The same statement line imported twice is one transaction: its fingerprint is unique. */
export function fingerprint(accountId: string, t: TxIn): string {
	return createHash("sha256")
		.update(
			[
				accountId,
				String(t.date),
				t.type,
				String(t.amount),
				t.description ?? "",
				t.reference ?? "",
			].join("\u0000"),
		)
		.digest("hex");
}

/**
 * The account's balance, recomputed from its opening balance and every
 * transaction — never an increment, so a transaction written straight through
 * the data API is counted the next time any banking action runs.
 */
async function settleBalance(host: Host, accountId: string): Promise<Row> {
	const acc = await account(host, accountId);
	const moved = (await all(host, T, { account_id: accountId })).reduce(
		(s, t) =>
			s + Math.round(n(t.amount) * 100) * (t.type === "credit" ? 1 : -1),
		0,
	);
	return host.collections.update(A, accountId, {
		balance: round2(n(acc.opening_balance) + moved / 100),
	});
}

async function importRows(
	host: Host,
	accountId: string,
	source: string,
	filename: string | undefined,
	txs: TxIn[],
) {
	await lockAccount(host, accountId);
	const rules = await rulesFor(host, accountId);
	const imp = await host.collections.insert("bank_imports", {
		account_id: accountId,
		source,
		filename: filename ?? null,
		rows_imported: 0,
	});
	let imported = 0;
	for (const t of txs) {
		const hash = fingerprint(accountId, t);
		const seen = await host.collections.list(T, {
			filter: { import_hash: hash },
			limit: 1,
			count: "none",
		});
		if (((seen.records as Row[]) ?? []).length) continue;
		const category = categorize(rules, t);
		await host.collections.insert(T, {
			account_id: accountId,
			import_id: imp.id,
			date: t.date,
			type: t.type,
			amount: t.amount,
			description: t.description,
			reference: t.reference ?? null,
			counterparty_name: t.counterparty_name ?? null,
			category,
			auto_categorized: Boolean(category),
			import_hash: hash,
		});
		imported++;
	}
	await host.collections.update("bank_imports", String(imp.id), {
		rows_imported: imported,
		rows_skipped: txs.length - imported,
	});
	await settleBalance(host, accountId);
	return {
		import_id: imp.id,
		total: txs.length,
		imported,
		skipped: txs.length - imported,
	};
}

const addTransaction: ExtensionAction = async (input, host) => {
	const d = input as TxIn & { account_id: string; category?: string };
	await lockAccount(host, d.account_id);
	const category =
		d.category ?? categorize(await rulesFor(host, d.account_id), d);
	const tx = await host.collections.insert(T, {
		account_id: d.account_id,
		date: d.date,
		type: d.type,
		amount: d.amount,
		description: d.description,
		reference: d.reference ?? null,
		counterparty_name: d.counterparty_name ?? null,
		category,
		auto_categorized: !d.category && Boolean(category),
	});
	await settleBalance(host, d.account_id);
	return tx;
};

const importTransactions: ExtensionAction = async (input, host) => {
	const d = input as {
		account_id: string;
		source?: string;
		filename?: string;
		transactions: TxIn[];
	};
	return importRows(
		host,
		d.account_id,
		d.source ?? "csv",
		d.filename,
		d.transactions,
	);
};

/** An MT940 statement, all of it or nothing: a line left unread would leave the balance wrong with no trace. */
const importMT940: ExtensionAction = async (input, host) => {
	const d = input as { account_id: string; content: string; filename?: string };
	const parsed = parseMT940(d.content);
	if (parsed.unparsed.length) {
		throw new ActionRefusal(
			400,
			"mt940_unparsed",
			`${parsed.unparsed.length} statement line(s) could not be read; nothing was imported.`,
		);
	}
	if (!parsed.transactions.length)
		throw new ActionRefusal(
			400,
			"mt940_empty",
			"The statement holds no transactions.",
		);
	return importRows(
		host,
		d.account_id,
		"mt940",
		d.filename,
		parsed.transactions,
	);
};

const recategorize: ExtensionAction = async (input, host) => {
	const d = input as { account_id: string };
	const rules = await rulesFor(host, d.account_id);
	let updated = 0;
	for (const tx of await all(host, T, {
		account_id: d.account_id,
		is_reconciled: false,
	})) {
		const category = categorize(rules, tx);
		if (category && category !== tx.category) {
			await host.collections.update(T, String(tx.id), {
				category,
				auto_categorized: true,
			});
			updated++;
		}
	}
	return { updated };
};

/**
 * A transaction matched to what it paid. Linked to an invoice, a credit
 * records the payment on it through invoicing's own `recordPayment` in the
 * same transaction: an invoice that cannot take it (not issued, or less
 * outstanding than the credit) refuses the whole reconciliation, instead of a
 * reconciled line whose invoice still reads unpaid.
 */
const reconcile: ExtensionAction = async (input, host) => {
	const d = input as {
		transaction_id: string;
		linked_type?: "invoice" | "expense" | "manual";
		linked_id?: string;
		notes?: string;
	};
	const linked = d.linked_type ?? "manual";
	const tx = await host.collections.read(T, d.transaction_id);
	if (!tx)
		throw new ActionRefusal(
			404,
			"transaction_not_found",
			"No such transaction.",
		);
	if (linked === "invoice" && !d.linked_id)
		throw new ActionRefusal(
			400,
			"invoice_required",
			"An invoice reconciliation names the invoice.",
		);
	if (linked === "invoice" && tx.type !== "credit")
		throw new ActionRefusal(
			409,
			"not_a_credit",
			"Only money received pays an invoice.",
		);
	const existing = (
		await all(host, "bank_reconciliations", {
			transaction_id: d.transaction_id,
		})
	)[0];
	// A payment recorded on an invoice is not taken back by relinking the line, so a line that paid one stays put.
	if (existing?.linked_type === "invoice") {
		throw new ActionRefusal(
			409,
			"already_reconciled",
			"This transaction already paid an invoice.",
		);
	}
	const data = {
		linked_type: linked,
		linked_id: d.linked_id ?? null,
		matched_amount: n(tx.amount),
		notes: d.notes ?? null,
	};
	const rec = existing
		? await host.collections.update(
				"bank_reconciliations",
				String(existing.id),
				data,
			)
		: await host.collections.insert("bank_reconciliations", {
				transaction_id: d.transaction_id,
				...data,
			});
	await host.collections.update(T, d.transaction_id, { is_reconciled: true });
	let invoice: unknown = null;
	if (linked === "invoice") {
		invoice = await invoicingActions.recordPayment(
			{
				id: d.linked_id,
				amount: n(tx.amount),
				payment_date: String(tx.date).slice(0, 10),
				payment_method: "transfer",
				...(tx.reference ? { reference: String(tx.reference) } : {}),
				...(d.notes ? { notes: d.notes } : {}),
			},
			host,
		);
	}
	return { reconciliation: rec, invoice };
};

/** Today's balance, one row per account and day. */
const snapshotBalance: ExtensionAction = async (input, host) => {
	const d = input as { account_id: string };
	const acc = await settleBalance(host, d.account_id);
	const day = todayIn(host.timezone);
	const prior = (
		await all(host, "bank_balance_history", {
			account_id: d.account_id,
			snapshot_date: day,
		})
	)[0];
	return prior
		? host.collections.update("bank_balance_history", String(prior.id), {
				balance: acc.balance,
			})
		: host.collections.insert("bank_balance_history", {
				account_id: d.account_id,
				snapshot_date: day,
				balance: acc.balance,
			});
};

const refreshBalance: ExtensionAction = async (input, host) =>
	settleBalance(host, (input as { id: string }).id);

export const bankingActions: Record<string, ExtensionAction> = {
	addTransaction,
	importTransactions,
	importMT940,
	recategorize,
	reconcile,
	snapshotBalance,
	refreshBalance,
};
