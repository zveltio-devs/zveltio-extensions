// engine/anaf.ts
var ANAF_IDP = "https://logincert.anaf.ro/anaf-oauth2/v1";
var ANAF_PUBLIC = "https://webservicesp.anaf.ro/prod/FCTEL/rest";
var ANAF_HELLO = "https://api.anaf.ro/TestOauth/jaxrs/hello?name=zveltio";
var anafApi = (env) => `https://api.anaf.ro/${env === "prod" ? "prod" : "test"}/FCTEL/rest`;
var INVOICES = "efactura_invoices";
var FILES = "efactura_files";
var MESSAGES = "efactura_messages";
var SETTINGS = "efactura_settings";
var filingCif = (v) => String(v ?? "").trim().replace(/^RO/i, "");
function xmlAttr(xml, name) {
  return new RegExp(`${name}\\s*=\\s*"([^"]+)"`, "i").exec(xml)?.[1] ?? null;
}
function toBase64(bytes) {
  let s = "";
  for (let i = 0;i < bytes.length; i += 32768)
    s += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(s);
}

// engine/jobs.ts
class Settled extends Error {
}
function fetchOf(host) {
  if (!host.fetch)
    throw new Error("This engine runs jobs without fetch; e-Factura needs 3.0.0-beta.103 or later.");
  return host.fetch;
}
async function settingsOf(host) {
  const { records } = await host.collections.list(SETTINGS, { limit: 1, count: "none" });
  const s = records[0];
  if (!s)
    throw new Settled("e-Factura is not configured: save the ANAF connection first.");
  return s;
}
async function fileOf(host, invoiceId) {
  const { records } = await host.collections.list(FILES, { filter: { invoice_id: invoiceId }, limit: 1, count: "none" });
  return records[0] ?? null;
}
var fail = (host, s, msg) => host.collections.update(SETTINGS, s.id, { last_error: msg.slice(0, 1000) });
async function tokenRequest(host, s, params) {
  if (!s.client_id || !s.client_secret) {
    await fail(host, s, "The ANAF client id or secret is not saved.");
    throw new Settled("The ANAF client id or secret is not saved.");
  }
  const res = await fetchOf(host)(`${ANAF_IDP}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...params,
      client_id: String(s.client_id),
      client_secret: String(s.client_secret),
      token_content_type: "jwt"
    }).toString()
  });
  const text = await res.text();
  if (!res.ok) {
    const msg = `ANAF refused the token request (${res.status}): ${text.slice(0, 400)}`;
    await fail(host, s, msg);
    throw new Settled(msg);
  }
  const p = JSON.parse(text);
  if (!p.access_token)
    throw new Settled("ANAF answered the token request without an access token.");
  await host.collections.update(SETTINGS, s.id, {
    access_token: p.access_token,
    ...p.refresh_token ? { refresh_token: p.refresh_token } : {},
    token_expires_at: p.expires_in ? new Date(Date.now() + Number(p.expires_in) * 1000).toISOString() : null,
    last_error: null
  });
  return p.access_token;
}
async function bearer(host, s) {
  if (!s.access_token)
    throw new Settled("Not connected to ANAF: connect on the e-Factura connection tab first.");
  const expires = s.token_expires_at ? Date.parse(String(s.token_expires_at)) : Number.POSITIVE_INFINITY;
  if (expires - Date.now() > 5 * 60000)
    return String(s.access_token);
  if (!s.refresh_token)
    throw new Settled("The ANAF token has expired and there is no refresh token: connect again.");
  return tokenRequest(host, s, { grant_type: "refresh_token", refresh_token: String(s.refresh_token) });
}
var settled = (job) => async (input, host) => {
  try {
    await job(input, host);
  } catch (err) {
    if (!(err instanceof Settled))
      throw err;
    console.error(`[efactura] ${err.message}`);
  }
};
var connect = settled(async (input, host) => {
  const { settings_id, code } = input;
  const s = await host.collections.read(SETTINGS, settings_id);
  if (!s)
    throw new Settled("The settings row is gone.");
  let token;
  try {
    token = code ? await tokenRequest(host, s, { grant_type: "authorization_code", code, redirect_uri: String(s.callback_url ?? "") }) : await bearer(host, s);
  } catch (err) {
    if (err instanceof Settled)
      await fail(host, s, err.message);
    throw err;
  }
  const res = await fetchOf(host)(ANAF_HELLO, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  await host.collections.update(SETTINGS, s.id, res.ok ? { last_verified_at: new Date().toISOString(), last_error: null } : { last_error: `ANAF's hello check answered ${res.status}: ${text.slice(0, 300)}` });
});
var submit = settled(async (input, host) => {
  const { id } = input;
  const inv = await host.collections.read(INVOICES, id);
  if (!inv || inv.status !== "submitting")
    return;
  const expect = { status: ["submitting"] };
  const back = (anaf_response) => host.collections.update(INVOICES, id, { status: "xml_generated", anaf_response }, { expect });
  let s;
  let file;
  let cif;
  let token;
  try {
    file = await fileOf(host, id);
    if (!file?.xml)
      throw new Settled("No XML was generated for this invoice.");
    s = await settingsOf(host);
    cif = filingCif(s.seller_cif || inv.seller_cui);
    if (!cif)
      throw new Settled("No filing CIF is configured.");
    token = await bearer(host, s);
  } catch (err) {
    await back(err.message);
    throw err;
  }
  let status;
  let body;
  try {
    const res = await fetchOf(host)(`${anafApi(s.environment)}/upload?standard=UBL&cif=${encodeURIComponent(cif)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/xml" },
      body: String(file.xml)
    });
    status = res.status;
    body = await res.text();
  } catch (err) {
    await host.collections.update(INVOICES, id, {
      anaf_response: `Upload outcome unknown: ${err.message}. Check the ANAF message list before sending ` + "again: a second filing of the same invoice is corrected only by storno."
    }, { expect });
    return;
  }
  if (status < 200 || status >= 300) {
    return void await back(`ANAF refused the upload (HTTP ${status}): ${body.slice(0, 2000)}`);
  }
  const index = xmlAttr(body, "index_incarcare");
  if (!index) {
    await host.collections.update(INVOICES, id, { anaf_response: `Upload outcome unknown (no upload index in ANAF's answer): ${body.slice(0, 1800)}` }, { expect });
    return;
  }
  await host.collections.update(INVOICES, id, { status: "submitted", anaf_index: index, anaf_response: body.slice(0, 2000), submitted_at: new Date().toISOString() }, { expect });
});
var checkStatus = settled(async (input, host) => {
  const { id } = input;
  const inv = await host.collections.read(INVOICES, id);
  if (!inv?.anaf_index)
    return;
  const s = await settingsOf(host);
  const token = await bearer(host, s);
  const api = anafApi(s.environment);
  const res = await fetchOf(host)(`${api}/stareMesaj?id_incarcare=${encodeURIComponent(String(inv.anaf_index))}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await res.text();
  if (!res.ok)
    throw new Error(`ANAF's state query answered ${res.status}: ${text.slice(0, 300)}`);
  const stare = xmlAttr(text, "stare");
  const downloadId = xmlAttr(text, "id_descarcare");
  const final = stare === "ok" || stare === "nok";
  await host.collections.update(INVOICES, id, {
    anaf_state: stare ?? text.slice(0, 200),
    anaf_response: text.slice(0, 2000),
    ...downloadId ? { anaf_download_id: downloadId } : {},
    ...final && ["submitted", "accepted", "rejected"].includes(inv.status) ? { status: stare === "ok" ? "accepted" : "rejected" } : {}
  });
  if (!final || !downloadId)
    return;
  const archive = await download(host, api, token, downloadId);
  const file = await fileOf(host, id);
  if (file)
    await host.collections.update(FILES, file.id, { archive });
});
async function download(host, api, token, downloadId) {
  const res = await fetchOf(host)(`${api}/descarcare?id=${encodeURIComponent(downloadId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok)
    throw new Error(`ANAF refused the download (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return toBase64(new Uint8Array(await res.arrayBuffer()));
}
var renderPdf = settled(async (input, host) => {
  const { id } = input;
  const file = await fileOf(host, id);
  if (!file?.xml)
    throw new Settled("Generate the XML first.");
  const res = await fetchOf(host)(`${ANAF_PUBLIC}/transformare/FACT1`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: String(file.xml)
  });
  const bytes = new Uint8Array(await res.arrayBuffer());
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.includes("pdf")) {
    throw new Settled(`ANAF could not render the PDF (${res.status}): ${new TextDecoder().decode(bytes).slice(0, 300)}`);
  }
  await host.collections.update(FILES, file.id, { pdf: toBase64(bytes) });
});
var syncMessages = settled(async (input, host) => {
  const { days, filter } = input;
  const s = await settingsOf(host);
  const cif = filingCif(s.seller_cif);
  if (!cif)
    throw new Settled("No filing CIF is configured.");
  const token = await bearer(host, s);
  let url = `${anafApi(s.environment)}/listaMesajeFactura?zile=${days}&cif=${encodeURIComponent(cif)}`;
  if (filter)
    url += `&filtru=${filter}`;
  const res = await fetchOf(host)(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  if (!res.ok)
    throw new Error(`ANAF's message list answered ${res.status}: ${text.slice(0, 300)}`);
  const body = JSON.parse(text);
  if (body.eroare && !/nu exista mesaje/i.test(body.eroare))
    throw new Settled(`ANAF: ${body.eroare}`);
  const mesaje = (body.mesaje ?? []).filter((m) => m?.id);
  for (let i = 0;i < mesaje.length; i += 100) {
    const chunk = mesaje.slice(i, i + 100);
    const { records } = await host.collections.list(MESSAGES, {
      filter: { anaf_id: { in: chunk.map((m) => String(m.id)) } },
      limit: 100,
      count: "none"
    });
    const known = new Set(records.map((r) => r.anaf_id));
    for (const m of chunk) {
      if (known.has(String(m.id)))
        continue;
      await host.collections.insert(MESSAGES, {
        anaf_id: String(m.id),
        tip: m.tip ?? null,
        cif: m.cif ?? null,
        data_creare: m.data_creare ?? null,
        id_solicitare: m.id_solicitare ?? null,
        detalii: m.detalii ?? null
      });
    }
  }
});
var downloadMessage = settled(async (input, host) => {
  const { id } = input;
  const m = await host.collections.read(MESSAGES, id);
  if (!m)
    return;
  const s = await settingsOf(host);
  const token = await bearer(host, s);
  const archive = await download(host, anafApi(s.environment), token, String(m.anaf_id));
  await host.collections.update(MESSAGES, id, { archive, downloaded_at: new Date().toISOString() });
});
var jobs_default = { connect, submit, checkStatus, renderPdf, syncMessages, downloadMessage };
export {
  jobs_default as default
};
