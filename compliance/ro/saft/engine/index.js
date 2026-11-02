// @bun
// /zveltio-extension/packages/sdk/src/extension/action-refusal.ts
var ACTION_REFUSAL = Symbol.for("zveltio.extension.action-refusal");

class ActionRefusal extends Error {
  status;
  code;
  [ACTION_REFUSAL] = true;
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ActionRefusal";
  }
}
// /zveltio-extension/packages/sdk/src/extension/reserved-paths.ts
var RESERVED_PATH_SEGMENTS = Object.freeze([
  "api",
  "ext",
  "admin",
  "app",
  "auth",
  "_app",
  "_server",
  ".well-known",
  "robots.txt",
  "sitemap.xml"
]);
// engine/saft-generator.ts
function escapeXml(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function formatDate(d) {
  return d.split("T")[0];
}
function generateSAFTXML(data) {
  const accounts = data.accounts.map((acc) => `
      <Account>
        <AccountID>${escapeXml(acc.code)}</AccountID>
        <AccountDescription>${escapeXml(acc.description)}</AccountDescription>
        <AccountType>${escapeXml(acc.account_type)}</AccountType>
      </Account>`).join(`
`);
  const totalDebit = data.entries.reduce((s, e) => s + Number(e.debit), 0);
  const totalCredit = data.entries.reduce((s, e) => s + Number(e.credit), 0);
  const lines = data.entries.map((entry, i) => `
        <Line>
          <RecordID>${escapeXml(entry.id)}</RecordID>
          <AccountID>${escapeXml(entry.account_code)}</AccountID>
          <Description>${escapeXml(entry.description)}</Description>
          <DebitAmount>
            <Amount>${Number(entry.debit).toFixed(2)}</Amount>
          </DebitAmount>
          <CreditAmount>
            <Amount>${Number(entry.credit).toFixed(2)}</Amount>
          </CreditAmount>
          ${entry.document_number ? `<SourceDocumentID>${escapeXml(entry.document_number)}</SourceDocumentID>` : ""}
        </Line>`).join(`
`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:StandardAuditFile-Taxation-Financial:RO"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <Header>
    <AuditFileVersion>2.0</AuditFileVersion>
    <AuditFileCountry>RO</AuditFileCountry>
    <AuditFileDateCreated>${new Date().toISOString().split("T")[0]}</AuditFileDateCreated>
    <SoftwareCompanyName>Zveltio</SoftwareCompanyName>
    <SoftwareID>Zveltio BaaS</SoftwareID>
    <SoftwareVersion>2.0</SoftwareVersion>
    <Company>
      <RegistrationNumber>${escapeXml(data.company_cui)}</RegistrationNumber>
      <Name>${escapeXml(data.company_name)}</Name>
      ${data.company_address ? `<Address>
        <StreetName>${escapeXml(data.company_address)}</StreetName>
        <Country>RO</Country>
      </Address>` : ""}
    </Company>
    <DefaultCurrencyCode>RON</DefaultCurrencyCode>
    <SelectionCriteria>
      <SelectionStartDate>${formatDate(data.period_start)}</SelectionStartDate>
      <SelectionEndDate>${formatDate(data.period_end)}</SelectionEndDate>
    </SelectionCriteria>
  </Header>

  <MasterFiles>
    <GeneralLedgerAccounts>
      ${accounts}
    </GeneralLedgerAccounts>
  </MasterFiles>

  <GeneralLedgerEntries>
    <NumberOfEntries>${data.entries.length}</NumberOfEntries>
    <TotalDebit>${totalDebit.toFixed(2)}</TotalDebit>
    <TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>
    <Journal>
      <JournalID>GEN</JournalID>
      <Description>General Ledger</Description>
      <Type>GL</Type>
      ${lines}
    </Journal>
  </GeneralLedgerEntries>

</AuditFile>`;
}

// engine/actions.ts
var C = "saft_exports";
var FILES = "saft_files";
var PAGE = 500;
var day = (v) => String(v ?? "").slice(0, 10);
async function all(host, collection, filter) {
  const out = [];
  for (let page = 1;; page++) {
    const res = await host.collections.list(collection, { filter, limit: PAGE, page, sort: "id", count: "none" });
    const recs = res.records;
    if (!Array.isArray(recs))
      throw new Error(`The data API listed ${collection} without records.`);
    out.push(...recs);
    if (recs.length < PAGE)
      return out;
  }
}
var generate = async (input, host) => {
  const { id } = input;
  const exp = await host.collections.read(C, id);
  if (!exp)
    throw new ActionRefusal(404, "export_not_found", "No such export.");
  const start = day(exp.period_start);
  const end = day(exp.period_end);
  if (end < start)
    throw new ActionRefusal(422, "period_reversed", "The period ends before it starts.");
  const accounts = await all(host, "accounts", {});
  const entries = (await all(host, "journal_entries", { status: "posted", date: { gte: start } })).filter((e) => day(e.date) <= end);
  const byEntry = new Map(entries.map((e) => [e.id, e]));
  const lines = [];
  const ids = [...byEntry.keys()];
  for (let i = 0;i < ids.length; i += PAGE) {
    lines.push(...await all(host, "journal_lines", { entry_id: { in: ids.slice(i, i + PAGE) } }));
  }
  const code = new Map(accounts.map((a) => [a.id, String(a.code)]));
  const unknown = [...new Set(lines.map((l) => l.account_id).filter((a) => !code.has(a)))];
  if (unknown.length) {
    throw new ActionRefusal(422, "account_not_readable", `Lines post to accounts this caller cannot read: ${unknown.join(", ")}.`);
  }
  const xml = generateSAFTXML({
    company_name: String(exp.company_name),
    company_cui: String(exp.company_cui),
    company_address: exp.company_address ?? undefined,
    period_start: start,
    period_end: end,
    accounts: accounts.map((a) => ({
      code: String(a.code),
      description: String(a.name),
      account_type: String(a.type)
    })),
    entries: lines.map((l) => {
      const e = byEntry.get(l.entry_id);
      return {
        id: String(l.id),
        account_code: code.get(l.account_id),
        entry_date: day(e.date),
        description: String(l.description || e.description || ""),
        debit: Number(l.debit ?? 0),
        credit: Number(l.credit ?? 0),
        document_number: e.reference || undefined
      };
    }).sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  });
  const file = (await host.collections.list(FILES, { filter: { export_id: id }, limit: 1, count: "none" })).records;
  if (file?.[0])
    await host.collections.update(FILES, file[0].id, { xml });
  else
    await host.collections.insert(FILES, { export_id: id, xml });
  return host.collections.update(C, id, { status: "generated", entries_count: lines.length });
};
var saftActions = { generate };

// engine/index.ts
var extension = {
  name: "compliance/ro/saft",
  category: "compliance",
  mountStrategy: "subapp",
  actions: saftActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
