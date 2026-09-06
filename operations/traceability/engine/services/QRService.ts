import QRCode from 'qrcode';

/** GS1 element separator. The only delimiter a variable-length element has. */
const FNC1 = '\x1D';

/**
 * Application Identifiers with a predefined length, so no separator follows.
 *
 * The value is the number of characters AFTER the AI. Anything not here is
 * variable-length and runs to the next FNC1.
 */
const FIXED_LENGTH_AI: Record<string, number> = {
  '00': 18, // SSCC
  '01': 14, // GTIN
  '02': 14, // GTIN of contained trade items
  '03': 14,
  '04': 16,
  '11': 6, // production date
  '12': 6, // due date
  '13': 6, // packaging date
  '15': 6, // best before
  '16': 6, // sell by
  '17': 6, // expiry
  '18': 6,
  '19': 6,
  '20': 2, // variant
  '41': 13,
  // No 2-digit entries for 31–36: those AIs are always four digits (31nn–36nn,
  // where the last digit is the number of implied decimals), and `readAi` takes
  // the four-digit form first. A 2-digit `31` entry here would be unreachable
  // and would suggest a shape that does not exist.
};

/**
 * The AI starting at `i`, or null.
 *
 * Four-digit measure AIs (31nn–36nn) are matched first, because their first two
 * digits are also a valid two-digit AI prefix. The range starts at 31, not 30:
 * `30` is the variable-length count, and reading `30144` as AI `3014` left the
 * quantity as `4`. Caught by a test, not by reading.
 */
function readAi(s: string, i: number): string | null {
  const four = s.slice(i, i + 4);
  if (/^3[1-6]\d\d$/.test(four)) return four;
  const two = s.slice(i, i + 2);
  return /^\d{2}$/.test(two) ? two : null;
}

/**
 * `YYMMDD` as an ISO date.
 *
 * A day of `00` means "end of the month" in GS1 and is not a date any database
 * will accept. The old parser passed it straight through as `2025-12-00`.
 */
function gs1Date(v: string): string | null {
  const m = /^(\d{2})(\d{2})(\d{2})$/.exec(v);
  if (!m) return null;
  const year = 2000 + Number.parseInt(m[1]!, 10);
  const month = Number.parseInt(m[2]!, 10);
  let day = Number.parseInt(m[3]!, 10);
  if (month < 1 || month > 12) return null;
  if (day === 0) day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > last) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

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

  /**
   * Parse a GS1-128 / GS1 DataMatrix payload from a supplier label.
   *
   * ## What was wrong: every label, including the simplest one
   *
   * The previous version stripped FNC1 (`\x1D`) and then searched for each AI
   * with a bare `match`. FNC1 is the ONLY delimiter a variable-length element
   * has, so removing it first destroys the structure; and searching for the
   * literal `"10"` finds it wherever those two digits happen to fall — including
   * across the boundary between AI `01` and the GTIN that follows it.
   *
   * Measured against six labels a supplier actually prints. All six were
   * mis-parsed:
   *
   *   01 05412345000013 | 10 LOT42 | 17 251231
   *     supplier_lot_ref  ->  "541234500001310LOT42"   (wanted "LOT42")
   *
   *   01 05412345000013 | 17 251200 | 10 LOT9        (day 00 = end of month)
   *     best_before_date  ->  "2025-12-00"            an invalid date
   *
   *   01 05412345000013 | 10 A17251299 | 17 260101
   *     best_before_date  ->  "2025-12-99"            read out of the LOT text
   *
   * `supplier_lot_ref` is the field that ties a recall back to the supplier's own
   * batch, and `best_before_date` decides what gets sold. Both were wrong on an
   * ordinary label, and the operator sees them as a pre-filled reception form.
   *
   * ## What this does instead
   *
   * Reads the payload the way the standard defines it: left to right, one
   * element at a time. An AI is 2–4 digits; if it has a predefined length, that
   * many characters follow and no separator is needed; otherwise the element runs
   * to the next FNC1 or to the end of the payload.
   *
   * An unknown AI is treated as variable-length, so it stops at the next FNC1
   * rather than guessing a width. If it has no separator after it the parse ends
   * there — losing the tail is better than attributing it to the wrong field on a
   * food-safety record.
   *
   * Deliberately NOT a full GS1 implementation: the AI table covers what appears
   * on food packaging plus everything this extension reads. Anything else is
   * skipped rather than interpreted.
   */
  static parseGS1Barcode(raw: string): Partial<GS1Data> {
    const result: Partial<GS1Data> = {};
    if (typeof raw !== 'string' || raw.length === 0) return result;

    // Some scanners emit the separator as a printable sequence instead of the
    // control character.
    const s = raw.replace(/\u241D/g, FNC1).replace(/<GS>/gi, FNC1);

    let i = 0;
    while (i < s.length) {
      if (s[i] === FNC1) {
        i += 1;
        continue;
      }

      const ai = readAi(s, i);
      if (!ai) break; // not a digit where an AI must start — stop rather than guess
      i += ai.length;

      const fixed = FIXED_LENGTH_AI[ai];
      let value: string;
      if (fixed !== undefined) {
        value = s.slice(i, i + fixed);
        i += fixed;
      } else {
        const sep = s.indexOf(FNC1, i);
        value = sep === -1 ? s.slice(i) : s.slice(i, sep);
        i = sep === -1 ? s.length : sep;
      }

      if (value.length === 0) continue;

      switch (ai) {
        case '01':
          if (/^\d{14}$/.test(value)) result.gtin = value;
          break;
        case '10':
          result.supplier_lot_ref = value.slice(0, 20);
          break;
        // 15 BEST BEFORE and 17 EXPIRY are both "do not use after". 15 is the
        // quality date and 17 the safety one, so 17 wins where a label has both.
        case '15':
          if (result.best_before_date === undefined) {
            const d = gs1Date(value);
            if (d) result.best_before_date = d;
          }
          break;
        case '17': {
          const d = gs1Date(value);
          if (d) result.best_before_date = d;
          break;
        }
        case '30':
        case '37': {
          if (/^\d{1,8}$/.test(value)) result.quantity = Number.parseInt(value, 10);
          break;
        }
        default:
          // 310n–369n carry a measure with `n` implied decimals. Read as a
          // quantity only when nothing more specific said so.
          if (/^3[1-6]\d\d$/.test(ai) && /^\d{6}$/.test(value) && result.quantity === undefined) {
            const decimals = Number.parseInt(ai[3]!, 10);
            result.quantity = Number.parseInt(value, 10) / 10 ** decimals;
          }
          break;
      }
    }

    return result;
  }
}

export interface GS1Data {
  gtin: string;
  supplier_lot_ref: string;
  best_before_date: string;
  quantity: number;
}
