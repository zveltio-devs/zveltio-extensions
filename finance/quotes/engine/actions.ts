import { ActionRefusal, type ExtensionAction, todayIn } from '@zveltio/sdk/extension';
// ponytail: invoicing's own code, inlined into this bundle when it is packed —
// one place decides how a number is claimed and an invoice is totalled. A
// change to invoicing's actions needs a repack of quotes too; check-bundle-sources
// hashes only this extension's engine/, so it will not say so.
import { claimNumber, invoicingActions } from '../../invoicing/engine/actions.js';

// What quotes does beyond plain edits, as actions (`POST /ext/finance/quotes/actions/<name>`).
// The engine runs each as the caller, inside the request transaction, through
// the data API: a refusal rolls back everything the action wrote, the claimed
// number included. Sending, accepting, rejecting and the internal approval are
// plain edits of `status` and `approval_status`; the status rule on `quotes`
// keeps the order. Who may do what is the engine's rules, not this file's.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const Q = 'quotes';
const QL = 'quote_lines';
const round2 = (x: number) => Math.round(x * 100) / 100;

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type LineIn = {
  description: string;
  quantity?: number;
  unit_price?: number;
  tax_rate?: number;
  discount?: number;
  sort_order?: number;
};

type QuoteIn = Row & {
  title: string;
  client_name: string;
  valid_until?: string;
  valid_days?: number;
  discount_percent?: number;
  series?: string;
  lines: LineIn[];
};

const HEADER = ['contact_id', 'organization_id', 'client_email', 'currency', 'tax_rate', 'notes', 'terms', 'footer_notes', 'po_number'];

/** A quote and its lines, its totals computed from them and its number claimed from a `quote` series. */
const createQuote: ExtensionAction = async (input, host) => {
  const d = input as QuoteIn;
  const disc = d.discount_percent ?? 0;
  const lines = d.lines.map((l, i) => {
    const quantity = l.quantity ?? 1;
    const unit_price = l.unit_price ?? 0;
    const tax_rate = l.tax_rate ?? 19;
    const discount = l.discount ?? 0;
    const net = quantity * unit_price * (1 - discount / 100);
    const base = net * (1 - disc / 100);
    const vat = round2((base * tax_rate) / 100);
    return { description: l.description, quantity, unit_price, tax_rate, discount, net, base, vat, sort_order: l.sort_order ?? i };
  });
  const gross = lines.reduce((s, x) => s + x.net, 0);
  const subtotal = lines.reduce((s, x) => s + x.base, 0);
  const tax = lines.reduce((s, x) => s + x.vat, 0);
  const issue = todayIn(host.timezone);

  const claimed = await claimNumber(host, 'quote', d.series);
  const quote = await host.collections.insert(Q, {
    ...Object.fromEntries(HEADER.filter((k) => d[k] !== undefined && d[k] !== '').map((k) => [k, d[k]])),
    number: claimed.number,
    title: d.title,
    client_name: d.client_name,
    issue_date: issue,
    valid_until: d.valid_until || addDays(issue, d.valid_days ?? 30),
    discount_percent: disc,
    discount_amount: round2(gross - subtotal),
    subtotal: round2(subtotal),
    tax_amount: round2(tax),
    total: round2(subtotal + tax),
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
      sort_order: x.sort_order,
    });
  }
  return quote;
};

/**
 * An accepted quote becomes an invoice, through invoicing's own `createInvoice`:
 * a number from the invoice series, the seller copied, the VAT rules checked.
 * The quote records the invoice only if nobody did since it was read
 * (`expect`), so a second conversion running alongside fails and rolls back
 * its invoice and its number: a customer is never billed twice for one quote.
 */
const convertToInvoice: ExtensionAction = async (input, host) => {
  const d = input as { id: string; series?: string; exchange_rate?: number; due_days?: number; client_tax_id?: string };
  const q = await host.collections.read(Q, d.id);
  if (!q) throw new ActionRefusal(404, 'quote_not_found', 'No such quote.');
  if (q.status !== 'accepted') throw new ActionRefusal(409, 'quote_not_accepted', 'Only an accepted quote becomes an invoice.');
  if (q.converted_to_invoice_id) throw new ActionRefusal(409, 'quote_converted', 'This quote is already invoiced.');

  const lines: Row[] = [];
  for (let page = 1; ; page++) {
    const res = await host.collections.list(QL, { filter: { quote_id: d.id }, sort: 'sort_order', limit: 500, page, count: 'none' });
    const rows = (res.records as Row[]) ?? [];
    lines.push(...rows);
    if (rows.length < 500) break;
  }
  const inv = (await invoicingActions.createInvoice(
    {
      client_id: q.organization_id ?? q.contact_id ?? undefined,
      client_type: q.organization_id ? 'organization' : q.contact_id ? 'contact' : undefined,
      client_name: q.client_name,
      client_email: q.client_email ?? undefined,
      // A quote does not carry it; an invoice to an organization must (Cod fiscal art. 319).
      client_tax_id: d.client_tax_id,
      currency: q.currency,
      exchange_rate: d.exchange_rate,
      series: d.series,
      due_days: d.due_days,
      discount_percent: Number(q.discount_percent ?? 0),
      notes: q.notes ?? undefined,
      footer_notes: q.footer_notes ?? undefined,
      po_number: q.po_number ?? undefined,
      // An invoice line has no discount of its own: it is folded into the unit price.
      lines: lines.map((l) => ({
        description: String(l.description),
        quantity: Number(l.quantity),
        unit_price: round2(Number(l.unit_price) * (1 - Number(l.discount ?? 0) / 100)),
        tax_rate: Number(l.tax_rate),
        sort_order: Number(l.sort_order),
        metadata: { quote_id: d.id },
      })),
    },
    host,
  )) as Row;
  await host.collections.update(Q, d.id, { converted_to_invoice_id: inv.id }, { expect: { status: ['accepted'], converted_to_invoice_id: [null] } });
  return inv;
};

export const quotesActions: Record<string, ExtensionAction> = { createQuote, convertToInvoice };
