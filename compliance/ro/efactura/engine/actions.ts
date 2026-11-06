import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';
import { FILES, INVOICES, MESSAGES, SETTINGS } from './anaf.js';
import { type InvoiceData, generateUBLXML } from './ubl-generator.js';

// The engine runs every action as the caller, through the data API, in the
// request's transaction. What goes to ANAF is a job (`jobs.ts`): an action
// only moves the invoice to the state the job starts from and enqueues it.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, any>;

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const day = (v: unknown) => String(v ?? '').slice(0, 10);
const opt = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : String(v));

async function invoice(host: Host, id: string): Promise<Row> {
  const inv = await host.collections.read(INVOICES, id);
  if (!inv) throw new ActionRefusal(404, 'invoice_not_found', 'No such e-Factura invoice.');
  return inv;
}

async function fileOf(host: Host, invoiceId: string): Promise<Row | null> {
  const { records } = await host.collections.list(FILES, { filter: { invoice_id: invoiceId }, limit: 1, count: 'none' });
  return (records as Row[])[0] ?? null;
}

function lines(inv: Row): InvoiceData['lines'] {
  const raw = inv.lines;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ActionRefusal(422, 'no_lines', 'An invoice needs at least one line.');
  }
  return raw.map((l: Row, i: number) => {
    if (!l || typeof l !== 'object' || !String(l.description ?? '').trim()) {
      throw new ActionRefusal(422, 'line_invalid', `Line ${i + 1} has no description.`);
    }
    return {
      description: String(l.description),
      quantity: num(l.quantity),
      unit: String(l.unit || 'H87'),
      unit_price: num(l.unit_price),
      vat_rate: num(l.vat_rate),
      vat_amount: num(l.vat_amount),
      line_total: num(l.line_total),
    };
  });
}

function toInvoiceData(inv: Row): InvoiceData {
  return {
    invoice_number: String(inv.invoice_number),
    invoice_date: day(inv.invoice_date),
    due_date: inv.due_date ? day(inv.due_date) : undefined,
    currency: String(inv.currency || 'RON'),
    seller_name: String(inv.seller_name),
    seller_cui: String(inv.seller_cui),
    seller_reg_com: opt(inv.seller_reg_com),
    seller_address: opt(inv.seller_address),
    seller_city: opt(inv.seller_city),
    seller_county: opt(inv.seller_county),
    seller_country: opt(inv.seller_country),
    seller_iban: opt(inv.seller_iban),
    seller_bank: opt(inv.seller_bank),
    buyer_name: String(inv.buyer_name),
    buyer_cui: opt(inv.buyer_cui),
    buyer_address: opt(inv.buyer_address),
    buyer_city: opt(inv.buyer_city),
    buyer_county: opt(inv.buyer_county),
    buyer_country: opt(inv.buyer_country),
    lines: lines(inv),
    subtotal: num(inv.subtotal),
    vat_total: num(inv.vat_total),
    total: num(inv.total),
  };
}

// `rejected` is ANAF's nok: the invoice did not reach the buyer, so it is corrected and sent again.
const EDITABLE = ['draft', 'xml_generated', 'rejected'];

/** The UBL 2.1 XML (CIUS-RO) of the invoice as it stands, into its file row. */
const generateXml: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const inv = await invoice(host, id);
  if (!EDITABLE.includes(inv.status)) {
    throw new ActionRefusal(409, 'already_submitted', 'This invoice went to ANAF; its XML is the one filed.');
  }
  const xml = generateUBLXML(toInvoiceData(inv));
  const file = await fileOf(host, id);
  // A new XML makes the PDF rendered from the old one wrong.
  if (file) await host.collections.update(FILES, file.id, { xml, pdf: null });
  else await host.collections.insert(FILES, { invoice_id: id, xml });
  return host.collections.update(INVOICES, id, { status: 'xml_generated' }, { expect: { status: EDITABLE } });
};

/**
 * Claim the invoice for one upload (`xml_generated` to `submitting`, checked on
 * the locked row, so a second click waits and is refused) and queue it.
 */
