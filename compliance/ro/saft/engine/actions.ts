import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';
import { generateSAFTXML } from './saft-generator.js';

// The ledger is `finance/accounting`'s: its chart of accounts and its posted
// journal entries. This extension keeps no copy of either — a second chart and
// a second journal, typed in by hand, is a file that disagrees with the books.
// The engine runs `generate` as the caller, through the data API, so what goes
// into the file is what the caller may read.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const C = 'saft_exports';
const FILES = 'saft_files';
const PAGE = 500;

/** A DATE value as `YYYY-MM-DD`. */
const day = (v: unknown) => String(v ?? '').slice(0, 10);

async function all(host: Host, collection: string, filter: Row): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 1; ; page++) {
    const res = await host.collections.list(collection, { filter, limit: PAGE, page, sort: 'id', count: 'none' });
    const recs = res.records;
    if (!Array.isArray(recs)) throw new Error(`The data API listed ${collection} without records.`);
    out.push(...recs);
    if (recs.length < PAGE) return out;
  }
}

/** Build the export's XML from the posted ledger of its period, again on every call. */
const generate: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const exp = await host.collections.read(C, id);
  if (!exp) throw new ActionRefusal(404, 'export_not_found', 'No such export.');
  const start = day(exp.period_start);
  const end = day(exp.period_end);
  if (end < start) throw new ActionRefusal(422, 'period_reversed', 'The period ends before it starts.');

  const accounts = await all(host, 'accounts', {});
  // One operator per field reaches the data API (it keeps the first), so the end is checked here.
  const entries = (await all(host, 'journal_entries', { status: 'posted', date: { gte: start } })).filter(
    (e) => day(e.date) <= end,
  );
  const byEntry = new Map(entries.map((e) => [e.id as string, e]));
  const lines: Row[] = [];
  const ids = [...byEntry.keys()];
  for (let i = 0; i < ids.length; i += PAGE) {
    lines.push(...(await all(host, 'journal_lines', { entry_id: { in: ids.slice(i, i + PAGE) } })));
  }
  const code = new Map(accounts.map((a) => [a.id as string, String(a.code)]));
  const unknown = [...new Set(lines.map((l) => l.account_id as string).filter((a) => !code.has(a)))];
  if (unknown.length) {
    throw new ActionRefusal(422, 'account_not_readable', `Lines post to accounts this caller cannot read: ${unknown.join(', ')}.`);
  }

  const xml = generateSAFTXML({
    company_name: String(exp.company_name),
    company_cui: String(exp.company_cui),
    company_address: (exp.company_address as string | null) ?? undefined,
    period_start: start,
    period_end: end,
    accounts: accounts.map((a) => ({
      code: String(a.code),
      description: String(a.name),
      account_type: String(a.type),
    })),
    entries: lines
      .map((l) => {
        const e = byEntry.get(l.entry_id as string) as Row;
        return {
          id: String(l.id),
          account_code: code.get(l.account_id as string) as string,
          entry_date: day(e.date),
          description: String(l.description || e.description || ''),
          debit: Number(l.debit ?? 0),
          credit: Number(l.credit ?? 0),
          document_number: (e.reference as string | null) || undefined,
        };
      })
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date)),
  });

  // The XML lives in `saft_files`, one row per export, so listing exports does not carry it.
  // Two concurrent first runs: the second insert meets the unique export_id and fails; a retry updates.
  const file = (await host.collections.list(FILES, { filter: { export_id: id }, limit: 1, count: 'none' }))
    .records as Row[];
  if (file?.[0]) await host.collections.update(FILES, file[0].id as string, { xml });
  else await host.collections.insert(FILES, { export_id: id, xml });
  return host.collections.update(C, id, { status: 'generated', entries_count: lines.length });
};

export const saftActions = { generate };
