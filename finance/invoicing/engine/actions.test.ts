// The invoicing actions over an in-memory data API: the filter operators they
// use (eq, in), `expect` on update, and paging. The engine's own data API and
// its checks are tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { invoicingActions as a, isValidCui } from './actions';

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  invoices: { status: 'draft', amount_paid: 0 },
  credit_notes: { status: 'draft' },
};

function fakeHost() {
  const tables: Record<string, Row[]> = {};
  let seq = 0;
  let busy = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const match = (r: Row, filter: Row) =>
    Object.entries(filter).every(([k, cond]) => {
      if (cond === null || typeof cond !== 'object') return r[k] === cond;
      const [op, v] = Object.entries(cond)[0] as [string, unknown];
      if (op === 'in') return (v as unknown[]).includes(r[k]);
      throw new Error(`op ${op}`);
    });
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => {
        const r = rows(c).find((x) => x.id === id);
        return r ? { ...r } : null;
      },
      list: async (c: string, q: { filter?: Row; sort?: string; limit?: number; page?: number } = {}) => {
        let out = rows(c).filter((r) => match(r, q.filter ?? {}));
        if (q.sort) out = [...out].sort((x, y) => String(x[q.sort!]).localeCompare(String(y[q.sort!]), 'en', { numeric: true }));
        const lim = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * lim;
        return { records: out.slice(from, from + lim).map((r) => ({ ...r })) };
      },
      insert: async (c: string, data: Row) => {
        const row = { id: `00000000-0000-0000-0000-${String(++seq).padStart(12, '0')}`, created_at: String(seq).padStart(6, '0'), ...DEFAULTS[c], ...data };
        rows(c).push(row);
        return { ...row };
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = rows(c).find((r) => r.id === id);
        if (!row) throw new ActionRefusal(404, 'not_found', '');
        // A concurrent claim that lands between this read and this write.
        if (c === 'document_series' && busy > 0) {
          busy--;
          row.next_number = Number(row.next_number) + 1;
        }
        for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
          if (!vs.map(String).includes(String(row[k]))) throw new ActionRefusal(409, 'precondition_failed', k);
        }
        return { ...Object.assign(row, data) };
      },
      delete: async () => {},
    },
  };
  return { host, rows, contend: (n: number) => (busy = n) };
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
  await f.host.collections.insert('document_series', { doc_type: 'invoice', series: 'INV', next_number: 7, padding: 4, is_default: true });
  await f.host.collections.insert('document_series', { doc_type: 'invoice', series: 'OLD', next_number: 1, padding: 2, is_default: false });
  await f.host.collections.insert('document_series', { doc_type: 'credit_note', series: 'CN', next_number: 1, padding: 3, is_default: true });
  await f.host.collections.insert('company_profile', { name: 'Acme', legal_name: 'Acme SRL', tax_id: '14399840', country: 'RO', iban: 'RO49AAAA1B31007593840000' });
  return f;
}

const BASE = {
  client_name: 'Client SRL',
  due_date: '2026-11-30',
  issue_date: '2026-10-30',
  lines: [
    { description: 'Consulting', quantity: 2, unit_price: 100, tax_rate: 19 },
    { description: 'Produce', quantity: 1, unit_price: 50, tax_rate: 9 },
  ],
};

