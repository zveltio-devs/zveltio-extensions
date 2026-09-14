import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
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
 * packed it happened to use. So the shipped bundle read the font metrics from
 * the packer's home directory, and label printing failed on every installation
 * that was not that machine. It passed locally for exactly the same reason.
 *
 * `pdf-lib` carries its standard-font metrics inside the library, so there is
 * no filesystem lookup to get wrong. The engine's own PDF worker already uses
 * it (`packages/engine/src/workers/pdf-worker.ts`).
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

/**
 * The built-in fonts encode WinAnsi, which has no `ă`, `ș` or `ț`. Rather than
 * emit a label whose supplier or product name is silently wrong — on a document
 * whose whole purpose is tracing a lot back to its source — refuse and say
 * which field and which character. Printing those names needs an embedded
 * Unicode font, which is a deliberate decision about bundle size, not something
 * to fake here.
 */
function encodable(font: PDFFont, field: string, value: string): string {
  try {
    font.encodeText(value);
    return value;
  } catch {
    const bad = [...value].find((ch) => {
      try {
        font.encodeText(ch);
        return false;
      } catch {
        return true;
      }
    });
    throw new Error(
      `Cannot print ${field}: the built-in label font cannot encode "${bad}". ` +
        `Remove the character or install a label font with Unicode coverage.`,
    );
  }
}

/** pdf-lib has no text wrapping; the previous renderer relied on pdfkit's. */
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

  const line = (
    text: string,
    size: number,
    font: PDFFont,
    field: string,
    color = rgb(0, 0, 0),
  ): void => {
    for (const part of wrap(font, encodable(font, field, text), size, TEXT_W)) {
      page.drawText(part, { x: TEXT_X, y: PAGE_H - cursor - size, size, font, color });
      cursor += font.heightAtSize(size);
    }
  };

  line(lot.item_name, 9, fonts.bold, 'the product name');
  cursor += 2;

  if (lot.supplier_name) {
    line(`Furnizor: ${lot.supplier_name}`, 7, fonts.regular, 'the supplier name');
    cursor += 1;
  }

  if (lot.supplier_lot_ref) {
    line(`Lot furnizor: ${lot.supplier_lot_ref}`, 7, fonts.regular, "the supplier's lot reference");
    cursor += 1;
  }

  if (lot.best_before_date) {
    line(`BBD: ${lot.best_before_date}`, 10, fonts.bold, 'the best-before date', rgb(1, 0, 0));
    cursor += 2;
  }

  line(`Cant: ${lot.quantity_remaining} ${lot.unit}`, 8, fonts.regular, 'the quantity');
  cursor += 1;

  if (lot.warehouse) {
    const loc = [lot.warehouse, lot.row, lot.shelf].filter(Boolean).join(' / ');
    line(`Loc: ${loc}`, 7, fonts.regular, 'the storage location');
    cursor += 1;
  }

  // Lot number along the bottom, centred across the full width.
  const lotText = encodable(fonts.bold, 'the lot number', `LOT: ${lot.lot_number}`);
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
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
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
    // Document metadata is UTF-16 in a PDF, so the title keeps its diacritics
    // even though the page text cannot.
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
