/**
 * The parser that reads a supplier's label at reception.
 *
 * `supplier_lot_ref` is the field that ties a recall back to the supplier's own
 * batch, and `best_before_date` decides what gets sold. Both come from here, and
 * the operator sees them as a pre-filled reception form.
 *
 * The previous version stripped FNC1 — the only delimiter a variable-length
 * element has — and then searched for each AI with a bare `match`, which finds
 * `"10"` wherever those two digits fall, including across the boundary between
 * AI `01` and the GTIN behind it. Measured against six labels a supplier
 * actually prints, ALL SIX were mis-parsed, including the simplest:
 *
 *   01 05412345000013 | 10 LOT42 | 17 251231
 *     supplier_lot_ref -> "541234500001310LOT42"   (wanted "LOT42")
 *
 * Those six are the first six cases below. Each fails against the old code.
 */

import { describe, expect, test } from 'bun:test';
import { QRService } from './QRService.js';

const GS = '\x1D';
const parse = (raw: string) => QRService.parseGS1Barcode(raw);

describe('GS1: the six labels that were mis-parsed', () => {
  test('GTIN + lot + expiry, the ordinary case', () => {
    expect(parse(`0105412345000013${GS}10LOT42${GS}17251231`)).toEqual({
      gtin: '05412345000013',
      supplier_lot_ref: 'LOT42',
      best_before_date: '2025-12-31',
    });
  });

  test('a GTIN whose digits happen to contain "10"', () => {
    expect(parse(`0110000000000017${GS}10ABC999${GS}17260630`)).toEqual({
      gtin: '10000000000017',
      supplier_lot_ref: 'ABC999',
      best_before_date: '2026-06-30',
    });
  });

  test('expiry before lot — the standard does not fix the order', () => {
    expect(parse(`0105412345000013${GS}17251231${GS}10LOT42`)).toEqual({
      gtin: '05412345000013',
      supplier_lot_ref: 'LOT42',
      best_before_date: '2025-12-31',
    });
  });

  test('a lot reference containing digits that look like AI 17', () => {
    // The old parser read `best_before_date` out of the LOT text and produced
    // "2025-12-99".
    expect(parse(`0105412345000013${GS}10A17251299${GS}17260101`)).toEqual({
      gtin: '05412345000013',
      supplier_lot_ref: 'A17251299',
      best_before_date: '2026-01-01',
    });
  });

  test('day 00 means end of month, not day zero', () => {
    // The old parser emitted "2025-12-00", which no date column accepts.
    expect(parse(`0105412345000013${GS}17251200${GS}10LOT9`)).toEqual({
      gtin: '05412345000013',
      supplier_lot_ref: 'LOT9',
      best_before_date: '2025-12-31',
    });
  });

  test('a fixed-length measure AI between the GTIN and the lot', () => {
    // 3103 = net weight, 3 decimals: 001250 -> 1.250 kg. Six characters, no
    // separator, and the old parser swallowed them into the lot reference.
    expect(parse(`0105412345000013${GS}3103001250${GS}10LOT7`)).toEqual({
      gtin: '05412345000013',
      supplier_lot_ref: 'LOT7',
      quantity: 1.25,
    });
  });
});

describe('GS1: separators, and their absence', () => {
  test('a fixed-length element needs no separator after it', () => {
    // 01 and 17 are both predefined-length, so a compliant label may run them
    // together. Only the trailing variable-length element needs FNC1.
    expect(parse('010541234500001317251231' + GS + '10LOT1')).toEqual({
      gtin: '05412345000013',
      best_before_date: '2025-12-31',
      supplier_lot_ref: 'LOT1',
    });
  });

  test('a trailing variable element runs to the end', () => {
    expect(parse(`0105412345000013${GS}10FINAL`).supplier_lot_ref).toBe('FINAL');
  });

  test('a scanner that emits <GS> or U+241D instead of the control character', () => {
    expect(parse('0105412345000013<GS>10LOT42').supplier_lot_ref).toBe('LOT42');
    expect(parse('0105412345000013␝10LOT42').supplier_lot_ref).toBe('LOT42');
  });

  test('SSCC (18 characters) does not eat what follows', () => {
    expect(parse(`00340123450000000018${GS}10LOT3`).supplier_lot_ref).toBe('LOT3');
  });
});

describe('GS1: refusing rather than guessing', () => {
  test('an impossible date is dropped, not passed on', () => {
    // 2025-13-01 and 2025-02-30 are not dates. Silence beats a value a
    // best-before check would then act on.
    expect(parse(`0105412345000013${GS}17251301`).best_before_date).toBeUndefined();
    expect(parse(`0105412345000013${GS}17250230`).best_before_date).toBeUndefined();
  });

  test('a leap day is accepted in a leap year and refused otherwise', () => {
    expect(parse(`0105412345000013${GS}17240229`).best_before_date).toBe('2024-02-29');
    expect(parse(`0105412345000013${GS}17250229`).best_before_date).toBeUndefined();
  });

  test('a GTIN that is not 14 digits is not reported as one', () => {
    expect(parse('01123').gtin).toBeUndefined();
  });

  test('empty and non-string input give an empty result, not a crash', () => {
    expect(parse('')).toEqual({});
    expect(QRService.parseGS1Barcode(undefined as unknown as string)).toEqual({});
    expect(QRService.parseGS1Barcode(42 as unknown as string)).toEqual({});
  });

  test('an unknown AI stops at the separator instead of swallowing the rest', () => {
    // 91 is a company-internal AI with no defined length. The lot behind it must
    // still be found.
    expect(parse(`0105412345000013${GS}91WHATEVER${GS}10LOT8`).supplier_lot_ref).toBe('LOT8');
  });
});

describe('GS1: quantity', () => {
  test('AI 30 (variable count) is read', () => {
    expect(parse(`0105412345000013${GS}30144`).quantity).toBe(144);
  });

  test('AI 37 (count of contained items) is read', () => {
    expect(parse(`0105412345000013${GS}3712`).quantity).toBe(12);
  });

  test('a measure AI applies its implied decimals', () => {
    expect(parse(`0105412345000013${GS}3102000500`).quantity).toBe(5); // 2 decimals
    expect(parse(`0105412345000013${GS}3100000005`).quantity).toBe(5); // 0 decimals
  });
});
