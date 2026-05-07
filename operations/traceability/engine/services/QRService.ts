import QRCode from 'qrcode';

export class QRService {
  static generatePayload(lotId: string): string {
    return lotId;
  }

  static async generateQRDataURL(lotId: string): Promise<string> {
    return QRCode.toDataURL(lotId, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2,
    });
  }

  static async generateQRBuffer(lotId: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      QRCode.toBuffer(lotId, { errorCorrectionLevel: 'M', width: 300, margin: 2 }, (err, buf) => {
        if (err) reject(err);
        else resolve(buf);
      });
    });
  }

  // Parse GS1-128 barcode from supplier label (BT/HID scanner input at reception)
  static parseGS1Barcode(raw: string): Partial<GS1Data> {
    const result: Partial<GS1Data> = {};
    const clean = raw.replace(/\x1D/g, '');

    const gtin = clean.match(/^01(\d{14})/);
    if (gtin) result.gtin = gtin[1];

    const lot = clean.match(/10([^\x1D]{1,20})/);
    if (lot) result.supplier_lot_ref = lot[1];

    const expiry = clean.match(/17(\d{6})/);
    if (expiry) {
      const m = expiry[1].match(/(\d{2})(\d{2})(\d{2})/);
      if (m) result.best_before_date = `20${m[1]}-${m[2]}-${m[3]}`;
    }

    const qty = clean.match(/37(\d+)/);
    if (qty) result.quantity = parseInt(qty[1]);

    return result;
  }
}

export interface GS1Data {
  gtin: string;
  supplier_lot_ref: string;
  best_before_date: string;
  quantity: number;
}