describe('createInvoice', () => {
  it('numbers from the default series, snapshots the seller and totals the lines per rate', async () => {
    const { host, rows } = await setup();
    const inv = (await a.createInvoice({ ...BASE, discount_percent: 10 }, host as never)) as Row;
    expect(inv.number).toBe('INV-0007');
    expect(inv.seller_name).toBe('Acme SRL');
    expect(inv.subtotal).toBe(225);
    expect(inv.discount_amount).toBe(25);
    expect(inv.tax_amount).toBe(38.25); // 180 × 19% + 45 × 9%
    expect(inv.total).toBe(263.25);
    expect(inv.vat_breakdown).toEqual([
      { rate: 19, base: 180, vat: 34.2 },
      { rate: 9, base: 45, vat: 4.05 },
    ]);
    expect(rows('invoice_lines').map((l) => l.total)).toEqual([214.2, 49.05]);
    expect(rows('document_series')[0].next_number).toBe(8);
  });

  it('numbers from a named series, and blank form fields are not values', async () => {
    const { host } = await setup();
    const inv = (await a.createInvoice({ ...BASE, series: 'OLD', client_email: '', due_date: '', due_days: 14 }, host as never)) as Row;
    expect(inv.number).toBe('OLD-01');
    expect(inv.client_email).toBeNull();
    expect(inv.due_date).toBe('2026-11-13');
  });

  it('reads the series again when a concurrent claim moved it', async () => {
    const { host, contend } = await setup();
    contend(1);
    expect(((await a.createInvoice(BASE, host as never)) as Row).number).toBe('INV-0008');
  });

  it('charges no VAT under reverse charge, and keeps the line rates', async () => {
    const { host } = await setup();
    const inv = (await a.createInvoice({ ...BASE, vat_regime: 'reverse_charge' }, host as never)) as Row;
    expect(inv.tax_amount).toBe(0);
    expect(inv.total).toBe(250);
  });

  it('refuses what an invoice may not be, before claiming a number', async () => {
    const { host, rows } = await setup();
    await refusal(a.createInvoice({ ...BASE, client_type: 'organization' }, host as never), 'client_tax_id_required');
    await refusal(a.createInvoice({ ...BASE, client_tax_id: 'RO14399841' }, host as never), 'client_tax_id_invalid');
    await refusal(a.createInvoice({ ...BASE, vat_regime: 'exempt' }, host as never), 'exemption_reason_required');
    await refusal(a.createInvoice({ ...BASE, currency: 'EUR' }, host as never), 'exchange_rate_required');
    await refusal(a.createInvoice({ ...BASE, doc_type: 'delivery_note' }, host as never), 'delegate_required');
    await refusal(a.createInvoice({ ...BASE, doc_type: 'proforma' }, host as never), 'no_series');
    expect(rows('document_series')[0].next_number).toBe(7);
    // A foreign buyer's code is not held to the Romanian check digit.
    await a.createInvoice({ ...BASE, client_tax_id: 'DE123456789', client_country: 'DE' }, host as never);
  });
});

describe('payments and credit notes', () => {
  async function sent() {
    const f = await setup();
    const inv = (await a.createInvoice({ ...BASE, lines: [{ description: 'x', quantity: 1, unit_price: 100, tax_rate: 19 }] }, f.host as never)) as Row;
    await f.host.collections.update('invoices', String(inv.id), { status: 'sent' });
    return { ...f, id: String(inv.id) };
  }

  it('a payment adds to the balance; without an amount it settles the rest', async () => {
    const { host, rows, id } = await sent();
    await refusal(a.recordPayment({ id, amount: 200 }, host as never), 'exceeds_outstanding');
    const first = (await a.recordPayment({ id, amount: 19 }, host as never)) as { invoice: Row };
    expect(first.invoice.status).toBe('partially_paid');
    const rest = (await a.recordPayment({ id }, host as never)) as { invoice: Row; payment: Row };
    expect(rest.payment.amount).toBe(100);
    expect(rest.invoice.status).toBe('paid');
    expect(rest.invoice.paid_at).toBeString();
    expect(rows('invoice_payments')).toHaveLength(2);
    await refusal(a.recordPayment({ id }, host as never), 'invoice_not_payable');
  });

  it('a draft takes no payment', async () => {
    const { host } = await setup();
    const inv = (await a.createInvoice(BASE, host as never)) as Row;
    await refusal(a.recordPayment({ id: inv.id }, host as never), 'invoice_not_payable');
  });

  it('a credit note credits at most what is outstanding, once', async () => {
    const { host, id } = await sent();
    const cn = (await a.createCreditNote(
      { client_name: 'Client SRL', reason: 'Return', original_invoice_id: id, lines: [{ description: 'x', quantity: 2, unit_price: 100 }] },
      host as never,
    )) as Row;
    expect(cn.number).toBe('CN-001');
    expect(cn.total).toBe(238);
    await refusal(a.applyCreditNote({ id: cn.id, invoice_id: id }, host as never), 'credit_note_not_issued');
    await host.collections.update('credit_notes', String(cn.id), { status: 'issued' });
    expect(await a.applyCreditNote({ id: cn.id, invoice_id: id }, host as never)).toEqual({ applied_amount: 119, invoice_status: 'paid' });
    await refusal(a.applyCreditNote({ id: cn.id, invoice_id: id }, host as never), 'credit_note_not_issued');
  });
});

