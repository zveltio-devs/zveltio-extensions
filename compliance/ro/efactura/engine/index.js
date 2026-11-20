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
// engine/anaf.ts
var ANAF_IDP = "https://logincert.anaf.ro/anaf-oauth2/v1";
var INVOICES = "efactura_invoices";
var FILES = "efactura_files";
var MESSAGES = "efactura_messages";
var SETTINGS = "efactura_settings";
function fromBase64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
function authorizeUrl(clientId, redirectUri, state) {
  const url = new URL(`${ANAF_IDP}/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("token_content_type", "jwt");
  url.searchParams.set("state", state);
  return url.toString();
}

// engine/ubl-generator.ts
function escapeXml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function formatDate(d) {
  if (!d)
    return "";
  if (d instanceof Date)
    return d.toISOString().slice(0, 10);
  return String(d).split("T")[0];
}
function vatId(cui) {
  const v = String(cui ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!v)
    return "";
  return /^RO/.test(v) ? v : `RO${v}`;
}
var UNIT_CODES = {
  buc: "H87",
  bucata: "H87",
  bucati: "H87",
  piece: "H87",
  pcs: "H87",
  kg: "KGM",
  kilogram: "KGM",
  g: "GRM",
  gram: "GRM",
  t: "TNE",
  to: "TNE",
  tona: "TNE",
  tone: "TNE",
  tonne: "TNE",
  l: "LTR",
  litru: "LTR",
  litri: "LTR",
  litre: "LTR",
  ml: "MLT",
  m: "MTR",
  metru: "MTR",
  metri: "MTR",
  km: "KMT",
  mp: "MTK",
  m2: "MTK",
  mc: "MTQ",
  m3: "MTQ",
  ora: "HUR",
  ore: "HUR",
  h: "HUR",
  hour: "HUR",
  zi: "DAY",
  zile: "DAY",
  day: "DAY",
  luna: "MON",
  luni: "MON",
  month: "MON",
  an: "ANN",
  ani: "ANN",
  year: "ANN",
  set: "SET",
  pereche: "PR",
  cursa: "C62",
  serviciu: "C62"
};
function unitCode(unit) {
  const raw = String(unit ?? "").trim();
  if (!raw)
    return "C62";
  const mapped = UNIT_CODES[raw.toLowerCase().replace(/[.\s]/g, "")];
  if (mapped)
    return mapped;
  return /^[A-Z0-9]{1,3}$/i.test(raw) ? raw.toUpperCase() : "C62";
}
var COUNTY_CODES = {
  alba: "AB",
  arad: "AR",
  arges: "AG",
  bacau: "BC",
  bihor: "BH",
  "bistrita-nasaud": "BN",
  bistritanasaud: "BN",
  botosani: "BT",
  braila: "BR",
  brasov: "BV",
  bucuresti: "B",
  "municipiul bucuresti": "B",
  buzau: "BZ",
  calarasi: "CL",
  "caras-severin": "CS",
  carasseverin: "CS",
  cluj: "CJ",
  constanta: "CT",
  covasna: "CV",
  dambovita: "DB",
  dolj: "DJ",
  galati: "GL",
  giurgiu: "GR",
  gorj: "GJ",
  harghita: "HR",
  hunedoara: "HD",
  ialomita: "IL",
  iasi: "IS",
  ilfov: "IF",
  maramures: "MM",
  mehedinti: "MH",
  mures: "MS",
  neamt: "NT",
  olt: "OT",
  prahova: "PH",
  salaj: "SJ",
  "satu mare": "SM",
  satumare: "SM",
  sibiu: "SB",
  suceava: "SV",
  teleorman: "TR",
  timis: "TM",
  tulcea: "TL",
  valcea: "VL",
  vaslui: "VS",
  vrancea: "VN"
};
function countySubdivision(county, country) {
  const raw = String(county ?? "").trim();
  if (!raw)
    return "";
  if (/^RO-[A-Z]{1,2}$/i.test(raw))
    return raw.toUpperCase();
  if ((country || "RO").toUpperCase() !== "RO")
    return raw;
  const key = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0219/g, "s").replace(/\u021b/g, "t").trim();
  const code = COUNTY_CODES[key] ?? COUNTY_CODES[key.replace(/[\s-]/g, "")];
  return code ? `RO-${code}` : raw;
}
function cityName(city, subdivision) {
  const raw = String(city ?? "").trim();
  if (!raw || subdivision.toUpperCase() !== "RO-B")
    return raw;
  const m = raw.match(/(?:sector(?:ul)?\s*|^s)\s*([1-6])$/i);
  return m ? `SECTOR${m[1]}` : raw;
}
function postalAddress(street, city, county, country) {
  if (!street && !city)
    return "";
  const sub = countySubdivision(county, country);
  const locality = cityName(city, sub);
  return `<cac:PostalAddress>` + (street ? `<cbc:StreetName>${escapeXml(street)}</cbc:StreetName>` : "") + (locality ? `<cbc:CityName>${escapeXml(locality)}</cbc:CityName>` : "") + (sub ? `<cbc:CountrySubentity>${escapeXml(sub)}</cbc:CountrySubentity>` : "") + `<cac:Country><cbc:IdentificationCode>${escapeXml(country || "RO")}</cbc:IdentificationCode></cac:Country>` + `</cac:PostalAddress>`;
}
function generateUBLXML(invoice) {
  const lines = invoice.lines;
  const currency = escapeXml(invoice.currency);
  const vatGroups = {};
  for (const line of lines) {
    if (!vatGroups[line.vat_rate])
      vatGroups[line.vat_rate] = { taxable: 0, vat: 0 };
    vatGroups[line.vat_rate].taxable += line.line_total - line.vat_amount;
    vatGroups[line.vat_rate].vat += line.vat_amount;
  }
  const taxSubtotals = Object.entries(vatGroups).map(([rate, amounts]) => `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${currency}">${amounts.taxable.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${currency}">${amounts.vat.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${Number(rate) === 0 ? "Z" : "S"}</cbc:ID>
          <cbc:Percent>${rate}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>`).join(`
`);
  const invoiceLines = lines.map((line, i) => `
    <cac:InvoiceLine>
      <cbc:ID>${i + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${unitCode(line.unit)}">${line.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${currency}">${(line.line_total - line.vat_amount).toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Description>${escapeXml(line.description)}</cbc:Description>
        <cbc:Name>${escapeXml(line.description)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>${line.vat_rate === 0 ? "Z" : "S"}</cbc:ID>
          <cbc:Percent>${line.vat_rate}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${currency}">${line.unit_price.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`).join(`
`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice
  xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">

  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoice.invoice_number)}</cbc:ID>
  <cbc:IssueDate>${formatDate(invoice.invoice_date)}</cbc:IssueDate>
  ${invoice.due_date ? `<cbc:DueDate>${formatDate(invoice.due_date)}</cbc:DueDate>` : ""}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoice.seller_name)}</cbc:Name>
      </cac:PartyName>
      ${postalAddress(invoice.seller_address, invoice.seller_city, invoice.seller_county, invoice.seller_country)}
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(vatId(invoice.seller_cui))}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(invoice.seller_name)}</cbc:RegistrationName>
        <cbc:CompanyID>${escapeXml(invoice.seller_cui)}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      ${invoice.seller_iban ? `<cac:FinancialAccount><cbc:ID>${escapeXml(invoice.seller_iban)}</cbc:ID></cac:FinancialAccount>` : ""}
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoice.buyer_name)}</cbc:Name>
      </cac:PartyName>
      ${postalAddress(invoice.buyer_address, invoice.buyer_city, invoice.buyer_county, invoice.buyer_country)}
      ${invoice.buyer_cui ? `<cac:PartyTaxScheme><cbc:CompanyID>${escapeXml(vatId(invoice.buyer_cui))}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ""}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(invoice.buyer_name)}</cbc:RegistrationName>
        ${invoice.buyer_cui ? `<cbc:CompanyID>${escapeXml(invoice.buyer_cui)}</cbc:CompanyID>` : ""}
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${invoice.vat_total.toFixed(2)}</cbc:TaxAmount>
    ${taxSubtotals}
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${invoice.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${invoice.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${invoice.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${invoiceLines}
</Invoice>`;
}

// engine/actions.ts
var num = (v) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
var day = (v) => String(v ?? "").slice(0, 10);
var opt = (v) => v === null || v === undefined || v === "" ? undefined : String(v);
async function invoice(host, id) {
  const inv = await host.collections.read(INVOICES, id);
  if (!inv)
    throw new ActionRefusal(404, "invoice_not_found", "No such e-Factura invoice.");
  return inv;
}
async function fileOf(host, invoiceId) {
  const { records } = await host.collections.list(FILES, { filter: { invoice_id: invoiceId }, limit: 1, count: "none" });
  return records[0] ?? null;
}
function lines(inv) {
  const raw = inv.lines;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ActionRefusal(422, "no_lines", "An invoice needs at least one line.");
  }
  return raw.map((l, i) => {
    if (!l || typeof l !== "object" || !String(l.description ?? "").trim()) {
      throw new ActionRefusal(422, "line_invalid", `Line ${i + 1} has no description.`);
    }
    return {
      description: String(l.description),
      quantity: num(l.quantity),
      unit: String(l.unit || "H87"),
      unit_price: num(l.unit_price),
      vat_rate: num(l.vat_rate),
      vat_amount: num(l.vat_amount),
      line_total: num(l.line_total)
    };
  });
}
function toInvoiceData(inv) {
  return {
    invoice_number: String(inv.invoice_number),
    invoice_date: day(inv.invoice_date),
    due_date: inv.due_date ? day(inv.due_date) : undefined,
    currency: String(inv.currency || "RON"),
    seller_name: String(inv.seller_name),
    seller_cui: String(inv.seller_cui),
    seller_reg_com: opt(inv.seller_reg_com),
    seller_address: opt(inv.seller_address),
    seller_city: opt(inv.seller_city),
    seller_county: opt(inv.seller_county),
    seller_country: opt(inv.seller_country),
    seller_iban: opt(inv.seller_iban),
    seller_bank: opt(inv.seller_bank),
    buyer_name: String(inv.buyer_name),
    buyer_cui: opt(inv.buyer_cui),
    buyer_address: opt(inv.buyer_address),
    buyer_city: opt(inv.buyer_city),
    buyer_county: opt(inv.buyer_county),
    buyer_country: opt(inv.buyer_country),
    lines: lines(inv),
    subtotal: num(inv.subtotal),
    vat_total: num(inv.vat_total),
    total: num(inv.total)
  };
}
var EDITABLE = ["draft", "xml_generated", "rejected"];
var generateXml = async (input, host) => {
  const { id } = input;
  const inv = await invoice(host, id);
  if (!EDITABLE.includes(inv.status)) {
    throw new ActionRefusal(409, "already_submitted", "This invoice went to ANAF; its XML is the one filed.");
  }
  const xml = generateUBLXML(toInvoiceData(inv));
  const file = await fileOf(host, id);
  if (file)
    await host.collections.update(FILES, file.id, { xml, pdf: null });
  else
    await host.collections.insert(FILES, { invoice_id: id, xml });
  return host.collections.update(INVOICES, id, { status: "xml_generated" }, { expect: { status: EDITABLE } });
};
var submit = async (input, host) => {
  const { id } = input;
  const inv = await invoice(host, id);
  if (inv.status !== "xml_generated") {
    throw new ActionRefusal(409, "not_ready", "Generate the XML first; an invoice is sent once.");
  }
  const file = await fileOf(host, id);
  if (!file?.xml || file.xml !== generateUBLXML(toInvoiceData(inv))) {
    throw new ActionRefusal(409, "changed_since_xml", "The invoice changed since its XML was generated; generate it again.");
  }
  const claimed = await host.collections.update(INVOICES, id, { status: "submitting", anaf_response: null }, { expect: { status: ["xml_generated"] } });
  await host.enqueue("submit", { id });
  return claimed;
};
var checkStatus = async (input, host) => {
  const { id } = input;
  const inv = await invoice(host, id);
  if (!inv.anaf_index)
    throw new ActionRefusal(409, "not_submitted", "This invoice has no ANAF upload index.");
  return { job: await host.enqueue("checkStatus", { id }) };
};
var renderPdf = async (input, host) => {
  const { id } = input;
  await invoice(host, id);
  if (!(await fileOf(host, id))?.xml)
    throw new ActionRefusal(409, "no_xml", "Generate the XML first.");
  return { job: await host.enqueue("renderPdf", { id }) };
};
var storno = async (input, host) => {
  const { id, reason } = input;
  const o = await invoice(host, id);
  if (!["submitted", "accepted"].includes(o.status)) {
    throw new ActionRefusal(409, "not_filed", "Only a submitted or accepted invoice is reversed by storno.");
  }
  const { records } = await host.collections.list(INVOICES, { filter: { storno_of: id }, limit: 1, count: "none" });
  if (records.length)
    throw new ActionRefusal(409, "storno_exists", "This invoice already has a storno.");
  const keep = [
    "currency",
    "seller_name",
    "seller_cui",
    "seller_reg_com",
    "seller_address",
    "seller_city",
    "seller_county",
    "seller_country",
    "seller_iban",
    "seller_bank",
    "buyer_name",
    "buyer_cui",
    "buyer_address",
    "buyer_city",
    "buyer_county",
    "buyer_country"
  ];
  return host.collections.insert(INVOICES, {
    ...Object.fromEntries(keep.map((k) => [k, o[k]])),
    invoice_number: `STORNO-${o.invoice_number}`,
    invoice_date: new Date().toLocaleDateString("sv-SE", { timeZone: host.timezone }),
    lines: lines(o).map((l) => ({
      ...l,
      quantity: -l.quantity,
      vat_amount: -l.vat_amount,
      line_total: -l.line_total
    })),
    subtotal: -num(o.subtotal),
    vat_total: -num(o.vat_total),
    total: -num(o.total),
    storno_of: id,
    storno_reason: reason
  });
};
var fromInvoice = async (input, host) => {
  const { invoice_id } = input;
  const done = await host.collections.list(INVOICES, {
    filter: { source_invoice_id: invoice_id },
    limit: 1,
    count: "none"
  });
  if (done.records[0])
    return done.records[0];
  let src;
  try {
    src = await host.collections.read("invoices", invoice_id);
  } catch (err) {
    if (err.status === 404) {
      throw new ActionRefusal(404, "invoicing_not_installed", "finance/invoicing is not installed.");
    }
    throw err;
  }
  if (!src)
    throw new ActionRefusal(404, "invoice_not_found", "No such invoice.");
  if (!src.number)
    throw new ActionRefusal(409, "invoice_not_issued", "A draft invoice has no number yet; send it first.");
  if (src.status === "cancelled")
    throw new ActionRefusal(409, "invoice_cancelled", "This invoice is cancelled.");
  if (src.doc_type && src.doc_type !== "invoice") {
    throw new ActionRefusal(409, "not_a_tax_invoice", "Only an invoice is filed with ANAF, not a proforma or a delivery note.");
  }
  if ((src.vat_regime ?? "standard") !== "standard" || num(src.discount_percent) || num(src.discount_amount)) {
    throw new ActionRefusal(422, "not_mapped", "Invoices with a special VAT regime or a discount are not drafted automatically yet; enter this one by hand.");
  }
  if ((src.currency || "RON") !== "RON") {
    throw new ActionRefusal(422, "not_mapped", "Only RON invoices are drafted automatically yet.");
  }
  const ls = [];
  for (let page = 1;; page++) {
    const res = await host.collections.list("invoice_lines", {
      filter: { invoice_id },
      sort: "sort_order",
      limit: 500,
      page,
      count: "none"
    });
    ls.push(...res.records);
    if (res.records.length < 500)
      break;
  }
  return host.collections.insert(INVOICES, {
    source_invoice_id: invoice_id,
    invoice_number: String(src.number),
    invoice_date: day(src.issue_date),
    due_date: src.due_date ? day(src.due_date) : null,
    currency: src.currency || "RON",
    seller_name: src.seller_name,
    seller_cui: src.seller_tax_id,
    seller_reg_com: src.seller_reg_no ?? null,
    seller_address: src.seller_address ?? null,
    seller_city: src.seller_city ?? null,
    seller_county: src.seller_county ?? null,
    seller_country: src.seller_country || "RO",
    seller_iban: src.seller_iban ?? null,
    seller_bank: src.seller_bank ?? null,
    buyer_name: src.client_name,
    buyer_cui: src.client_tax_id ?? null,
    buyer_address: src.client_address ?? null,
    buyer_city: src.client_city ?? null,
    buyer_county: src.client_county ?? null,
    buyer_country: src.client_country || "RO",
    lines: ls.map((l) => {
      const net = num(l.unit_price) * num(l.quantity);
      return {
        description: l.description,
        quantity: num(l.quantity),
        unit: l.unit || "H87",
        unit_price: num(l.unit_price),
        vat_rate: num(l.tax_rate),
        vat_amount: Math.round((num(l.total) - net) * 100) / 100,
        line_total: num(l.total)
      };
    }),
    subtotal: num(src.subtotal),
    vat_total: num(src.tax_amount),
    total: num(src.total)
  });
};
var verify = async (input, host) => {
  const { id } = input;
  if (!await host.collections.read(SETTINGS, id))
    throw new ActionRefusal(404, "settings_not_found", "No such settings row.");
  return { job: await host.enqueue("connect", { settings_id: id }) };
};
var STATE_TTL_MS = 10 * 60000;
function sameText(a, b) {
  if (a.length !== b.length)
    return false;
  let d = 0;
  for (let i = 0;i < a.length; i++)
    d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
var startSignIn = async (input, host) => {
  const { id } = input;
  const s = await host.collections.read(SETTINGS, id);
  if (!s)
    throw new ActionRefusal(404, "settings_not_found", "No such settings row.");
  if (!s.client_id || !s.callback_url) {
    throw new ActionRefusal(422, "not_configured", "Save the ANAF client id, secret and callback URL first.");
  }
  const state = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
  const written = await host.collections.update(SETTINGS, id, {
    oauth_state: state,
    oauth_state_expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString(),
    oauth_started_by: null
  });
  await host.collections.update(SETTINGS, id, { oauth_started_by: written.updated_by });
  return { redirect: authorizeUrl(String(s.client_id), String(s.callback_url), state) };
};
var finishSignIn = async (input, host) => {
  const { id, code, state } = input;
  const s = await host.collections.read(SETTINGS, id);
  const live = s?.oauth_state_expires_at && Date.parse(String(s.oauth_state_expires_at)) > Date.now();
  const startedBy = s?.oauth_started_by;
  if (!s || !live || typeof startedBy !== "string" || typeof s.oauth_state !== "string" || !sameText(s.oauth_state, state)) {
    throw new ActionRefusal(409, "sign_in_unknown", "This sign-in was not started here, or it expired. Start it again.");
  }
  const spent = await host.collections.update(SETTINGS, id, { oauth_state: null, oauth_state_expires_at: null, oauth_started_by: null }, { expect: { oauth_started_by: [startedBy] } });
  if (spent.updated_by !== startedBy) {
    throw new ActionRefusal(409, "sign_in_not_yours", "This sign-in was started by someone else. Start your own.");
  }
  return { job: await host.enqueue("connect", { settings_id: id, code }) };
};
var syncMessages = async (input, host) => {
  const { days = 30, filter } = input;
  return { job: await host.enqueue("syncMessages", filter ? { days, filter } : { days }) };
};
var downloadMessage = async (input, host) => {
  const { id } = input;
  if (!await host.collections.read(MESSAGES, id))
    throw new ActionRefusal(404, "message_not_found", "No such message.");
  return { job: await host.enqueue("downloadMessage", { id }) };
};
var round2 = (n) => Math.round(n * 100) / 100;
var createInvoice = async (input, host) => {
  const { lines: typed, ...head } = input;
  const ls = typed.map((l) => {
    const quantity = num(l.quantity ?? 1);
    const vat_rate = num(l.vat_rate);
    const net = round2(quantity * num(l.unit_price));
    const vat_amount = round2(net * vat_rate / 100);
    return {
      description: String(l.description),
      quantity,
      unit: String(l.unit || "H87"),
      unit_price: num(l.unit_price),
      vat_rate,
      vat_amount,
      line_total: round2(net + vat_amount)
    };
  });
  const vat_total = round2(ls.reduce((s, l) => s + l.vat_amount, 0));
  const total = round2(ls.reduce((s, l) => s + l.line_total, 0));
  return host.collections.insert(INVOICES, { ...head, lines: ls, subtotal: round2(total - vat_total), vat_total, total });
};
var deleteDraft = async (input, host) => {
  const { id } = input;
  const inv = await invoice(host, id);
  if (inv.status !== "draft")
    throw new ActionRefusal(409, "not_draft", "Only a draft is deleted; a filed invoice is corrected by a storno.");
  await host.collections.update(INVOICES, id, { status: "draft" }, { expect: { status: ["draft"] } });
  await host.collections.delete(INVOICES, id);
  return { deleted: id };
};
var DOCUMENTS = {
  xml: { field: "xml", type: "application/xml", missing: "Generate the XML first." },
  pdf: { field: "pdf", type: "application/pdf", missing: "Render the PDF first." },
  archive: { field: "archive", type: "application/zip", missing: "ANAF's answer is not downloaded yet." }
};
var download = async (input, host) => {
  const { id, document } = input;
  const doc = DOCUMENTS[document];
  if (!host.files)
    throw new Error("This engine gives actions no host.files.");
  const value = (await fileOf(host, id))?.[doc.field];
  if (typeof value !== "string" || value === "")
    throw new ActionRefusal(404, "not_stored", doc.missing);
  const bytes = document === "xml" ? new TextEncoder().encode(value) : fromBase64(value);
  return { file: (await host.files.put(bytes, { contentType: doc.type })).id };
};
var messageArchive = async (input, host) => {
  const { id } = input;
  if (!host.files)
    throw new Error("This engine gives actions no host.files.");
  const m = await host.collections.read(MESSAGES, id);
  if (!m)
    throw new ActionRefusal(404, "message_not_found", "No such message.");
  if (typeof m.archive !== "string" || m.archive === "") {
    throw new ActionRefusal(404, "not_stored", "Fetch the archive from ANAF first.");
  }
  return { file: (await host.files.put(fromBase64(m.archive), { contentType: "application/zip" })).id };
};
var efacturaActions = {
  createInvoice,
  deleteDraft,
  download,
  messageArchive,
  generateXml,
  submit,
  checkStatus,
  renderPdf,
  storno,
  fromInvoice,
  verify,
  startSignIn,
  finishSignIn,
  syncMessages,
  downloadMessage
};

// engine/routes.ts
var FINISH_PAGE = "/admin/compliance/ro/efactura/connection";
var oauthCallback = async (request) => {
  const query = new URL(request.url).searchParams;
  const refused = query.get("error");
  if (refused) {
    return new Response(`ANAF refused the sign-in: ${refused.slice(0, 200)}`, {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=UTF-8" }
    });
  }
  const next = new URL(FINISH_PAGE, request.url);
  for (const k of ["code", "state"]) {
    const v = query.get(k);
    if (v)
      next.searchParams.set(k, v);
  }
  return new Response(null, { status: 302, headers: { Location: next.toString(), "Cache-Control": "no-store" } });
};

// engine/index.ts
var extension = {
  name: "compliance/ro/efactura",
  category: "compliance",
  mountStrategy: "subapp",
  actions: efacturaActions,
  routes: { oauthCallback },
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
