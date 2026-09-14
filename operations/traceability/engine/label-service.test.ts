/**
 * LabelService — the batch path must produce ONE document, not several files
 * in one buffer.
 *
 * It used to `Buffer.concat` separately generated PDFs, with a comment saying a
 * real merge was still to be done. Nothing tested it, and the shape of the
 * defect is invisible from the outside: the response has the right content
 * type, a plausible size, and opens — showing only the first label. Measured
 * before the repair, two lots produced two `%PDF-` headers and two `%%EOF`
 * markers in one buffer.
 *
 * These run without a database: the service takes plain objects.
 */

import { describe, expect, it } from 'bun:test';
import { PDFDocument } from 'pdf-lib';
import { LabelService, type LotWithDetails } from './services/LabelService.js';

const LOT: LotWithDetails = {
  id: '11111111-1111-1111-1111-111111111111',
  lot_number: 'L-2026-001',
  item_name: 'Faina alba',
  supplier_name: 'Moara SRL',
  supplier_lot_ref: 'SUP-77',
  best_before_date: '2026-12-01',
  quantity_remaining: 25,
  unit: 'kg',
  warehouse: 'D1',
  row: 'R3',
  shelf: 'S2',
};

const occurrences = (buf: Buffer, needle: string): number =>
  buf.toString('latin1').split(needle).length - 1;

describe('LabelService', () => {
  it('renders a single label as a one-page document', async () => {
    const pdf = await LabelService.generateLabel(LOT);
    expect(occurrences(pdf, '%PDF-')).toBe(1);
    expect(await PDFDocument.load(pdf).then((d) => d.getPageCount())).toBe(1);
  });

  it('renders a batch as ONE document with one page per lot', async () => {
    const pdf = await LabelService.generateBatchLabels([LOT, { ...LOT, lot_number: 'L-2' }, LOT]);

    // The assertion that fails on the concatenating implementation: it produced
    // one header and one trailer per lot.
    expect(occurrences(pdf, '%PDF-')).toBe(1);
    expect(occurrences(pdf, '%%EOF')).toBe(1);

    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(3);
  });

  it('refuses an empty batch rather than emitting an empty file', async () => {
    await expect(LabelService.generateBatchLabels([])).rejects.toThrow('No lots to label');
  });

  it('carries no absolute path from the machine that built it', async () => {
    // The other half of the repair: pdfkit read its font metrics from
    // `__dirname + "/data/*.afm"`, and the bundler froze `__dirname` to the
    // packing machine's home directory, so printing worked only there.
    const pdf = await LabelService.generateLabel(LOT);
    expect(pdf.toString('latin1')).not.toContain('/home/');
  });

  it('refuses a name the label font cannot encode, naming the field and the character', async () => {
    // WinAnsi has no `ă`. Printing the label with the character silently
    // dropped would put a wrong product name on a traceability document.
    await expect(
      LabelService.generateLabel({ ...LOT, item_name: 'Făină albă' }),
    ).rejects.toThrow(/Cannot print the product name.*"ă"/);
  });

  it('prints the fields that have no diacritics', async () => {
    const pdf = await LabelService.generateLabel({
      ...LOT,
      supplier_name: 'Moara Veche SRL',
      warehouse: 'Depozit 1',
    });
    expect(await PDFDocument.load(pdf).then((d) => d.getPageCount())).toBe(1);
  });
});
