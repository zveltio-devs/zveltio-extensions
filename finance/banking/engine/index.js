// @bun
// engine/actions.ts
import { createHash } from "crypto";
// /zveltio-extension/packages/sdk/src/extension/action-refusal.ts
var ACTION_REFUSAL = Symbol.for("zveltio.extension.action-refusal");

class ActionRefusal extends Error {
  status;
  code;
  [ACTION_REFUSAL] = true;
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ActionRefusal";
  }
}
// /zveltio-extension/packages/sdk/src/extension/dates.ts
function todayIn(timeZone, now = new Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}
// /zveltio-extension/packages/sdk/src/extension/reserved-paths.ts
var RESERVED_PATH_SEGMENTS = Object.freeze([
  "api",
  "ext",
  "admin",
  "app",
  "auth",
  "_app",
  "_server",
  ".well-known",
  "robots.txt",
  "sitemap.xml"
]);
// engine/mt940.ts
var MT940_LINE = /^:61:(\d{6})(\d{4})?(RC|RD|C|D)([A-Z])?(\d+,\d*)([NSF]\w{0,3})(.*)?$/;
function parseMT940(text) {
  const lines = text.replace(/\r\n/g, `
`).split(`
`);
  const transactions = [];
  const unparsed = [];
  let i = 0;
  while (i < lines.length) {
    const line = (lines[i] ?? "").trim();
    if (!line.startsWith(":61:")) {
      i++;
      continue;
    }
    const match = line.match(MT940_LINE);
    if (!match) {
      unparsed.push(line);
      i++;
      continue;
    }
    const [, ymd, , mark, , rawAmount, , rest] = match;
    const yy = ymd.slice(0, 2);
    const year = Number.parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    const date = `${year}-${ymd.slice(2, 4)}-${ymd.slice(4, 6)}`;
    const reversal = mark === "RC" || mark === "RD";
    const credit = mark === "C" || mark === "RD";
    const amount = Number.parseFloat(rawAmount.replace(",", ".").replace(/\.$/, ""));
    let description = "";
    let j = i + 1;
    if ((lines[j] ?? "").startsWith(":86:")) {
      description = (lines[j] ?? "").slice(4).trim();
      j++;
      while (j < lines.length && !(lines[j] ?? "").trimStart().startsWith(":")) {
        description += ` ${(lines[j] ?? "").trim()}`;
        j++;
      }
      description = description.trim();
    }
    transactions.push({
      date,
      type: credit ? "credit" : "debit",
      amount,
      description,
      reference: (rest ?? "").trim(),
      reversal
    });
    i = j;
  }
  return { transactions, unparsed };
}

