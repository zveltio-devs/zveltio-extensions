import { describe, expect, it } from 'bun:test';
import { parseMT940 } from './mt940.js';

/**
 * The lines here are the shapes banks actually send, not invented ones. Five of
 * the seven were dropped by the previous regex — silently, with no count and no
 * log — and two of those five were reversals.
 *
 * A reversal is how a bank undoes a transaction. Dropping every one means an
 * imported statement shows money arriving and never shows it going back, and the
 * account balance this import adds up is wrong in the customer's favour.
 */
const line = (body: string) => `:61:2603150315${body}`;

describe('parseMT940', () => {
  it('reads every legal line shape, not just the two the old regex allowed', () => {
    const stmt = [
      line('C1500,00NTRFNONREF//BT1'), ':86:Incasare',
      line('D250,50NTRFNONREF//BT2'), ':86:Plata',
      line('CR900,00NTRFNONREF//BT3'), ':86:Cod de fonduri',
      line('C1000,NTRFNONREF//BT4'), ':86:Fara zecimale',
      line('C99,90STRFNONREF//BT5'), ':86:Cod S',
    ].join('\r\n');
    const r = parseMT940(stmt);
    expect(r.unparsed).toEqual([]);
    expect(r.transactions.map((t) => t.amount)).toEqual([1500, 250.5, 900, 1000, 99.9]);
  });

  it('inverts the direction of a reversal, so it cancels the movement it undoes', () => {
    const stmt = [
      line('C1500,00NTRFNONREF//BT1'), ':86:Incasare',
      line('RC1500,00NTRFNONREF//BT2'), ':86:Stornare incasare',
      line('D250,50NTRFNONREF//BT3'), ':86:Plata',
      line('RD250,50NTRFNONREF//BT4'), ':86:Stornare plata',
    ].join('\r\n');
    const r = parseMT940(stmt);
    expect(r.transactions.map((t) => t.type)).toEqual(['credit', 'debit', 'debit', 'credit']);
    expect(r.transactions.filter((t) => t.reversal)).toHaveLength(2);
    // The point of the whole thing: a statement of a payment and its reversal
    // nets to zero. Recording an RC as a credit would double the original.
    const net = r.transactions.reduce((s, t) => s + (t.type === 'credit' ? t.amount : -t.amount), 0);
    expect(net).toBe(0);
  });

  it('joins a narrative that continues past the :86: line', () => {
    const r = parseMT940([line('C10,00NTRFNONREF//BT1'), ':86:Prima parte', 'a doua parte', ':62F:C260315RON1,00'].join('\n'));
    expect(r.transactions[0]?.description).toBe('Prima parte a doua parte');
  });

  it('reports a line it cannot read instead of skipping it', () => {
    // The whole defect in one assertion: silence here is what let five of seven
    // shapes disappear without anyone noticing for the life of the feature.
    const r = parseMT940(':61:NU-E-O-LINIE-VALIDA');
    expect(r.transactions).toEqual([]);
    expect(r.unparsed).toEqual([':61:NU-E-O-LINIE-VALIDA']);
  });
});
