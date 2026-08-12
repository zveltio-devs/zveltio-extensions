/**
 * UBL 2.1 XML Invoice Generator for Romanian e-Factura (ANAF)
 * Compliant with RO_CIUS profile (EN 16931)
 */

export interface InvoiceLine {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;  // 0, 5, 9, 19
  vat_amount: number;
  line_total: number;
}

export interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  currency: string;

  seller_name: string;
  seller_cui: string;
  seller_reg_com?: string;
  seller_address?: string;
  seller_iban?: string;
  seller_bank?: string;

  buyer_name: string;
  buyer_cui?: string;
  buyer_address?: string;

  lines: InvoiceLine[];

  subtotal: number;
  vat_total: number;
  total: number;
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * `YYYY-MM-DD`, the only date form UBL accepts.
 *
 * This was `d.split('T')[0]`, typed as a string. Postgres hands `date` and
 * `timestamptz` columns back as JavaScript Date objects, which have no `split`,
 * so generating the XML for any invoice loaded out of the database threw
 * "d.split is not a function" and returned a 500.
 *
 * Nothing exercised this with a real row. The XML is a precondition for
 * submitting, and submitting was faked — it never read the XML it demanded — so
 * the generator only ever ran against the literal strings its tests handed it.
 */
function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).split('T')[0];
}

/**
 * The VAT identifier, prefixed with the country code exactly once.
 *
 * `PartyTaxScheme/CompanyID` must carry the VAT number in EU form — "RO" and
 * the digits. The template hardcoded `RO${cui}`, but a Romanian CUI is
 * routinely stored WITH its prefix already (it is how it appears on every
 * document and in every registry), so a company whose tax_id reads
 * "RO44556677" was sent to ANAF as "RORO44556677". Both parties, every
 * invoice.
 *
 * `PartyLegalEntity/CompanyID` is a different field — the registration
 * identifier, not the VAT one — which is why it is left as stored.
 */
function vatId(cui: string | null | undefined): string {
  const v = String(cui ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!v) return '';
  return /^RO/.test(v) ? v : `RO${v}`;
}


/**
 * A UN/ECE Recommendation 20 unit code, which is the only thing UBL accepts.
 *
 * ANAF's validator rejected this with BR-CL-23: the `unitCode` attribute must
 * come from a fixed code list, and the generator was passing through whatever
 * the invoice line said — "buc", "tona", "luna". Those are how a person writes
 * a unit, not how the standard encodes one, so every invoice failed on every
 * line.
 *
 * Romanian spellings map to their codes; anything already a valid-looking code
 * is passed through uppercased; anything unrecognised falls back to C62 (the
 * dimensionless "one"), which is what the standard offers for "a unit of
 * something we did not classify" and is preferable to emitting a value the
 * schema will refuse.
 */
const UNIT_CODES: Record<string, string> = {
  buc: 'H87', bucata: 'H87', bucati: 'H87', piece: 'H87', pcs: 'H87',
  kg: 'KGM', kilogram: 'KGM',
  g: 'GRM', gram: 'GRM',
  t: 'TNE', to: 'TNE', tona: 'TNE', tone: 'TNE', tonne: 'TNE',
  l: 'LTR', litru: 'LTR', litri: 'LTR', litre: 'LTR',
  ml: 'MLT',
  m: 'MTR', metru: 'MTR', metri: 'MTR',
  km: 'KMT',
  mp: 'MTK', m2: 'MTK',
  mc: 'MTQ', m3: 'MTQ',
  ora: 'HUR', ore: 'HUR', h: 'HUR', hour: 'HUR',
  zi: 'DAY', zile: 'DAY', day: 'DAY',
  luna: 'MON', luni: 'MON', month: 'MON',
  an: 'ANN', ani: 'ANN', year: 'ANN',
  set: 'SET', pereche: 'PR', cursa: 'C62', serviciu: 'C62',
};

