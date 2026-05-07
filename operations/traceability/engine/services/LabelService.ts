import PDFDocument from 'pdfkit';
import { QRService } from './QRService.js';

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

export class LabelService {
  // 100mm x 70mm — compatible with Zebra ZD420, Brother QL-820NWB
  static async generateLabel(lot: LotWithDetails): Promise<Buffer> {
    const qrDataUrl = await QRService.generateQRDataURL(lot.id);
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      const doc = new PDFDocument({
        size: [283.46, 198.43], // 100mm x 70mm in points
        margin: 8,
        info: { Title: `Etichetă lot ${lot.lot_number}` },
      });

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // QR code on the left
      doc.image(qrBuffer, 8, 8, { width: 80, height: 80 });

      // Lot info on the right
      const x = 96;
      let y = 8;

      doc.fontSize(9).font('Helvetica-Bold').text(lot.item_name, x, y, { width: 180 });
      y += doc.currentLineHeight() + 2;

      if (lot.supplier_name) {
        doc.fontSize(7).font('Helvetica').text(`Furnizor: ${lot.supplier_name}`, x, y, { width: 180 });
        y += doc.currentLineHeight() + 1;
      }

      if (lot.supplier_lot_ref) {
        doc.fontSize(7).text(`Lot furnizor: ${lot.supplier_lot_ref}`, x, y, { width: 180 });
        y += doc.currentLineHeight() + 1;
      }

      if (lot.best_before_date) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('red')
          .text(`BBD: ${lot.best_before_date}`, x, y, { width: 180 });
        doc.fillColor('black');
        y += doc.currentLineHeight() + 2;
      }

      doc.fontSize(8).font('Helvetica')
        .text(`Cant: ${lot.quantity_remaining} ${lot.unit}`, x, y, { width: 180 });
      y += doc.currentLineHeight() + 1;

      if (lot.warehouse) {
        const loc = [lot.warehouse, lot.row, lot.shelf].filter(Boolean).join(' / ');
        doc.fontSize(7).text(`Loc: ${loc}`, x, y, { width: 180 });
        y += doc.currentLineHeight() + 1;
      }

      // Lot number at bottom spanning full width
      doc.fontSize(7).font('Helvetica-Bold')
        .text(`LOT: ${lot.lot_number}`, 8, 165, { width: 270, align: 'center' });

      doc.end();
    });
  }

  static async generateBatchLabels(lots: LotWithDetails[]): Promise<Buffer> {
    const labelBuffers = await Promise.all(lots.map(l => LabelService.generateLabel(l)));
    // Concatenate PDFs by embedding each as a page — simplified: just concatenate buffers
    // For production, use pdf-lib or similar to properly merge PDFs
    return Buffer.concat(labelBuffers);
  }
}
