import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { DEJAVU_MONO_BASE64, DEJAVU_MONO_BOLD_BASE64, decodeFont } from './fonts.generated.js';
import { QRService } from './QRService.js';

/**
 * Lot labels.
 *
 * Built on `pdf-lib`, not `pdfkit`, and the reason is not preference.
 *
 * `pdfkit` loads the metrics for its built-in fonts at runtime, with
 * `readFileSync(__dirname + "/data/Helvetica.afm")`. An extension ships as a
 * single bundled `engine/index.js` and nothing else — no `node_modules`, and
 * the bundler rewrites `__dirname` to whatever absolute path the machine that
 * packed it used. So the shipped bundle read its font metrics from the packer's
 * home directory, and label printing failed on every installation that was not
 * that machine. It passed locally for exactly the same reason.
 *
 * ── Why the font is shipped rather than built in ──────────────
 *
 * pdf-lib's built-in fonts encode WinAnsi, which has no `ă`, `ș` or `ț`. On a
 * label whose whole purpose is tracing a lot back to its source, a silently
 * mangled supplier or product name is worse than no label, so the first version
 * of this file refused to print them. That was honest and close to useless:
 * this is a Romanian food-traceability extension, and those characters are in
 * ordinary supplier and product names.
 *
 * DejaVu Sans Mono covers them, and it travels as base64 in
 * `fonts.generated.ts` rather than as a file. Reading a `.ttf` from disk would
 * mean importing `node:fs`, which `check-ambient-authority` refuses: its
 * allow-list is empty, and this would have been the only extension in the
 * catalogue reaching for the filesystem — to load an asset it ships itself.
 *
 * The face is whole rather than subset because pdf-lib subsets at EMBED time:
 * a label PDF is about 5 KB whichever face goes in, so the cost is bundle size,
 * not document size. `scripts/build-traceability-fonts.ts` carries the
 * measurements behind choosing Mono over Sans.
 *
 * Licence: `../../fonts/LICENSE-DejaVu.txt` — a Bitstream Vera derivative that
 * permits redistribution, which is what makes shipping the glyphs legitimate.
 */

export interface LotWithDetails {
  id: string;
  lot_number: string;
  item_name: string;
  supplier_name?: string;
  supplier_lot_ref?: string;
  best_before_date?: string;
  quantity_remaining: number;
  unit: string;
  warehouse?: string;
  row?: string;
  shelf?: string;
  allergens?: string[];
  storage_conditions?: string;
}

// 100mm x 70mm in points — Zebra ZD420, Brother QL-820NWB.
const PAGE_W = 283.46;
const PAGE_H = 198.43;
const MARGIN = 8;
const QR_SIZE = 80;
const TEXT_X = 96;
const TEXT_W = 180;


/** pdf-lib has no text wrapping; the pdfkit renderer this replaced relied on its. */
function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let line = words[0] as string;
  for (const word of words.slice(1)) {
    const candidate = `${line} ${word}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

/**
 * Draws one lot onto one page. `cursor` is measured DOWN from the top edge, the
 * way the previous renderer worked; pdf-lib's origin is bottom-left, so every
 * baseline is converted once, here.
 */
function drawLabel(page: PDFPage, fonts: Fonts, qr: unknown, lot: LotWithDetails): void {
  page.drawImage(qr as never, {
    x: MARGIN,
    y: PAGE_H - MARGIN - QR_SIZE,
    width: QR_SIZE,
    height: QR_SIZE,
  });

  let cursor = MARGIN;

  const line = (text: string, size: number, font: PDFFont, color = rgb(0, 0, 0)): void => {
    for (const part of wrap(font, text, size, TEXT_W)) {
      page.drawText(part, { x: TEXT_X, y: PAGE_H - cursor - size, size, font, color });
      cursor += font.heightAtSize(size);
    }
  };

  line(lot.item_name, 9, fonts.bold);
  cursor += 2;

  if (lot.supplier_name) {
    line(`Furnizor: ${lot.supplier_name}`, 7, fonts.regular);
    cursor += 1;
  }

  if (lot.supplier_lot_ref) {
    line(`Lot furnizor: ${lot.supplier_lot_ref}`, 7, fonts.regular);
    cursor += 1;
  }

  if (lot.best_before_date) {
    line(`BBD: ${lot.best_before_date}`, 10, fonts.bold, rgb(1, 0, 0));
    cursor += 2;
  }

  line(`Cant: ${lot.quantity_remaining} ${lot.unit}`, 8, fonts.regular);
  cursor += 1;

  if (lot.warehouse) {
    const loc = [lot.warehouse, lot.row, lot.shelf].filter(Boolean).join(' / ');
    line(`Loc: ${loc}`, 7, fonts.regular);
    cursor += 1;
  }

  // Lot number along the bottom, centred across the full width.
  const lotText = `LOT: ${lot.lot_number}`;
  const lotWidth = fonts.bold.widthOfTextAtSize(lotText, 7);
  page.drawText(lotText, {
    x: (PAGE_W - lotWidth) / 2,
    y: PAGE_H - 165 - 7,
    size: 7,
    font: fonts.bold,
    color: rgb(0, 0, 0),
  });
}

async function render(lots: LotWithDetails[], title: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  // Required before a custom font can be embedded. The built-in fonts need no
  // fontkit, and also cannot spell "Făină".
  doc.registerFontkit(fontkit);

  // `subset: true` embeds only the glyphs actually used, so a 742 KB face costs
  // a few KB in the document instead of shipping whole into every label.
  const fonts: Fonts = {
    regular: await doc.embedFont(decodeFont(DEJAVU_MONO_BASE64), { subset: true }),
    bold: await doc.embedFont(decodeFont(DEJAVU_MONO_BOLD_BASE64), { subset: true }),
  };

  for (const lot of lots) {
    const qrDataUrl = await QRService.generateQRDataURL(lot.id);
    const qr = await doc.embedPng(qrDataUrl);
    drawLabel(doc.addPage([PAGE_W, PAGE_H]), fonts, qr, lot);
  }

  return Buffer.from(await doc.save());
}

export class LabelService {
  static async generateLabel(lot: LotWithDetails): Promise<Buffer> {
    return render([lot], `Etichetă lot ${lot.lot_number}`);
  }

  /**
   * One document, one page per lot.
   *
   * This used to be `Buffer.concat` over separately generated PDFs, with a
   * comment saying a real merge was still to be done. Concatenated PDF files
   * are not a multi-page PDF: measured on two lots, the result carried two
   * `%PDF-` headers and two `%%EOF` markers, so a reader shows the first label
   * and ignores the rest. It returned a Buffer that looked like a document and
   * was not one.
   */
  static async generateBatchLabels(lots: LotWithDetails[]): Promise<Buffer> {
    if (lots.length === 0) throw new Error('No lots to label');
    return render(lots, `Etichete — ${lots.length} loturi`);
  }
}