function unitCode(unit: string | null | undefined): string {
  const raw = String(unit ?? '').trim();
  if (!raw) return 'C62';
  const mapped = UNIT_CODES[raw.toLowerCase().replace(/[.\s]/g, '')];
  if (mapped) return mapped;
  // Already a code (letters/digits, up to 3 chars) — trust it rather than
  // discard a caller who knows the list better than this table does.
  return /^[A-Z0-9]{1,3}$/i.test(raw) ? raw.toUpperCase() : 'C62';
}

/**
 * A postal address block, or nothing when there is no street to put in it.
 *
 * BR-08, BR-10, BR-RO-081/082 and BR-RO-091/092 all require the address and its
 * city, for BOTH parties. The generator emitted at most a StreetName and no
 * city, and only when an address happened to be present — so the element was
 * either absent or incomplete on every document.
 */
/**
 * The county as ISO 3166-2:RO, which is what BR-RO-110/111 demand.
 *
 * When the country is RO, ANAF requires the country subdivision to be a code —
 * "RO-B" for Bucharest, "RO-CJ" for Cluj — not the name people actually type
 * into a form. So the name is mapped, diacritics and all, and anything already
 * in code form passes through.
 *
 * An unmapped value is returned as-is rather than dropped: the validator will
 * then say plainly that the subdivision is wrong, which is a better failure
 * than an element quietly missing and a rule failing for a reason that does not
 * mention it.
 */
const COUNTY_CODES: Record<string, string> = {
  alba: 'AB', arad: 'AR', arges: 'AG', bacau: 'BC', bihor: 'BH',
  'bistrita-nasaud': 'BN', bistritanasaud: 'BN', botosani: 'BT', braila: 'BR',
  brasov: 'BV', bucuresti: 'B', 'municipiul bucuresti': 'B', buzau: 'BZ',
  calarasi: 'CL', 'caras-severin': 'CS', carasseverin: 'CS', cluj: 'CJ',
  constanta: 'CT', covasna: 'CV', dambovita: 'DB', dolj: 'DJ', galati: 'GL',
  giurgiu: 'GR', gorj: 'GJ', harghita: 'HR', hunedoara: 'HD', ialomita: 'IL',
  iasi: 'IS', ilfov: 'IF', maramures: 'MM', mehedinti: 'MH', mures: 'MS',
  neamt: 'NT', olt: 'OT', prahova: 'PH', salaj: 'SJ', 'satu mare': 'SM',
  satumare: 'SM', sibiu: 'SB', suceava: 'SV', teleorman: 'TR', timis: 'TM',
  tulcea: 'TL', valcea: 'VL', vaslui: 'VS', vrancea: 'VN',
};

function countySubdivision(county: string | null | undefined, country?: string): string {
  const raw = String(county ?? '').trim();
  if (!raw) return '';
  if (/^RO-[A-Z]{1,2}$/i.test(raw)) return raw.toUpperCase();
  if ((country || 'RO').toUpperCase() !== 'RO') return raw;
  const key = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0219/g, 's')
    .replace(/\u021b/g, 't')
    .trim();
  const code = COUNTY_CODES[key] ?? COUNTY_CODES[key.replace(/[\s-]/g, '')];
  return code ? `RO-${code}` : raw;
}

/**
 * The city as ANAF wants it, which for Bucharest is not a city name.
 *
 * BR-RO-100/101: when the subdivision is RO-B, the locality (BT-37 / BT-52)
 * must come from the SECTOR-RO code list — "SECTOR1" through "SECTOR6" — and
 * "Bucuresti" is rejected. People write "Sector 1", "sectorul 1", "S1", so
 * those are normalised here rather than turned into a rule somebody has to
 * remember while typing an address.
 *
 * A Bucharest address with no sector at all is left exactly as entered. Picking
 * a sector on someone's behalf would put a wrong address on a fiscal document;
 * letting the validator say "this must be a SECTOR code" is the honest outcome.
 */
