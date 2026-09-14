/**
 * LabelService — two claims, both of which failed silently before.
 *
 * 1. The batch path must produce ONE document, not several files in one buffer.
 *    It used to `Buffer.concat` separately generated PDFs, with a comment
 *    saying a real merge was still to be done. Nothing tested it, and the shape
 *    of the defect is invisible from outside: the response has the right
 *    content type, a plausible size, and opens — showing only the first label.
 *    Measured before the repair, two lots produced two `%PDF-` headers and two
 *    `%%EOF` markers.
 *
 * 2. Romanian names must print. The built-in pdf-lib fonts encode WinAnsi,
 *    which has no `ă`, `ș` or `ț` — on a traceability label, a silently
 *    mangled supplier name is worse than no label. The first repair refused
 *    those names outright, which was honest and close to useless for a
 *    Romanian food extension; the font is now shipped beside the extension.
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
    // The other half of the original repair: pdfkit read its font metrics from
    // `__dirname + "/data/*.afm"`, and the bundler froze `__dirname` to the
    // packing machine's home directory, so printing worked only there.
    const pdf = await LabelService.generateLabel(LOT);
    expect(pdf.toString('latin1')).not.toContain('/home/');
  });

  it('prints a product name carrying Romanian diacritics', async () => {
    const pdf = await LabelService.generateLabel({
      ...LOT,
      item_name: 'Făină albă',
      supplier_name: 'Moara Țării SRL',
    });
    expect(await PDFDocument.load(pdf).then((d) => d.getPageCount())).toBe(1);
  });

  it('refuses a name the font cannot draw, instead of printing blanks', async () => {
    // The regression this guards: switching to a Unicode font removed the old
    // WinAnsi refusal, and pdf-lib does NOT throw on a missing glyph — it
    // substitutes .notdef and returns a valid one-page PDF. A Chinese supplier
    // name printed as empty boxes while the caller was told it worked.
    await expect(
      LabelService.generateLabel({ ...LOT, item_name: '北京食品有限公司' }),
    ).rejects.toThrow(/Cannot print the product name.*U\+5317/);
  });

  it('prints the scripts the font does cover, beyond Romanian', async () => {
    // The guard is against the font's real coverage, not a guessed subset —
    // an earlier version refused everything outside WinAnsi's 224 codepoints.
    const pdf = await LabelService.generateLabel({
      ...LOT,
      item_name: 'Mąka pszenna őrölt',
      supplier_name: 'Мелница ООД',
    });
    expect(await PDFDocument.load(pdf).then((d) => d.getPageCount())).toBe(1);
  });

  it('embeds the shipped font rather than a built-in one', async () => {
    // The discriminating check for the diacritics fix: a WinAnsi built-in would
    // still produce a valid one-page PDF, it would simply be unable to encode
    // the characters. The font descriptor says which was actually used.
    //
    // The document has to be flattened first. pdf-lib writes object streams by
    // default, so grepping the shipped bytes finds no /BaseFont at all — which
    // looks exactly like "no font embedded" and is not. Re-saving with
    // useObjectStreams: false is what makes the claim checkable.
    const pdf = await LabelService.generateLabel({ ...LOT, item_name: 'Făină albă' });
    const flat = Buffer.from(
      await PDFDocument.load(pdf).then((d) => d.save({ useObjectStreams: false })),
    );
    const text = flat.toString('latin1');

    expect(text).toContain('DejaVu');
    // A real embedded font file, not just a name referenced from the catalogue.
    expect(text).toContain('/FontFile2');
  });
});
