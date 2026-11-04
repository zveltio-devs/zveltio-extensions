// ─── CSV parsing ──────────────────────────────────────────────────────────────

/**
 * RFC 4180 records: a quoted field may hold the delimiter, `""` and line
 * breaks. Splitting the text into lines first cut a quoted multi-line value
 * into two broken rows.
 */
function parseCSVRecords(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') inQuotes = false;
      else field += char;
    } else if (char === '"') inQuotes = true;
    else if (char === delimiter) {
      record.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else field += char;
  }
  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}

/** A blank CSV cell is a missing value; a JSON `""` stays a string. */
export function parseCSV(text: string, delimiter = ','): Record<string, string | null>[] {
  const [headers, ...records] = parseCSVRecords(text, delimiter);
  if (!headers) return [];
  const rows: Record<string, string | null>[] = [];
  for (const values of records) {
    if (values.every((v) => !v.trim())) continue;
    const row: Record<string, string | null> = {};
    headers.forEach((h, idx) => {
      const value = (values[idx] ?? '').trim();
      row[h.trim()] = value === '' ? null : value;
    });
    rows.push(row);
  }
  return rows;
}