function cityName(city: string | null | undefined, subdivision: string): string {
  const raw = String(city ?? '').trim();
  if (!raw || subdivision.toUpperCase() !== 'RO-B') return raw;
  const m = raw.match(/(?:sector(?:ul)?\s*|^s)\s*([1-6])$/i);
  return m ? `SECTOR${m[1]}` : raw;
}

function postalAddress(street?: string, city?: string, county?: string, country?: string): string {
  if (!street && !city) return '';
  const sub = countySubdivision(county, country);
  const locality = cityName(city, sub);
  return `<cac:PostalAddress>` +
    (street ? `<cbc:StreetName>${escapeXml(street)}</cbc:StreetName>` : '') +
    (locality ? `<cbc:CityName>${escapeXml(locality)}</cbc:CityName>` : '') +
    (sub ? `<cbc:CountrySubentity>${escapeXml(sub)}</cbc:CountrySubentity>` : '') +
    `<cac:Country><cbc:IdentificationCode>${escapeXml(country || 'RO')}</cbc:IdentificationCode></cac:Country>` +
    `</cac:PostalAddress>`;
}

export function generateUBLXML(invoice: InvoiceData): string {
  const lines = invoice.lines;

  // Group VAT by rate
  const vatGroups: Record<number, { taxable: number; vat: number }> = {};
  for (const line of lines) {
    if (!vatGroups[line.vat_rate]) vatGroups[line.vat_rate] = { taxable: 0, vat: 0 };
    vatGroups[line.vat_rate].taxable += line.line_total - line.vat_amount;
    vatGroups[line.vat_rate].vat += line.vat_amount;
  }

  const taxSubtotals = Object.entries(vatGroups)
    .map(([rate, amounts]) => `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${invoice.currency}">${amounts.taxable.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${invoice.currency}">${amounts.vat.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${Number(rate) === 0 ? 'Z' : 'S'}</cbc:ID>
          <cbc:Percent>${rate}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>`)
    .join('\n');

  const invoiceLines = lines.map((line, i) => `
    <cac:InvoiceLine>
      <cbc:ID>${i + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${unitCode(line.unit)}">${line.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${invoice.currency}">${(line.line_total - line.vat_amount).toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Description>${escapeXml(line.description)}</cbc:Description>
        <cbc:Name>${escapeXml(line.description)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>${line.vat_rate === 0 ? 'Z' : 'S'}</cbc:ID>
          <cbc:Percent>${line.vat_rate}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${invoice.currency}">${line.unit_price.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`).join('\n');

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
  ${invoice.due_date ? `<cbc:DueDate>${formatDate(invoice.due_date)}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoice.seller_name)}</cbc:Name>
      </cac:PartyName>
      ${postalAddress(invoice.seller_address, (invoice as any).seller_city, (invoice as any).seller_county, (invoice as any).seller_country)}
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(vatId(invoice.seller_cui))}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(invoice.seller_name)}</cbc:RegistrationName>
        <cbc:CompanyID>${escapeXml(invoice.seller_cui)}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      ${invoice.seller_iban ? `<cac:FinancialAccount><cbc:ID>${escapeXml(invoice.seller_iban)}</cbc:ID></cac:FinancialAccount>` : ''}
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoice.buyer_name)}</cbc:Name>
      </cac:PartyName>
      ${postalAddress(invoice.buyer_address, (invoice as any).buyer_city, (invoice as any).buyer_county, (invoice as any).buyer_country)}
      ${invoice.buyer_cui ? `<cac:PartyTaxScheme><cbc:CompanyID>${escapeXml(vatId(invoice.buyer_cui))}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(invoice.buyer_name)}</cbc:RegistrationName>
        ${invoice.buyer_cui ? `<cbc:CompanyID>${escapeXml(invoice.buyer_cui)}</cbc:CompanyID>` : ''}
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.currency}">${invoice.vat_total.toFixed(2)}</cbc:TaxAmount>
    ${taxSubtotals}
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.currency}">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.currency}">${invoice.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency}">${invoice.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.currency}">${invoice.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${invoiceLines}
</Invoice>`;
}
