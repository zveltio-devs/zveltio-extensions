/**
 * The currency is caller-controlled and lands in XML attribute positions all
 * over the document. Before the escape (and the three-letter schema
 * constraint), a `" /><…` currency value was an XML injection into a fiscal
 * document — measured through POST / + /:id/generate-xml: the marker string
 * came back verbatim in the generated UBL.
 *
 * Unit-level, no database: the generator is a pure function of InvoiceData.
 */
import { describe, expect, it } from 'bun:test';
import { generateUBLXML } from './ubl-generator';

const base = {
  invoice_number: 'INV-1',
  invoice_date: '2026-09-08',
  seller_name: 'Seller',
  seller_cui: '12345678',
  buyer_name: 'Buyer',
  lines: [
    { description: 'Work', quantity: 1, unit: 'H87', unit_price: 100, vat_rate: 19, vat_amount: 19, line_total: 119 },
  ],
  subtotal: 100,
  vat_total: 19,
  total: 119,
};

describe('ubl-generator — currency is escaped everywhere it appears', () => {
  it('does not pass an injection through, even if a poisoned row reaches it', () => {
    const evil = 'RON"/><cbc:ID>INJECTED</cbc:ID><cbc:X x="';
    const xml = generateUBLXML({ ...base, currency: evil });
    // The MARKUP is neutralised: no live element from the payload survives.
    // (Escaping cannot remove the text "INJECTED" itself — `&lt;cbc:ID&gt;`
    // still contains it — so assert on the tag form, not the word.)
    expect(xml).not.toContain('<cbc:ID>INJECTED</cbc:ID>');
    expect(xml).not.toContain(evil);
    expect(xml).toContain('&quot;');
  });

  it('keeps a normal ISO code exactly as given', () => {
    const xml = generateUBLXML({ ...base, currency: 'EUR' });
    expect(xml).toContain('currencyID="EUR"');
    expect(xml).toContain('<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>');
  });
});