const submit: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const inv = await invoice(host, id);
  if (inv.status !== 'xml_generated') {
    throw new ActionRefusal(409, 'not_ready', 'Generate the XML first; an invoice is sent once.');
  }
  // The XML is what goes to ANAF: an invoice edited since it was generated would
  // file a document that disagrees with its record.
  const file = await fileOf(host, id);
  if (!file?.xml || file.xml !== generateUBLXML(toInvoiceData(inv))) {
    throw new ActionRefusal(409, 'changed_since_xml', 'The invoice changed since its XML was generated; generate it again.');
  }
  const claimed = await host.collections.update(
    INVOICES,
    id,
    { status: 'submitting', anaf_response: null },
    { expect: { status: ['xml_generated'] } },
  );
  await host.enqueue('submit', { id });
  return claimed;
};

const checkStatus: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const inv = await invoice(host, id);
  if (!inv.anaf_index) throw new ActionRefusal(409, 'not_submitted', 'This invoice has no ANAF upload index.');
  return { job: await host.enqueue('checkStatus', { id }) };
};

const renderPdf: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  await invoice(host, id);
  if (!(await fileOf(host, id))?.xml) throw new ActionRefusal(409, 'no_xml', 'Generate the XML first.');
  return { job: await host.enqueue('renderPdf', { id }) };
};

/**
 * The storno of a filed invoice: a new draft with every quantity and amount
 * negated, naming the original. One per original (`storno_of` is unique): a
 * wrong storno is corrected by a further document, not a second storno.
 */
const storno: ExtensionAction = async (input, host) => {
  const { id, reason } = input as { id: string; reason: string };
  const o = await invoice(host, id);
  if (!['submitted', 'accepted'].includes(o.status)) {
    throw new ActionRefusal(409, 'not_filed', 'Only a submitted or accepted invoice is reversed by storno.');
  }
  const { records } = await host.collections.list(INVOICES, { filter: { storno_of: id }, limit: 1, count: 'none' });
  if ((records as Row[]).length) throw new ActionRefusal(409, 'storno_exists', 'This invoice already has a storno.');
  const keep = [
    'currency',
    'seller_name',
    'seller_cui',
    'seller_reg_com',
    'seller_address',
    'seller_city',
    'seller_county',
    'seller_country',
    'seller_iban',
    'seller_bank',
    'buyer_name',
    'buyer_cui',
    'buyer_address',
    'buyer_city',
    'buyer_county',
    'buyer_country',
  ];
  return host.collections.insert(INVOICES, {
    ...Object.fromEntries(keep.map((k) => [k, o[k]])),
    invoice_number: `STORNO-${o.invoice_number}`,
    invoice_date: new Date().toLocaleDateString('sv-SE', { timeZone: host.timezone }),
    lines: lines(o).map((l) => ({
      ...l,
      quantity: -l.quantity,
      vat_amount: -l.vat_amount,
      line_total: -l.line_total,
    })),
    subtotal: -num(o.subtotal),
    vat_total: -num(o.vat_total),
    total: -num(o.total),
    storno_of: id,
    storno_reason: reason,
  });
};

/**
 * A draft from an issued `finance/invoicing` invoice (an optional dependency),
 * with the seller details the invoice was issued under. Once per invoice: a
 * second call answers the draft the first one made.
 */
