// The four write paths this extension gets wrong when two people use it at once,
// plus the two that were simply dead.
//
// Every test here is written against an outcome that the previous code produced
// differently, and each was checked by putting the old shape back and watching
// exactly the intended test go red — the campaign's rule, because a test that
// passes with the guard removed is not a test.
import { describe, expect, it, beforeAll } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;
const d = DB_URL ? describe : describe.skip;

/** Same shape the routes accept, with the fields the validators demand. */
function invoiceBody(over: Record<string, unknown> = {}) {
  return {
    client_name: 'Test Client',
    due_date: '2026-12-31',
    lines: [{ description: 'Widget', quantity: 1, unit_price: 100, tax_rate: 19 }],
    ...over,
  };
}

d('invoicing: write path', () => {
  let app: any;
  let ctx: any;

  beforeAll(async () => {
    ({ app, ctx } = await mountForTest(new URL('.', import.meta.url).pathname));
    // Open every pooled connection BEFORE any concurrency test runs.
    //
    // The harness pool is created lazily with `max: 4`. On a cold pool the first
    // request pays for opening a connection while the others wait for one, so it
    // has committed before any of them reads — the requests never overlap and a
    // concurrency test passes whatever the handler does. Measured: with the pool
    // cold, "keeps the ledger and the invoice in agreement" stayed GREEN with
    // the fix reverted, and goes red with the pool warm. Any concurrency test in
    // this repository written without this is inert.
    await Promise.all([0, 1, 2, 3].map(() => app.request('/invoices/stats')));
    // A series is a precondition for issuing anything; the routes refuse rather
    // than invent a number, so every test below needs one.
    for (const doc_type of ['invoice', 'proforma', 'credit_note']) {
      await app.request('/series', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ doc_type, series: `T${doc_type[0].toUpperCase()}`, is_default: true }),
      });
    }
  });

  // ── The proforma conversion, which answered 500 on every call ──────────────
  //
  // The INSERT named 44 columns and the SELECT supplied 39; PostgreSQL refuses
  // the whole statement with `INSERT has more target columns than expressions`.
  // The five missing ones were `client_city`, `client_county`, `seller_city`,
  // `seller_county` and `seller_country` — added by migrations 008 and 009,
  // never added to this statement.
  it('converts a proforma into an invoice, carrying the party addresses', async () => {
    const created = await app.request('/invoices', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invoiceBody({ doc_type: 'proforma', client_city: 'Cluj', client_county: 'CJ' })),
    });
    expect(created.status).toBe(201);
    const proforma = (await created.json()).data;

    const res = await app.request(`/invoices/${proforma.id}/convert`, { method: 'POST' });
    expect(res.status).toBe(201);
    const invoice = (await res.json()).data;
    expect(invoice.doc_type).toBe('invoice');
    expect(invoice.converted_from_id).toBe(proforma.id);
    // The columns whose absence made the statement unparseable.
    expect(invoice.client_city).toBe('Cluj');
    expect(invoice.client_county).toBe('CJ');
  });

  // ── Payments cannot exceed the invoice, however they arrive ────────────────
  //
  // The invariant, not the interleaving: whatever order concurrent payments
  // land in, the invoice's `amount_paid` must equal the payments recorded
  // against it and must never exceed the total. The old code read the balance,
  // checked it in JavaScript and wrote an ABSOLUTE value back, so two payments
  // that each passed a check against the same stale balance both landed and the
  // second overwrote the first: two rows of 100.00 against a 119.00 invoice,
  // `amount_paid` reading 100.00.
  it('keeps the ledger and the invoice in agreement under concurrent payments', async () => {
    const created = await app.request('/invoices', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invoiceBody()),
    });
    const invoice = (await created.json()).data;
    await app.request(`/invoices/${invoice.id}/send`, { method: 'POST' });

    const pay = (amount: number) =>
      app.request(`/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount, payment_date: '2026-01-01' }),
      });
    // Four at once, each 100.00 against a total of 119.00: at most one can be
    // accepted. The refusals are 400 (checked before the write) or 409 (refused
    // by the statement that writes), and either is correct — what must not
    // happen is two of them landing.
    const results = await Promise.all([pay(100), pay(100), pay(100), pay(100)]);
    const accepted = results.filter((r) => r.status === 201);
    expect(accepted.length).toBe(1);

    const read = await app.request(`/invoices/${invoice.id}`);
    const body = (await read.json()).data;
    const sum = body.payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
    expect(Number(body.amount_paid)).toBe(sum);
    expect(Number(body.amount_paid)).toBeLessThanOrEqual(Number(body.total));

    // Positive control: the rest of the balance is still payable, so the guard
    // refuses overpayment rather than refusing everything.
    const rest = await pay(19);
    expect(rest.status).toBe(201);
    const settled = await (await app.request(`/invoices/${invoice.id}`)).json();
    expect(settled.data.status).toBe('paid');
  });

  // ── A credit note is numbered from the tenant's series ─────────────────────
  //
  // It used `nextval('zvd_credit_note_seq')` — one sequence for the whole
  // instance, which is the defect `claimNumber` was written to remove for
  // invoices and was left standing on the twin. Two companies sharing an
  // install interleave and each is left with holes in its own register.
  it('numbers credit notes from the series, not from the global sequence', async () => {
    const body = {
      client_name: 'Test Client',
      reason: 'Return',
      lines: [{ description: 'Widget', quantity: 1, unit_price: 10, tax_rate: 19 }],
    };
    const post = () =>
      app.request('/credit-notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    const first = (await (await post()).json()).data;
    const second = (await (await post()).json()).data;
    // The series is `TC` here, seeded above — the old code always produced
    // `CN-…` from the sequence regardless of what the tenant configured, which
    // is exactly how a per-instance counter shows itself.
    expect(first.number.startsWith('TC-')).toBe(true);
    expect(second.number.startsWith('TC-')).toBe(true);
    expect(Number(second.number.slice(3))).toBe(Number(first.number.slice(3)) + 1);
  });

  // ── Two credit notes applied at once both reach the invoice ───────────────
  //
  // The discriminating case. Applying the SAME note twice in sequence was
  // already refused by the read above the transaction; what the old code lost
  // was two DIFFERENT notes landing together — each read `amount_paid`, added
  // its own value in JavaScript and wrote the ABSOLUTE result, so the second
  // write erased the first and one credit vanished. The note it came from was
  // still marked `applied`, so nothing pointed at the missing money.
  it('credits an invoice for both of two concurrent credit notes', async () => {
    const inv = (await (
      await app.request('/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(invoiceBody()),
      })
    ).json()).data;
    await app.request(`/invoices/${inv.id}/send`, { method: 'POST' });

    const issueNote = async () => {
      const cn = (await (
        await app.request('/credit-notes', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            client_name: 'Test Client',
            reason: 'Return',
            lines: [{ description: 'Widget', quantity: 1, unit_price: 10, tax_rate: 0 }],
          }),
        })
      ).json()).data;
      await app.request(`/credit-notes/${cn.id}/issue`, { method: 'POST' });
      return cn;
    };
    const [a, b] = [await issueNote(), await issueNote()];
    const applyNote = (id: string) =>
      app.request(`/credit-notes/${id}/apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ invoice_id: inv.id }),
      });

    const [ra, rb] = await Promise.all([applyNote(a.id), applyNote(b.id)]);
    expect(ra.status).toBe(200);
    expect(rb.status).toBe(200);
    // The amount reported is the one taken from the invoice BEFORE that credit
    // landed; computing it in `RETURNING` would report what is left over.
    expect(Number((await ra.json()).data.applied_amount)).toBe(10);

    const after = (await (await app.request(`/invoices/${inv.id}`)).json()).data;
    expect(Number(after.amount_paid)).toBe(20);

    // Applying a note a second time is refused — the note is no longer issued.
    const again = await applyNote(a.id);
    expect([400, 409]).toContain(again.status);
    const unchanged = (await (await app.request(`/invoices/${inv.id}`)).json()).data;
    expect(Number(unchanged.amount_paid)).toBe(20);
  });

  // ── A non-numeric page size is a query string, not a crash ────────────────
  it('answers a non-numeric limit instead of returning 500', async () => {
    const res = await app.request('/invoices?limit=all&page=first');
    expect(res.status).toBe(200);
    expect(Array.isArray((await res.json()).data)).toBe(true);
  });

  // ── The service twin, which `finance/banking` calls ───────────────────────
  //
  // `invoicing.recordPayment` is `POST /invoices/:id/payments` reachable by
  // name, and its own comment says so. It carried the same absolute write, and
  // it never checked the outstanding amount at all — so a bank transaction
  // larger than the invoice was recorded in full and the invoice marked `paid`.
  // Reached through `ctx.services` because it has no route: nothing in this
  // repository could exercise it before.
  it('refuses a service payment larger than the outstanding amount', async () => {
    const inv = (await (
      await app.request('/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(invoiceBody()),
      })
    ).json()).data;
    await app.request(`/invoices/${inv.id}/send`, { method: 'POST' });

    const recordPayment = ctx.services.get('invoicing.recordPayment') as (i: any) => Promise<any>;
    // Positive control first: an ordinary payment settles part of the invoice.
    const ok = await recordPayment({ invoiceId: inv.id, amount: 19, userId: 'u1' });
    expect(ok.status).toBe('partially_paid');
    expect(Number(ok.amount_paid)).toBe(19);

    // 200.00 against 100.00 outstanding. Thrown, not returned as null: banking
    // logs a throw and says nothing about a null.
    await expect(recordPayment({ invoiceId: inv.id, amount: 200, userId: 'u1' })).rejects.toThrow(
      /exceeds the outstanding amount/,
    );

    // And the refusal left no payment row behind.
    const after = (await (await app.request(`/invoices/${inv.id}`)).json()).data;
    expect(Number(after.amount_paid)).toBe(19);
    expect(after.payments.length).toBe(1);
  });

  // ── An issued invoice is not deleted ──────────────────────────────────────
  //
  // The route refused a `paid` invoice and permitted every other status, so a
  // user holding only the base `invoices` permission could destroy a numbered,
  // issued document — while the same user is refused `POST /cancel`, which
  // needs `invoices:cancel`. Deleting it also leaves a hole in the series that
  // `claimNumber` exists to keep continuous.
  it('deletes a draft and refuses an issued invoice', async () => {
    const draft = (await (
      await app.request('/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(invoiceBody()),
      })
    ).json()).data;
    expect((await app.request(`/invoices/${draft.id}`, { method: 'DELETE' })).status).toBe(200);

    const issued = (await (
      await app.request('/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(invoiceBody()),
      })
    ).json()).data;
    await app.request(`/invoices/${issued.id}/send`, { method: 'POST' });
    const res = await app.request(`/invoices/${issued.id}`, { method: 'DELETE' });
    expect(res.status).toBe(400);
    // Still there, still issued.
    const still = await app.request(`/invoices/${issued.id}`);
    expect(still.status).toBe(200);
    expect((await still.json()).data.status).toBe('sent');
  });
});