// engine/actions.ts
var A = "bank_accounts";
var T = "bank_transactions";
var PAGE = 500;
var n = (v) => Number(v ?? 0);
var round2 = (x) => Math.round(x * 100) / 100;
async function all(host, collection, filter, sort = "id") {
  const out = [];
  for (let page = 1;; page++) {
    const res = await host.collections.list(collection, {
      filter,
      sort,
      limit: PAGE,
      page,
      count: "none"
    });
    const rows = res.records ?? [];
    out.push(...rows);
    if (rows.length < PAGE)
      return out;
  }
}
async function account(host, id) {
  const row = await host.collections.read(A, id);
  if (!row)
    throw new ActionRefusal(404, "account_not_found", "No such bank account.");
  return row;
}
async function lockAccount(host, id) {
  const acc = await account(host, id);
  await host.collections.update(A, id, { balance: acc.balance });
  return acc;
}
function categorize(rules, tx) {
  const sorted = [...rules].filter((r) => r.is_active !== false).sort((a, b) => n(b.priority) - n(a.priority) || String(a.created_at).localeCompare(String(b.created_at)));
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
    if (hit)
      return String(rule.category);
  }
  return null;
}
async function rulesFor(host, accountId) {
  const [own, global] = await Promise.all([
    all(host, "bank_rules", { account_id: accountId }),
    all(host, "bank_rules", { account_id: null })
  ]);
  return [...own, ...global];
}
function fingerprint(accountId, t) {
  return createHash("sha256").update([
    accountId,
    String(t.date),
    t.type,
    String(t.amount),
    t.description ?? "",
    t.reference ?? ""
  ].join("\x00")).digest("hex");
}
async function settleBalance(host, accountId) {
  const acc = await account(host, accountId);
  const moved = (await all(host, T, { account_id: accountId })).reduce((s, t) => s + Math.round(n(t.amount) * 100) * (t.type === "credit" ? 1 : -1), 0);
  return host.collections.update(A, accountId, {
    balance: round2(n(acc.opening_balance) + moved / 100)
  });
}
async function importRows(host, accountId, source, filename, txs) {
  await lockAccount(host, accountId);
  const rules = await rulesFor(host, accountId);
  const imp = await host.collections.insert("bank_imports", {
    account_id: accountId,
    source,
    filename: filename ?? null,
    rows_imported: 0
  });
  let imported = 0;
  for (const t of txs) {
    const hash = fingerprint(accountId, t);
    const seen = await host.collections.list(T, {
      filter: { import_hash: hash },
      limit: 1,
      count: "none"
    });
    if ((seen.records ?? []).length)
      continue;
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
      import_hash: hash
    });
    imported++;
  }
  await host.collections.update("bank_imports", String(imp.id), {
    rows_imported: imported,
    rows_skipped: txs.length - imported
  });
  await settleBalance(host, accountId);
  return {
    import_id: imp.id,
    total: txs.length,
    imported,
    skipped: txs.length - imported
  };
}
var addTransaction = async (input, host) => {
  const d = input;
  await lockAccount(host, d.account_id);
  const category = d.category ?? categorize(await rulesFor(host, d.account_id), d);
  const tx = await host.collections.insert(T, {
    account_id: d.account_id,
    date: d.date,
    type: d.type,
    amount: d.amount,
    description: d.description,
    reference: d.reference ?? null,
    counterparty_name: d.counterparty_name ?? null,
    category,
    auto_categorized: !d.category && Boolean(category)
  });
  await settleBalance(host, d.account_id);
  return tx;
};
var importTransactions = async (input, host) => {
  const d = input;
  return importRows(host, d.account_id, d.source ?? "csv", d.filename, d.transactions);
};
var importMT940 = async (input, host) => {
  const d = input;
  const parsed = parseMT940(d.content);
  if (parsed.unparsed.length) {
    throw new ActionRefusal(400, "mt940_unparsed", `${parsed.unparsed.length} statement line(s) could not be read; nothing was imported.`);
  }
  if (!parsed.transactions.length)
    throw new ActionRefusal(400, "mt940_empty", "The statement holds no transactions.");
  return importRows(host, d.account_id, "mt940", d.filename, parsed.transactions);
};
var recategorize = async (input, host) => {
  const d = input;
  const rules = await rulesFor(host, d.account_id);
  let updated = 0;
  for (const tx of await all(host, T, {
    account_id: d.account_id,
    is_reconciled: false
  })) {
    const category = categorize(rules, tx);
    if (category && category !== tx.category) {
      await host.collections.update(T, String(tx.id), {
        category,
        auto_categorized: true
      });
      updated++;
    }
  }
  return { updated };
};
var reconcile = async (input, host) => {
  const d = input;
  const linked = d.linked_type ?? "manual";
  const tx = await host.collections.read(T, d.transaction_id);
  if (!tx)
    throw new ActionRefusal(404, "transaction_not_found", "No such transaction.");
  if (linked === "invoice" && !d.linked_id)
    throw new ActionRefusal(400, "invoice_required", "An invoice reconciliation names the invoice.");
  if (linked === "invoice" && tx.type !== "credit")
    throw new ActionRefusal(409, "not_a_credit", "Only money received pays an invoice.");
  const existing = (await all(host, "bank_reconciliations", {
    transaction_id: d.transaction_id
  }))[0];
  if (existing?.linked_type === "invoice") {
    throw new ActionRefusal(409, "already_reconciled", "This transaction already paid an invoice.");
  }
  const data = {
    linked_type: linked,
    linked_id: d.linked_id ?? null,
    matched_amount: n(tx.amount),
    notes: d.notes ?? null
  };
  const rec = existing ? await host.collections.update("bank_reconciliations", String(existing.id), data) : await host.collections.insert("bank_reconciliations", {
    transaction_id: d.transaction_id,
    ...data
  });
  await host.collections.update(T, d.transaction_id, { is_reconciled: true });
  let invoice = null;
  if (linked === "invoice") {
    if (!host.actions)
      throw new ActionRefusal(409, "engine_too_old", "This engine cannot run another extension's action.");
    invoice = await host.actions.run("finance/invoicing", "recordPayment", {
      id: d.linked_id,
      amount: n(tx.amount),
      payment_date: String(tx.date).slice(0, 10),
      payment_method: "transfer",
      ...tx.reference ? { reference: String(tx.reference) } : {},
      ...d.notes ? { notes: d.notes } : {}
    });
  }
  return { reconciliation: rec, invoice };
};
var snapshotBalance = async (input, host) => {
  const d = input;
  const acc = await settleBalance(host, d.account_id);
  const day = todayIn(host.timezone);
  const prior = (await all(host, "bank_balance_history", {
    account_id: d.account_id,
    snapshot_date: day
  }))[0];
  return prior ? host.collections.update("bank_balance_history", String(prior.id), {
    balance: acc.balance
  }) : host.collections.insert("bank_balance_history", {
    account_id: d.account_id,
    snapshot_date: day,
    balance: acc.balance
  });
};
var refreshBalance = async (input, host) => settleBalance(host, input.id);
var bankingActions = {
  addTransaction,
  importTransactions,
  importMT940,
  recategorize,
  reconcile,
  snapshotBalance,
  refreshBalance
};

// engine/index.ts
var extension = {
  name: "finance/banking",
  category: "finance",
  mountStrategy: "subapp",
  actions: bankingActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
