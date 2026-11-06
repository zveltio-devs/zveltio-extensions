// The actions over an in-memory data API that answers like the engine's: an
// update with `expect` is refused 409 when the row moved, decimals come back as
// strings. What the data API checks is tested in the engine; this proves what
// each action asks of it, what it writes and what it queues.
import { describe, expect, it } from 'bun:test';
import { efacturaActions as A } from './actions';

type Row = Record<string, any>;

function fakeHost(tables: Record<string, Row[]>) {
  let seq = 0;
  const queued: { job: string; input: unknown }[] = [];
  const rows = (c: string) => (tables[c] ??= []);
  const host = {
    timezone: 'Europe/Bucharest',
    enqueue: async (job: string, input: unknown) => {
      queued.push({ job, input });
      return `job-${queued.length}`;
    },
    collections: {
      read: async (c: string, id: string) => {
        if (!(c in tables)) throw Object.assign(new Error('no such collection'), { status: 404 });
        return rows(c).find((x) => x.id === id) ?? null;
      },
      list: async (c: string, q: { filter?: Row; limit?: number; page?: number } = {}) => {
        const all = rows(c).filter((r) => Object.entries(q.filter ?? {}).every(([k, v]) => r[k] === v));
        const limit = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * limit;
        return { records: all.slice(from, from + limit) };
      },
      insert: async (c: string, data: Row) => {
        const row = { id: `id-${++seq}`, ...data };
        rows(c).push(row);
        return row;
      },
      update: async (c: string, id: string, data: Row, o: { expect?: Record<string, unknown[]> } = {}) => {
        const row = rows(c).find((r) => r.id === id)!;
        for (const [f, vs] of Object.entries(o.expect ?? {})) {
          if (!vs.map(String).includes(String(row[f]))) {
            throw Object.assign(new Error('precondition failed'), { status: 409 });
          }
        }
        return Object.assign(row, data);
      },
      delete: async () => {},
    },
  };
  return { host: host as never, queued };
}

const draft = (extra: Row = {}): Row => ({
  id: 'i1',
  status: 'draft',
  invoice_number: 'F-7',
  invoice_date: '2026-11-06',
  currency: 'RON',
  seller_name: 'Seller SRL',
  seller_cui: '18547290',
  buyer_name: 'Buyer & Co',
  lines: [{ description: 'Work', quantity: 2, unit: 'H87', unit_price: 50, vat_rate: 19, vat_amount: 19, line_total: 119 }],
  subtotal: '100.00',
  vat_total: '19.00',
  total: '119.00',
  ...extra,
});

describe('generateXml', () => {
  it('writes the UBL into one file row and marks the invoice', async () => {
    const t: Record<string, Row[]> = { efactura_invoices: [draft()], efactura_files: [] };
    const { host } = fakeHost(t);
    await A.generateXml({ id: 'i1' }, host);
    await A.generateXml({ id: 'i1' }, host);
    expect(t.efactura_files).toHaveLength(1);
    expect(t.efactura_files[0].xml).toContain('<cbc:ID>F-7</cbc:ID>');
    expect(t.efactura_files[0].xml).toContain('Buyer &amp; Co');
    expect(t.efactura_invoices[0].status).toBe('xml_generated');
  });

  it('a regenerated XML drops the PDF rendered from the old one', async () => {
    const t: Record<string, Row[]> = {
      efactura_invoices: [draft({ status: 'xml_generated' })],
      efactura_files: [{ id: 'f1', invoice_id: 'i1', xml: '<old/>', pdf: 'JVBERi0=' }],
    };
    await A.generateXml({ id: 'i1' }, fakeHost(t).host);
    expect(t.efactura_files[0].pdf).toBeNull();
  });

  it('refuses a filed invoice and one without lines', async () => {
    const filed = { efactura_invoices: [draft({ status: 'submitted' })], efactura_files: [] };
    await expect(A.generateXml({ id: 'i1' }, fakeHost(filed).host)).rejects.toMatchObject({ code: 'already_submitted' });
    const empty = { efactura_invoices: [draft({ lines: [] })], efactura_files: [] };
    await expect(A.generateXml({ id: 'i1' }, fakeHost(empty).host)).rejects.toMatchObject({ code: 'no_lines' });
  });
});

describe('submit', () => {
  it('claims xml_generated as submitting and queues one upload', async () => {
    const t: Record<string, Row[]> = { efactura_invoices: [draft()], efactura_files: [] };
    const { host, queued } = fakeHost(t);
    await A.generateXml({ id: 'i1' }, host);
    await A.submit({ id: 'i1' }, host);
    expect(t.efactura_invoices[0].status).toBe('submitting');
    expect(queued).toEqual([{ job: 'submit', input: { id: 'i1' } }]);
    // The second click finds it submitting: refused, nothing queued.
    await expect(A.submit({ id: 'i1' }, host)).rejects.toMatchObject({ code: 'not_ready' });
    expect(queued).toHaveLength(1);
  });

  it('refuses an invoice edited since its XML was generated', async () => {
    const t: Record<string, Row[]> = { efactura_invoices: [draft()], efactura_files: [] };
    const { host, queued } = fakeHost(t);
    await A.generateXml({ id: 'i1' }, host);
    t.efactura_invoices[0].buyer_name = 'Someone else';
    await expect(A.submit({ id: 'i1' }, host)).rejects.toMatchObject({ code: 'changed_since_xml' });
    expect(queued).toHaveLength(0);
  });

  it('a rejected (nok) invoice is corrected and generated again', async () => {
    const t: Record<string, Row[]> = { efactura_invoices: [draft({ status: 'rejected' })], efactura_files: [] };
    await A.generateXml({ id: 'i1' }, fakeHost(t).host);
    expect(t.efactura_invoices[0].status).toBe('xml_generated');
  });

  it('refuses a draft without XML', async () => {
    const { host, queued } = fakeHost({ efactura_invoices: [draft()] });
    await expect(A.submit({ id: 'i1' }, host)).rejects.toMatchObject({ code: 'not_ready' });
    expect(queued).toHaveLength(0);
  });
});

