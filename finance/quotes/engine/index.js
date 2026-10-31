// @bun
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
// engine/actions.ts
var INVOICING = "finance/invoicing";
function invoicing(host, action, input) {
  if (!host.actions)
    throw new ActionRefusal(409, "engine_too_old", "This engine cannot run another extension's action.");
  return host.actions.run(INVOICING, action, input);
}
var Q = "quotes";
var QL = "quote_lines";
var round2 = (x) => Math.round(x * 100) / 100;
function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
var HEADER = [
  "contact_id",
  "organization_id",
  "client_email",
  "currency",
  "tax_rate",
  "notes",
  "terms",
  "footer_notes",
  "po_number"
];
var createQuote = async (input, host) => {
  const d = input;
  const disc = d.discount_percent ?? 0;
  const lines = d.lines.map((l, i) => {
    const quantity = l.quantity ?? 1;
    const unit_price = l.unit_price ?? 0;
    const tax_rate = l.tax_rate ?? d.tax_rate ?? 19;
    const discount = l.discount ?? 0;
    const net = quantity * unit_price * (1 - discount / 100);
    const base = net * (1 - disc / 100);
    const vat = round2(base * tax_rate / 100);
    return {
      description: l.description,
      quantity,
      unit_price,
      tax_rate,
      discount,
      net,
      base,
      vat,
      sort_order: l.sort_order ?? i
    };
  });
  const gross = lines.reduce((s, x) => s + x.net, 0);
  const subtotal = lines.reduce((s, x) => s + x.base, 0);
  const tax = lines.reduce((s, x) => s + x.vat, 0);
  const issue = todayIn(host.timezone);
  const claimed = await invoicing(host, "claimQuoteNumber", {
    ...d.series && { series: d.series }
  });
  const quote = await host.collections.insert(Q, {
    ...Object.fromEntries(HEADER.filter((k) => d[k] !== undefined && d[k] !== "").map((k) => [
      k,
      d[k]
    ])),
    number: claimed.number,
    title: d.title,
    client_name: d.client_name,
    issue_date: issue,
    valid_until: d.valid_until || addDays(issue, d.valid_days ?? 30),
    discount_percent: disc,
    discount_amount: round2(gross - subtotal),
    subtotal: round2(subtotal),
    tax_amount: round2(tax),
    total: round2(subtotal + tax)
  });
  for (const x of lines) {
    await host.collections.insert(QL, {
      quote_id: quote.id,
      description: x.description,
      quantity: x.quantity,
      unit_price: x.unit_price,
      tax_rate: x.tax_rate,
      discount: x.discount,
      total: round2(x.base + x.vat),
      sort_order: x.sort_order
    });
  }
  return quote;
};
var convertToInvoice = async (input, host) => {
  const d = input;
  const q = await host.collections.read(Q, d.id);
  if (!q)
    throw new ActionRefusal(404, "quote_not_found", "No such quote.");
  if (q.status !== "accepted")
    throw new ActionRefusal(409, "quote_not_accepted", "Only an accepted quote becomes an invoice.");
  if (q.converted_to_invoice_id)
    throw new ActionRefusal(409, "quote_converted", "This quote is already invoiced.");
  const lines = [];
  for (let page = 1;; page++) {
    const res = await host.collections.list(QL, {
      filter: { quote_id: d.id },
      sort: "sort_order",
      limit: 500,
      page,
      count: "none"
    });
    const rows = res.records ?? [];
    lines.push(...rows);
    if (rows.length < 500)
      break;
  }
  const inv = await invoicing(host, "createInvoice", {
    client_id: q.organization_id ?? q.contact_id ?? undefined,
    client_type: q.organization_id ? "organization" : q.contact_id ? "contact" : undefined,
    client_name: q.client_name,
    client_email: q.client_email ?? undefined,
    client_tax_id: d.client_tax_id,
    currency: q.currency,
    exchange_rate: d.exchange_rate,
    series: d.series,
    due_days: d.due_days,
    discount_percent: Number(q.discount_percent ?? 0),
    notes: q.notes ?? undefined,
    footer_notes: q.footer_notes ?? undefined,
    po_number: q.po_number ?? undefined,
    lines: lines.map((l) => ({
      description: String(l.description),
      quantity: Number(l.quantity),
      unit_price: Math.round(Number(l.unit_price) * (1 - Number(l.discount ?? 0) / 100) * 1e6) / 1e6,
      tax_rate: Number(l.tax_rate),
      sort_order: Number(l.sort_order),
      metadata: { quote_id: d.id }
    }))
  });
  await host.collections.update(Q, d.id, { converted_to_invoice_id: inv.id }, { expect: { status: ["accepted"], converted_to_invoice_id: [null] } });
  return inv;
};
var quotesActions = {
  createQuote,
  convertToInvoice
};

// engine/index.ts
var extension = {
  name: "finance/quotes",
  category: "finance",
  mountStrategy: "subapp",
  actions: quotesActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
