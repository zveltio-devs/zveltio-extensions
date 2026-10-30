// @bun
// packages/sdk/src/extension/action-refusal.ts
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
// packages/sdk/src/extension/dates.ts
function todayIn(timeZone, now = new Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}
// packages/sdk/src/extension/reserved-paths.ts
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
// ../zveltio-extensions/finance/invoicing/engine/actions.ts
var I = "invoices";
var L = "invoice_lines";
var CN = "credit_notes";
var PAGE = 500;
var PAYABLE = ["sent", "overdue", "partially_paid"];
var n = (v) => Number(v ?? 0);
var round2 = (x) => Math.round(x * 100) / 100;
var day = (v) => v ? String(v).slice(0, 10) : "";
var records = (res) => res.records ?? [];
function blankless(d) {
  const out = Object.fromEntries(Object.entries(d).filter(([, v]) => v !== "" && v !== null));
  if (Array.isArray(d.lines))
    out.lines = d.lines.map((l) => blankless(l));
  return out;
}
async function load(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what.replace("_", " ")}.`);
  return row;
}
async function all(host, collection, filter, sort = "id") {
  const out = [];
  for (let page = 1;; page++) {
    const recs = records(await host.collections.list(collection, { filter, limit: PAGE, page, sort, count: "none" }));
    out.push(...recs);
    if (recs.length < PAGE)
      return out;
  }
}
function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function addMonths(iso, months) {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
function isValidCui(value) {
  const digits = String(value).trim().toUpperCase().replace(/^RO/, "").replace(/\s/g, "");
  if (!/^\d{2,10}$/.test(digits))
    return false;
  const padded = digits.slice(0, -1).padStart(9, "0");
  const key = "753217532";
  let sum = 0;
  for (let i = 0;i < 9; i++)
    sum += Number(padded[i]) * Number(key[i]);
  return sum * 10 % 11 % 10 === Number(digits.slice(-1));
}
async function claimNumber(host, docType, series) {
  for (let attempt = 0;attempt < 5; attempt++) {
    const found = records(await host.collections.list("document_series", {
      filter: { doc_type: docType, ...series && { series } },
      limit: 100,
      count: "none"
    })).sort((a, b) => Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)) || String(a.created_at).localeCompare(String(b.created_at)));
    const s = found[0];
    if (!s) {
      throw new ActionRefusal(400, "no_series", series ? `There is no ${docType} series "${series}".` : `No ${docType} series is configured.`);
    }
    const next = n(s.next_number);
    try {
      await host.collections.update("document_series", String(s.id), { next_number: next + 1 }, { expect: { next_number: [String(s.next_number)] } });
    } catch (err) {
      if (err.code === "precondition_failed")
        continue;
      throw err;
    }
    return { number: `${s.series}-${String(next).padStart(n(s.padding) || 1, "0")}`, series: String(s.series) };
  }
  throw new ActionRefusal(409, "series_busy", "The series is being used by other requests; try again.");
}
async function seller(host) {
  const c = records(await host.collections.list("company_profile", { sort: "created_at", limit: 1, count: "none" }))[0];
  if (!c)
    return { seller_country: "RO" };
  return {
    seller_name: c.legal_name || c.name,
    seller_tax_id: c.tax_id ?? null,
    seller_reg_no: c.reg_no ?? null,
    seller_address: c.address ?? null,
    seller_city: c.city ?? null,
    seller_county: c.county ?? null,
    seller_country: c.country ?? "RO",
    seller_iban: c.iban ?? null,
    seller_bank: c.bank ?? null
  };
}
var COMPANY = [
  "name",
  "legal_name",
  "tax_id",
  "reg_no",
  "vat_payer",
  "vat_on_collection",
  "address",
  "city",
  "county",
  "country",
  "iban",
  "bank",
  "share_capital",
  "email",
  "phone",
  "website",
  "logo_url"
];
var saveCompany = async (input, host) => {
  const d = input;
  const data = Object.fromEntries(COMPANY.filter((k) => (k in d)).map((k) => [k, d[k] === "" ? null : d[k]]));
  const current = async () => records(await host.collections.list("company_profile", { sort: "created_at", limit: 1, count: "none" }))[0];
  const row = await current();
  if (row)
    return host.collections.update("company_profile", String(row.id), data);
  return host.collections.insert("company_profile", { ...data, singleton: "company" }).catch(async (err) => {
    const won = await current();
    if (!won)
      throw err;
    return host.collections.update("company_profile", String(won.id), data);
  });
};
var PARTY = [
  "client_id",
  "client_type",
  "client_name",
  "client_email",
  "client_address",
  "client_tax_id",
  "client_reg_no",
  "client_city",
  "client_county",
  "client_country",
  "seller_name",
  "seller_tax_id",
  "seller_reg_no",
  "seller_address",
  "seller_city",
  "seller_county",
  "seller_country",
  "seller_iban",
  "seller_bank"
];
var AMOUNTS = [
  "currency",
  "subtotal",
  "tax_rate",
  "tax_amount",
  "total",
  "discount_amount",
  "discount_percent",
  "vat_breakdown",
  "vat_regime",
  "vat_exemption_reason",
  "exchange_rate",
  "exchange_date",
  "tax_amount_ron",
  "notes",
  "footer_notes",
  "po_number"
];
var pick = (row, keys) => Object.fromEntries(keys.map((k) => [k, row[k] ?? null]));
async function copyLines(host, from, to) {
  for (const l of await all(host, L, { invoice_id: from }, "sort_order")) {
    await host.collections.insert(L, {
      invoice_id: to,
      ...pick(l, ["description", "quantity", "unit", "unit_price", "tax_rate", "total", "sort_order"]),
      metadata: l.metadata ?? {}
    });
  }
}
var createInvoice = async (input, host) => {
  const d = blankless(input);
  const docType = d.doc_type ?? "invoice";
  const regime = d.vat_regime ?? "standard";
  const currency = d.currency ?? "RON";
  if (d.client_type === "organization" && !d.client_tax_id) {
    throw new ActionRefusal(400, "client_tax_id_required", "An invoice to an organization names its tax code (Cod fiscal art. 319).");
  }
  const roClient = !d.client_country || d.client_country.toUpperCase() === "RO";
  if (d.client_tax_id && roClient && !isValidCui(d.client_tax_id)) {
    throw new ActionRefusal(400, "client_tax_id_invalid", `"${d.client_tax_id}" is not a valid Romanian tax code: the check digit does not match.`);
  }
  if (regime === "exempt" && !d.vat_exemption_reason) {
    throw new ActionRefusal(400, "exemption_reason_required", "An exempt invoice states the legal basis of the exemption (Cod fiscal art. 319).");
  }
  if (currency !== "RON" && !d.exchange_rate) {
    throw new ActionRefusal(400, "exchange_rate_required", `An invoice in ${currency} records its exchange rate to RON (Cod fiscal art. 290).`);
  }
  if (docType === "delivery_note" && !d.delegate_name) {
    throw new ActionRefusal(400, "delegate_required", "A delivery note names who carries the goods.");
  }
  const issue = d.issue_date ?? todayIn(host.timezone);
  const due = d.due_date ?? addDays(issue, d.due_days ?? 30);
  const disc = d.discount_percent ?? 0;
  const chargesVat = regime === "standard" || regime === "vat_on_collection";
  const lines = d.lines.map((l, i) => {
    const quantity = l.quantity ?? 1;
    const unit_price = l.unit_price ?? 0;
    const tax_rate = l.tax_rate ?? 19;
    const base = quantity * unit_price * (1 - disc / 100);
    const vat = chargesVat ? round2(base * tax_rate / 100) : 0;
    return { l, quantity, unit_price, tax_rate, base, vat, sort_order: l.sort_order ?? i };
  });
  const gross = lines.reduce((s, x) => s + x.quantity * x.unit_price, 0);
  const subtotal = lines.reduce((s, x) => s + x.base, 0);
  const tax = lines.reduce((s, x) => s + x.vat, 0);
  const byRate = new Map;
  for (const x of lines) {
    const e = byRate.get(x.tax_rate) ?? { rate: x.tax_rate, base: 0, vat: 0 };
    e.base += x.base;
    e.vat += x.vat;
    byRate.set(x.tax_rate, e);
  }
  const claimed = await claimNumber(host, docType, d.series);
  const inv = await host.collections.insert(I, {
    ...pick(d, PARTY.filter((k) => k.startsWith("client_"))),
    ...await seller(host),
    ...pick(d, ["delegate_name", "delegate_id_card", "delegate_vehicle", "delivery_date", "exchange_date", "notes", "footer_notes", "po_number", "recurring_interval", "vat_exemption_reason"]),
    number: claimed.number,
    series: claimed.series,
    doc_type: docType,
    issue_date: issue,
    due_date: due,
    currency,
    vat_regime: regime,
    exchange_rate: d.exchange_rate ?? null,
    tax_rate: d.tax_rate ?? 19,
    discount_percent: disc,
    discount_amount: round2(gross - subtotal),
    subtotal: round2(subtotal),
    tax_amount: round2(tax),
    total: round2(subtotal + tax),
    tax_amount_ron: d.exchange_rate ? round2(tax * d.exchange_rate) : null,
    vat_breakdown: [...byRate.values()].sort((a, b) => b.rate - a.rate).map((e) => ({ rate: e.rate, base: round2(e.base), vat: round2(e.vat) }))
  });
  for (const x of lines) {
    await host.collections.insert(L, {
      invoice_id: inv.id,
      description: x.l.description,
      quantity: x.quantity,
      unit: x.l.unit ?? null,
      unit_price: x.unit_price,
      tax_rate: x.tax_rate,
      total: round2(x.base + x.vat),
      sort_order: x.sort_order,
      metadata: { ...x.l.metadata ?? {}, ...x.l.catalogue_item && { catalogue_item: x.l.catalogue_item } }
    });
  }
  return inv;
};
var recordPayment = async (input, host) => {
  const d = input;
  const inv = await load(host, I, d.id, "invoice");
  if (!PAYABLE.includes(String(inv.status))) {
    throw new ActionRefusal(409, "invoice_not_payable", "Only a sent, overdue or partly paid invoice takes a payment.");
  }
  const outstanding = round2(n(inv.total) - n(inv.amount_paid));
  const amount = round2(d.amount ?? outstanding);
  if (amount <= 0 || amount > outstanding) {
    throw new ActionRefusal(409, "exceeds_outstanding", `A payment is more than 0 and at most the outstanding ${outstanding}.`);
  }
  const paid = round2(n(inv.amount_paid) + amount);
  const full = paid >= n(inv.total);
  const invoice = await host.collections.update(I, d.id, { amount_paid: paid, status: full ? "paid" : "partially_paid", ...full && { paid_at: new Date().toISOString() } }, { expect: { amount_paid: [String(inv.amount_paid)], status: [String(inv.status)] } });
  const payment = await host.collections.insert("invoice_payments", {
    invoice_id: d.id,
    amount,
    currency: inv.currency,
    payment_date: d.payment_date ?? todayIn(host.timezone),
    payment_method: d.payment_method ?? "transfer",
    reference: d.reference ?? null,
    notes: d.notes ?? null
  });
  return { payment, invoice };
};
var markOverdue = async (_input, host) => {
  const today = todayIn(host.timezone);
  const late = (await all(host, I, { status: "sent" })).filter((r) => day(r.due_date) < today);
  for (const r of late)
    await host.collections.update(I, String(r.id), { status: "overdue" }, { expect: { status: ["sent"] } });
  return { marked: late.length };
};
var convertProforma = async (input, host) => {
  const { id } = input;
  const p = await load(host, I, id, "invoice");
  if (p.doc_type !== "proforma")
    throw new ActionRefusal(409, "not_a_proforma", "Only a proforma converts to an invoice.");
  const claimed = await claimNumber(host, "invoice");
  const done = records(await host.collections.list(I, { filter: { converted_from_id: id }, limit: 1, count: "none" }))[0];
  if (done)
    throw new ActionRefusal(409, "already_converted", `Already converted to ${done.number}.`);
  const inv = await host.collections.insert(I, {
    ...pick(p, [...PARTY, ...AMOUNTS, "delivery_date", "due_date"]),
    number: claimed.number,
    series: claimed.series,
    doc_type: "invoice",
    issue_date: todayIn(host.timezone),
    converted_from_id: id
  });
  await copyLines(host, id, String(inv.id));
  return inv;
};
var generateNext = async (input, host) => {
  const { id } = input;
  const i = await load(host, I, id, "invoice");
  const months = { monthly: 1, quarterly: 3, yearly: 12 }[String(i.recurring_interval)];
  if (!months)
    throw new ActionRefusal(409, "not_recurring", "This invoice does not recur.");
  if (i.status === "draft" || i.status === "cancelled") {
    throw new ActionRefusal(409, "invoice_not_issued", "Only an issued invoice generates the next one.");
  }
  const issue = addDays(day(i.due_date), 1);
  const claimed = await claimNumber(host, "invoice", i.series ? String(i.series) : undefined);
  const inv = await host.collections.insert(I, {
    ...pick(i, [...PARTY, ...AMOUNTS, "recurring_interval"]),
    number: claimed.number,
    series: claimed.series,
    doc_type: i.doc_type,
    issue_date: issue,
    due_date: addMonths(issue, months)
  });
  await copyLines(host, id, String(inv.id));
  return inv;
};
var createCreditNote = async (input, host) => {
  const d = blankless(input);
  const original = d.original_invoice_id ? await load(host, I, d.original_invoice_id, "invoice") : null;
  const lines = d.lines.map((l) => {
    const quantity = l.quantity ?? 1;
    const unit_price = l.unit_price ?? 0;
    const tax_rate = l.tax_rate ?? 19;
    return { description: l.description, quantity, unit_price, tax_rate, base: quantity * unit_price };
  });
  const subtotal = lines.reduce((s, l) => s + l.base, 0);
  const tax = lines.reduce((s, l) => s + l.base * l.tax_rate / 100, 0);
  const claimed = await claimNumber(host, "credit_note");
  const cn = await host.collections.insert(CN, {
    number: claimed.number,
    original_invoice_id: d.original_invoice_id ?? null,
    client_id: original?.client_id ?? null,
    client_name: d.client_name,
    client_email: d.client_email ?? null,
    reason: d.reason,
    issue_date: d.issue_date ?? todayIn(host.timezone),
    currency: d.currency ?? original?.currency ?? "RON",
    subtotal: round2(subtotal),
    tax_amount: round2(tax),
    total: round2(subtotal + tax)
  });
  let sort = 0;
  for (const l of lines) {
    await host.collections.insert("credit_note_lines", {
      credit_note_id: cn.id,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      tax_rate: l.tax_rate,
      total: round2(l.base * (1 + l.tax_rate / 100)),
      sort_order: sort++
    });
  }
  return cn;
};
var applyCreditNote = async (input, host) => {
  const { id, invoice_id } = input;
  const cn = await load(host, CN, id, "credit_note");
  if (cn.status !== "issued")
    throw new ActionRefusal(409, "credit_note_not_issued", "Only an issued credit note can be applied.");
  const inv = await load(host, I, invoice_id, "invoice");
  if (!PAYABLE.includes(String(inv.status))) {
    throw new ActionRefusal(409, "invoice_not_payable", "A credit note applies to a sent, overdue or partly paid invoice.");
  }
  await host.collections.update(CN, id, { status: "applied" }, { expect: { status: ["issued"] } });
  const applied = round2(Math.max(0, Math.min(n(cn.total), n(inv.total) - n(inv.amount_paid))));
  const paid = round2(n(inv.amount_paid) + applied);
  const full = paid >= n(inv.total);
  const invoice = await host.collections.update(I, invoice_id, { amount_paid: paid, status: full ? "paid" : "partially_paid", ...full && { paid_at: new Date().toISOString() } }, { expect: { amount_paid: [String(inv.amount_paid)], status: [String(inv.status)] } });
  return { applied_amount: applied, invoice_status: invoice.status };
};
function esc(value) {
  if (value === null || value === undefined)
    return "";
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
var renderInvoice = async (input, host) => {
  const { id } = input;
  const inv = await load(host, I, id, "invoice");
  const lines = await all(host, L, { invoice_id: id }, "sort_order");
  const breakdown = Array.isArray(inv.vat_breakdown) ? inv.vat_breakdown : [];
  const cur = esc(inv.currency);
  const money = (v) => `${n(v).toFixed(2)} ${cur}`;
  const regimeNote = inv.vat_regime === "reverse_charge" ? "Taxare invers\u0103 (art. 331 Cod fiscal)" : inv.vat_regime === "vat_on_collection" ? "TVA la \xEEncasare" : inv.vat_regime === "exempt" ? `Scutit de TVA${inv.vat_exemption_reason ? ` \u2014 ${esc(inv.vat_exemption_reason)}` : ""}` : inv.vat_regime === "non_taxable" ? "Opera\u021Biune neimpozabil\u0103" : "";
  const title = { invoice: "FACTUR\u0102", proforma: "FACTUR\u0102 PROFORM\u0102", delivery_note: "AVIZ DE \xCENSO\u021AIRE A M\u0102RFII" }[String(inv.doc_type)] ?? "FACTUR\u0102";
  const html = `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8">