describe('storno', () => {
  it('a negated draft naming the original, once', async () => {
    const t: Record<string, Row[]> = { efactura_invoices: [draft({ status: 'accepted' })] };
    const { host } = fakeHost(t);
    const s = (await A.storno({ id: 'i1', reason: 'wrong buyer' }, host)) as Row;
    expect(s).toMatchObject({
      invoice_number: 'STORNO-F-7',
      storno_of: 'i1',
      storno_reason: 'wrong buyer',
      total: -119,
      buyer_name: 'Buyer & Co',
    });
    expect(s.lines[0]).toMatchObject({ quantity: -2, vat_amount: -19, line_total: -119, unit_price: 50 });
    expect(s.invoice_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await expect(A.storno({ id: 'i1', reason: 'again' }, host)).rejects.toMatchObject({ code: 'storno_exists' });
  });

  it('refuses an invoice ANAF never had', async () => {
    const { host } = fakeHost({ efactura_invoices: [draft({ status: 'xml_generated' })] });
    await expect(A.storno({ id: 'i1', reason: 'x' }, host)).rejects.toMatchObject({ code: 'not_filed' });
  });
});

describe('fromInvoice', () => {
  const issued = {
    id: 'v1',
    number: 'FCT-0007',
    status: 'sent',
    issue_date: '2026-11-05',
    due_date: '2026-12-05',
    currency: 'RON',
    seller_name: 'Seller SRL',
    seller_tax_id: 'RO18547290',
    seller_city: 'Cluj-Napoca',
    seller_county: 'CJ',
    client_name: 'Client SA',
    client_tax_id: '14399840',
    subtotal: '100.00',
    tax_amount: '19.00',
    total: '119.00',
  };
  const lines = [
    { id: 'l1', invoice_id: 'v1', description: 'Work', quantity: '2', unit: 'H87', unit_price: '50', tax_rate: '19', total: '119' },
  ];

  it("drafts the issued invoice with the seller details it was issued under, once", async () => {
    const t: Record<string, Row[]> = { invoices: [issued], invoice_lines: lines, efactura_invoices: [] };
    const { host } = fakeHost(t);
    const d = (await A.fromInvoice({ invoice_id: 'v1' }, host)) as Row;
    expect(d).toMatchObject({
      source_invoice_id: 'v1',
      invoice_number: 'FCT-0007',
      seller_cui: 'RO18547290',
      seller_county: 'CJ',
      buyer_name: 'Client SA',
      buyer_cui: '14399840',
      total: 119,
    });
    expect(d.lines).toEqual([
      { description: 'Work', quantity: 2, unit: 'H87', unit_price: 50, vat_rate: 19, vat_amount: 19, line_total: 119 },
    ]);
    expect(await A.fromInvoice({ invoice_id: 'v1' }, host)).toBe(d);
    expect(t.efactura_invoices).toHaveLength(1);
  });

  it('refuses a draft invoice, and says when invoicing is not installed', async () => {
    for (const [extra, code] of [
      [{ doc_type: 'proforma' }, 'not_a_tax_invoice'],
      [{ vat_regime: 'reverse_charge' }, 'not_mapped'],
      [{ discount_percent: '10' }, 'not_mapped'],
      [{ currency: 'EUR' }, 'not_mapped'],
    ] as const) {
      const t = { invoices: [{ ...issued, ...extra }], invoice_lines: [], efactura_invoices: [] };
      await expect(A.fromInvoice({ invoice_id: 'v1' }, fakeHost(t).host)).rejects.toMatchObject({ code });
    }
    const drafted = { invoices: [{ ...issued, number: null }], invoice_lines: [], efactura_invoices: [] };
    await expect(A.fromInvoice({ invoice_id: 'v1' }, fakeHost(drafted).host)).rejects.toMatchObject({
      code: 'invoice_not_issued',
    });
    await expect(A.fromInvoice({ invoice_id: 'v1' }, fakeHost({ efactura_invoices: [] }).host)).rejects.toMatchObject({
      code: 'invoicing_not_installed',
    });
  });
});

describe('the ANAF actions queue their job', () => {
  it('checkStatus needs an upload index; syncMessages defaults to 30 days', async () => {
    const t = { efactura_invoices: [draft({ status: 'submitted', anaf_index: '77' }), draft({ id: 'i2' })] };
    const { host, queued } = fakeHost(t);
    await A.checkStatus({ id: 'i1' }, host);
    await expect(A.checkStatus({ id: 'i2' }, host)).rejects.toMatchObject({ code: 'not_submitted' });
    await A.syncMessages({}, host);
    expect(queued).toEqual([
      { job: 'checkStatus', input: { id: 'i1' } },
      { job: 'syncMessages', input: { days: 30 } },
    ]);
  });
});