const fromInvoice: ExtensionAction = async (input, host) => {
  const { invoice_id } = input as { invoice_id: string };
  const done = await host.collections.list(INVOICES, {
    filter: { source_invoice_id: invoice_id },
    limit: 1,
    count: 'none',
  });
  if ((done.records as Row[])[0]) return (done.records as Row[])[0];
  let src: Row | null;
  try {
    src = await host.collections.read('invoices', invoice_id);
  } catch (err) {
    if ((err as { status?: number }).status === 404) {
      throw new ActionRefusal(404, 'invoicing_not_installed', 'finance/invoicing is not installed.');
    }
    throw err;
  }
  if (!src) throw new ActionRefusal(404, 'invoice_not_found', 'No such invoice.');
  if (!src.number) throw new ActionRefusal(409, 'invoice_not_issued', 'A draft invoice has no number yet; send it first.');
  if (src.status === 'cancelled') throw new ActionRefusal(409, 'invoice_cancelled', 'This invoice is cancelled.');
  if (src.doc_type && src.doc_type !== 'invoice') {
    throw new ActionRefusal(409, 'not_a_tax_invoice', 'Only an invoice is filed with ANAF, not a proforma or a delivery note.');
  }
  // What the UBL generator cannot express yet is refused rather than filed wrong:
  // a VAT regime other than standard (AE/E/K/Z categories), a discount, a foreign
  // currency (TaxCurrencyCode and the RON VAT amount).
  if ((src.vat_regime ?? 'standard') !== 'standard' || num(src.discount_percent) || num(src.discount_amount)) {
    throw new ActionRefusal(422, 'not_mapped', 'Invoices with a special VAT regime or a discount are not drafted automatically yet; enter this one by hand.');
  }
  if ((src.currency || 'RON') !== 'RON') {
    throw new ActionRefusal(422, 'not_mapped', 'Only RON invoices are drafted automatically yet.');
  }
  const ls: Row[] = [];
  for (let page = 1; ; page++) {
    const res = await host.collections.list('invoice_lines', {
      filter: { invoice_id },
      sort: 'sort_order',
      limit: 500,
      page,
      count: 'none',
    });
    ls.push(...(res.records as Row[]));
    if ((res.records as Row[]).length < 500) break;
  }
  return host.collections.insert(INVOICES, {
    source_invoice_id: invoice_id,
    invoice_number: String(src.number),
    invoice_date: day(src.issue_date),
    due_date: src.due_date ? day(src.due_date) : null,
    currency: src.currency || 'RON',
    seller_name: src.seller_name,
    seller_cui: src.seller_tax_id,
    seller_reg_com: src.seller_reg_no ?? null,
    seller_address: src.seller_address ?? null,
    seller_city: src.seller_city ?? null,
    seller_county: src.seller_county ?? null,
    seller_country: src.seller_country || 'RO',
    seller_iban: src.seller_iban ?? null,
    seller_bank: src.seller_bank ?? null,
    buyer_name: src.client_name,
    buyer_cui: src.client_tax_id ?? null,
    buyer_address: src.client_address ?? null,
    buyer_city: src.client_city ?? null,
    buyer_county: src.client_county ?? null,
    buyer_country: src.client_country || 'RO',
    lines: ls.map((l) => {
      const net = num(l.unit_price) * num(l.quantity);
      return {
        description: l.description,
        quantity: num(l.quantity),
        unit: l.unit || 'H87',
        unit_price: num(l.unit_price),
        vat_rate: num(l.tax_rate),
        vat_amount: Math.round((num(l.total) - net) * 100) / 100,
        line_total: num(l.total),
      };
    }),
    subtotal: num(src.subtotal),
    vat_total: num(src.tax_amount),
    total: num(src.total),
  });
};

/** Check the stored token (refreshing it) against ANAF's hello service. */
const verify: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  if (!(await host.collections.read(SETTINGS, id))) throw new ActionRefusal(404, 'settings_not_found', 'No such settings row.');
  return { job: await host.enqueue('connect', { settings_id: id }) };
};

const syncMessages: ExtensionAction = async (input, host) => {
  const { days = 30, filter } = input as { days?: number; filter?: string };
  return { job: await host.enqueue('syncMessages', filter ? { days, filter } : { days }) };
};

const downloadMessage: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  if (!(await host.collections.read(MESSAGES, id))) throw new ActionRefusal(404, 'message_not_found', 'No such message.');
  return { job: await host.enqueue('downloadMessage', { id }) };
};

export const efacturaActions = {
  generateXml,
  submit,
  checkStatus,
  renderPdf,
  storno,
  fromInvoice,
  verify,
  syncMessages,
  downloadMessage,
};