describe('documents from documents', () => {
  it('a proforma converts once, into a numbered draft invoice with its lines', async () => {
    const { host, rows } = await setup();
    await host.collections.insert('document_series', { doc_type: 'proforma', series: 'PF', next_number: 1, padding: 3, is_default: true });
    const pf = (await a.createInvoice({ ...BASE, doc_type: 'proforma' }, host as never)) as Row;
    expect(pf.number).toBe('PF-001');
    const inv = (await a.convertProforma({ id: pf.id }, host as never)) as Row;
    expect(inv).toMatchObject({ number: 'INV-0007', doc_type: 'invoice', converted_from_id: pf.id, total: pf.total });
    expect(rows('invoice_lines').filter((l) => l.invoice_id === inv.id)).toHaveLength(2);
    await refusal(a.convertProforma({ id: pf.id }, host as never), 'already_converted');
    await refusal(a.convertProforma({ id: inv.id }, host as never), 'not_a_proforma');
  });

  it('a recurring invoice generates the next period in its own series', async () => {
    const { host } = await setup();
    const inv = (await a.createInvoice({ ...BASE, series: 'OLD', recurring_interval: 'quarterly' }, host as never)) as Row;
    await refusal(a.generateNext({ id: inv.id }, host as never), 'invoice_not_issued');
    await host.collections.update('invoices', String(inv.id), { status: 'sent' });
    const next = (await a.generateNext({ id: inv.id }, host as never)) as Row;
    expect(next).toMatchObject({ number: 'OLD-02', issue_date: '2026-12-01', due_date: '2027-03-01', status: 'draft' });
    const jan = (await a.createInvoice({ ...BASE, issue_date: '2027-01-01', due_date: '2027-01-30', recurring_interval: 'monthly' }, host as never)) as Row;
    await host.collections.update('invoices', String(jan.id), { status: 'sent' });
    expect(await a.generateNext({ id: jan.id }, host as never)).toMatchObject({ issue_date: '2027-01-31', due_date: '2027-02-28' });
    const once = (await a.createInvoice(BASE, host as never)) as Row;
    await refusal(a.generateNext({ id: once.id }, host as never), 'not_recurring');
  });

  it('marks sent invoices past due overdue', async () => {
    const { host, rows } = await setup();
    const late = (await a.createInvoice({ ...BASE, due_date: '2020-01-01' }, host as never)) as Row;
    const notYet = (await a.createInvoice({ ...BASE, due_date: '2999-01-01' }, host as never)) as Row;
    for (const r of [late, notYet]) await host.collections.update('invoices', String(r.id), { status: 'sent' });
    expect(await a.markOverdue({}, host as never)).toEqual({ marked: 1 });
    expect(rows('invoices').map((r) => r.status)).toEqual(['overdue', 'sent']);
  });

  it('the printed invoice escapes what was typed', async () => {
    const { host } = await setup();
    const inv = (await a.createInvoice({ ...BASE, client_name: '<script>x</script>' }, host as never)) as Row;
    const { html } = (await a.renderInvoice({ id: inv.id }, host as never)) as { html: string };
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Acme SRL');
  });
});

describe('saveCompany', () => {
  it('edits the one profile, or creates it', async () => {
    const { host, rows } = fakeHost();
    await a.saveCompany({ name: 'A', tax_id: '' }, host as never);
    await a.saveCompany({ id: 'ignored', name: 'B', city: 'Cluj' }, host as never);
    expect(rows('company_profile')).toHaveLength(1);
    expect(rows('company_profile')[0]).toMatchObject({ name: 'B', city: 'Cluj', tax_id: null });
  });
});

it('isValidCui', () => {
  expect(isValidCui('14399840')).toBe(true);
  expect(isValidCui('RO 18547290')).toBe(true);
  expect(isValidCui('14399841')).toBe(false);
  expect(isValidCui('1')).toBe(false);
});