<title>${title} ${esc(inv.number)}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#222;font-size:13px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{padding:7px 10px;border:1px solid #ddd;text-align:left}
th{background:#f5f5f5}.total-row{font-weight:bold;background:#fafafa}
.parties{display:flex;gap:40px;margin-top:24px}.party{flex:1}
.party h3{margin:0 0 6px;font-size:12px;text-transform:uppercase;color:#666}
.num{text-align:right}.dates{text-align:right}
.regime{margin-top:14px;padding:8px 10px;border-left:3px solid #444;background:#f7f7f7}
.vat-table{width:auto;min-width:320px}</style></head>
<body>
<div style="display:flex;justify-content:space-between;align-items:flex-start">
  <div><h1 style="margin:0">${title}</h1>
    <div style="font-size:16px">Seria ${esc(inv.series)} nr. ${esc(inv.number)}</div></div>
  <div class="dates">
    <strong>Data emiterii:</strong> ${esc(day(inv.issue_date))}<br>
    ${inv.delivery_date ? `<strong>Data livr\u0103rii:</strong> ${esc(day(inv.delivery_date))}<br>` : ""}
    <strong>Scaden\u021B\u0103:</strong> ${esc(day(inv.due_date))}
  </div>
</div>
<div class="parties">
  <div class="party">
    <h3>Furnizor</h3>
    <strong>${esc(inv.seller_name ?? "\u2014")}</strong><br>
    ${inv.seller_tax_id ? `CUI: ${esc(inv.seller_tax_id)}<br>` : ""}
    ${inv.seller_reg_no ? `Nr. Reg. Com.: ${esc(inv.seller_reg_no)}<br>` : ""}
    ${inv.seller_address ? `${esc(inv.seller_address)}<br>` : ""}
    ${inv.seller_iban ? `IBAN: ${esc(inv.seller_iban)}<br>` : ""}
    ${inv.seller_bank ? `Banca: ${esc(inv.seller_bank)}` : ""}
  </div>
  <div class="party">
    <h3>Client</h3>
    <strong>${esc(inv.client_name)}</strong><br>
    ${inv.client_tax_id ? `CUI: ${esc(inv.client_tax_id)}<br>` : ""}
    ${inv.client_reg_no ? `Nr. Reg. Com.: ${esc(inv.client_reg_no)}<br>` : ""}
    ${inv.client_address ? `${esc(inv.client_address)}<br>` : ""}
    ${inv.client_email ? `${esc(inv.client_email)}<br>` : ""}
    ${inv.po_number ? `Nr. comand\u0103: ${esc(inv.po_number)}` : ""}
  </div>
</div>
${inv.delegate_name ? `<p>Delegat: ${esc(inv.delegate_name)}${inv.delegate_id_card ? `, act identitate ${esc(inv.delegate_id_card)}` : ""}${inv.delegate_vehicle ? `, mijloc de transport ${esc(inv.delegate_vehicle)}` : ""}</p>` : ""}
<table>
  <thead><tr><th>Descriere</th><th>U.M.</th><th class="num">Cantitate</th><th class="num">Pre\u021B unitar</th><th class="num">TVA %</th><th class="num">Total</th></tr></thead>
  <tbody>
  ${lines.map((l) => `<tr><td>${esc(l.description)}</td><td>${esc(l.unit)}</td><td class="num">${esc(l.quantity)}</td><td class="num">${money(l.unit_price)}</td><td class="num">${esc(l.tax_rate)}%</td><td class="num">${money(l.total)}</td></tr>`).join("")}
  </tbody>
</table>
${breakdown.length > 0 ? `<table class="vat-table">
  <thead><tr><th>Cot\u0103 TVA</th><th class="num">Baz\u0103 impozabil\u0103</th><th class="num">TVA</th></tr></thead>
  <tbody>${breakdown.map((b) => `<tr><td>${esc(b.rate)}%</td><td class="num">${money(b.base)}</td><td class="num">${money(b.vat)}</td></tr>`).join("")}</tbody>
</table>` : ""}
<table style="width:auto;min-width:320px;margin-left:auto">
  <tr><td>Subtotal</td><td class="num">${money(inv.subtotal)}</td></tr>
  ${n(inv.discount_amount) > 0 ? `<tr><td>Reducere (${esc(inv.discount_percent)}%)</td><td class="num">-${money(inv.discount_amount)}</td></tr>` : ""}
  <tr><td>TVA</td><td class="num">${money(inv.tax_amount)}</td></tr>
  <tr class="total-row"><td>TOTAL DE PLAT\u0102</td><td class="num">${money(inv.total)}</td></tr>
</table>
${inv.exchange_rate ? `<p>Curs valutar: 1 ${cur} = ${esc(inv.exchange_rate)} RON${inv.exchange_date ? ` la data de ${esc(day(inv.exchange_date))}` : ""}${inv.tax_amount_ron ? ` \xB7 TVA \xEEn lei: ${n(inv.tax_amount_ron).toFixed(2)} RON` : ""}</p>` : ""}
${regimeNote ? `<div class="regime">${regimeNote}</div>` : ""}
${inv.notes ? `<p><strong>Note:</strong> ${esc(inv.notes)}</p>` : ""}
${inv.footer_notes ? `<p style="font-size:11px;color:#666">${esc(inv.footer_notes)}</p>` : ""}
</body></html>`;
  return { html };
};
var invoicingActions = {
  saveCompany,
  createInvoice,
  recordPayment,
  markOverdue,
  convertProforma,
  generateNext,
  createCreditNote,
  applyCreditNote,
  renderInvoice
};

// ../zveltio-extensions/hr/time-tracking/engine/actions.ts
var P = "time_projects";
var E = "time_entries";
var T = "active_timers";
var PAGE2 = 500;
async function load2(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}
async function timerOf(host, employee_id) {
  const res = await host.collections.list(T, { filter: { employee_id }, limit: 1, count: "none" });
  return (res.records ?? [])[0] ?? null;
}
async function insertEntry(host, d) {
  const project = await load2(host, P, d.project_id, "project");
  return host.collections.insert(E, { ...d, hourly_rate: project.hourly_rate });
}
var logTime = async (input, host) => insertEntry(host, input);
var startTimer = async (input, host) => {
  const d = input;
  await load2(host, P, d.project_id, "project");
  const data = { task_description: "", is_billable: true, notes: null, ...d, started_at: new Date().toISOString() };
  const running = await timerOf(host, d.employee_id);
  return running ? host.collections.update(T, running.id, data) : host.collections.insert(T, data);
};
var stopTimer = async (input, host) => {
  const { employee_id } = input;
  const t = await timerOf(host, employee_id);
  if (!t)
    throw new ActionRefusal(409, "no_timer", "This employee has no running timer.");
  await host.collections.delete(T, t.id);
  const end = new Date;
  const duration_minutes = Math.round((end.getTime() - new Date(t.started_at).getTime()) / 60000);
  if (duration_minutes < 1)
    return { discarded: true };
  return insertEntry(host, {
    employee_id,
    project_id: t.project_id,
    task_description: t.task_description,
    is_billable: t.is_billable,
    notes: t.notes ?? null,
    date: end.toISOString().slice(0, 10),
    start_time: t.started_at,
    end_time: end.toISOString(),
    duration_minutes
  });
};
var computeTimesheet = async (input, host) => {
  const { employee_id, week_start } = input;
  const end = new Date(`${week_start}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  const week_end = end.toISOString().slice(0, 10);
  let minutes = 0;
  for (let page = 1;; page++) {
    const res = await host.collections.list(E, {
      filter: { employee_id, date: { gte: week_start } },
      limit: PAGE2,
      page,
      sort: "id",
      count: "none"
    });
    const recs = res.records ?? [];
    for (const e of recs)
      if (String(e.date).slice(0, 10) <= week_end)
        minutes += Number(e.duration_minutes);
    if (recs.length < PAGE2)
      break;
  }
  const total_hours = Math.round(minutes / 60 * 100) / 100;
  const found = await host.collections.list("timesheets", { filter: { employee_id, week_start }, limit: 1, count: "none" });
  const sheet = (found.records ?? [])[0];
  if (!sheet)
    return host.collections.insert("timesheets", { employee_id, week_start, week_end, total_hours });
  if (sheet.status !== "draft")
    throw new ActionRefusal(409, "timesheet_not_draft", "Only a draft timesheet is recomputed.");
  return host.collections.update("timesheets", sheet.id, { total_hours }, { expect: { status: ["draft"] } });
};
var invoiceEntries = async (input, host) => {
  const d = input;
  const project = await load2(host, P, d.project_id, "project");
  const entries = [];
  for (const id of new Set(d.entry_ids)) {
    const e = await load2(host, E, id, "entry");
    if (e.project_id !== d.project_id || !e.is_billable || e.is_billed) {
      throw new ActionRefusal(409, "entry_not_billable", `Entry ${id} is not billable, already billed, or of another project.`);
    }
    entries.push(e);
  }
  const client_name = d.client_name || project.client_name;
  if (!client_name)
    throw new ActionRefusal(400, "client_required", "The project names no client; give client_name.");
  const inv = await invoicingActions.createInvoice({
    client_name,
    ...d.client_tax_id && { client_tax_id: d.client_tax_id },
    currency: project.currency ?? "RON",
    ...d.invoice_date && { issue_date: d.invoice_date },
    ...d.due_days !== undefined && { due_days: d.due_days },
    ...d.series && { series: d.series },
    ...d.exchange_rate && { exchange_rate: d.exchange_rate },
    ...d.notes && { notes: d.notes },
    lines: entries.map((e, i) => ({
      description: String(e.task_description || "Time entry"),
      quantity: Math.round(Number(e.duration_minutes) / 60 * 100) / 100,
      unit: "h",
      unit_price: Number(e.hourly_rate ?? project.hourly_rate ?? 0),
      sort_order: i,
      metadata: { time_entry_id: e.id }
    }))
  }, host);
  for (const e of entries) {
    await host.collections.update(E, String(e.id), { is_billed: true, invoice_id: inv.id }, { expect: { is_billed: [false] } });
  }
  return inv;
};
var timeTrackingActions = { logTime, startTimer, stopTimer, computeTimesheet, invoiceEntries };

// ../zveltio-extensions/hr/time-tracking/engine/index.ts
var extension = {
  name: "hr/time-tracking",
  category: "hr",
  mountStrategy: "subapp",
  actions: timeTrackingActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
