import { describe, expect, it } from 'bun:test';
import { parseCSV } from './routes';

describe('parseCSV', () => {
  it('keeps a quoted line break, delimiter and quote inside one value', () => {
    const text = 'name;note\r\nalpha;"two\nlines; ""quoted"""\nbeta;\n\n';
    expect(parseCSV(text, ';')).toEqual([
      { name: 'alpha', note: 'two\nlines; "quoted"' },
      { name: 'beta', note: null },
    ]);
  });

  it('reads a last record with no line break, and nothing from a header alone', () => {
    expect(parseCSV('a,b\n1,2')).toEqual([{ a: '1', b: '2' }]);
    expect(parseCSV('a,b\n')).toEqual([]);
  });
});
