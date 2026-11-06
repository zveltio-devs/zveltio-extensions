// The ANAF calls. Each runs as a job in the engine's Deno runner (ADR 0022):
// no permissions, every request a message to the engine, which performs it only
// toward the authorities the job's manifest `egress` lists and the operator
// approved. Each collection call is its own transaction, so every write that
// moves an invoice's state names the state it expects (`expect`).

import type { ExtensionJob, JobHost } from '@zveltio/sdk/extension';
import {
  ANAF_HELLO,
  ANAF_IDP,
  ANAF_PUBLIC,
  FILES,
  INVOICES,
  MESSAGES,
  SETTINGS,
  anafApi,
  filingCif,
  toBase64,
  xmlAttr,
} from './anaf.js';

type Row = Record<string, any>;

/** A failure the job records and ends on: retrying it would get the same answer. */
class Settled extends Error {}

function fetchOf(host: JobHost): NonNullable<JobHost['fetch']> {
  if (!host.fetch) throw new Error('This engine runs jobs without fetch; e-Factura needs 3.0.0-beta.103 or later.');
  return host.fetch;
}

/** The job's tenant's settings row. A job reads its own tenant only. */
async function settingsOf(host: JobHost): Promise<Row> {
  const { records } = await host.collections.list(SETTINGS, { limit: 1, count: 'none' });
  const s = (records as Row[])[0];
  if (!s) throw new Settled('e-Factura is not configured: save the ANAF connection first.');
  return s;
}

async function fileOf(host: JobHost, invoiceId: string): Promise<Row | null> {
  const { records } = await host.collections.list(FILES, { filter: { invoice_id: invoiceId }, limit: 1, count: 'none' });
  return (records as Row[])[0] ?? null;
}

const fail = (host: JobHost, s: Row, msg: string) =>
  host.collections.update(SETTINGS, s.id, { last_error: msg.slice(0, 1000) });

/** POST to ANAF's token endpoint; the stored pair is replaced by the answer. */
async function tokenRequest(host: JobHost, s: Row, params: Record<string, string>): Promise<string> {
  if (!s.client_id || !s.client_secret) {
    await fail(host, s, 'The ANAF client id or secret is not saved.');
    throw new Settled('The ANAF client id or secret is not saved.');
  }
  const res = await fetchOf(host)(`${ANAF_IDP}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      ...params,
      client_id: String(s.client_id),
      client_secret: String(s.client_secret),
      token_content_type: 'jwt',
    }).toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    const msg = `ANAF refused the token request (${res.status}): ${text.slice(0, 400)}`;
    await fail(host, s, msg);
    throw new Settled(msg);
  }
  const p = JSON.parse(text) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!p.access_token) throw new Settled('ANAF answered the token request without an access token.');
  await host.collections.update(SETTINGS, s.id, {
    access_token: p.access_token,
    // ANAF may not rotate the refresh token: an absent one keeps the stored one.
    ...(p.refresh_token ? { refresh_token: p.refresh_token } : {}),
    token_expires_at: p.expires_in ? new Date(Date.now() + Number(p.expires_in) * 1000).toISOString() : null,
    last_error: null,
  });
  return p.access_token;
}

/** A token valid for the next five minutes, refreshed when it would not be. */
async function bearer(host: JobHost, s: Row): Promise<string> {
  if (!s.access_token) throw new Settled('Not connected to ANAF: connect on the e-Factura connection tab first.');
  const expires = s.token_expires_at ? Date.parse(String(s.token_expires_at)) : Number.POSITIVE_INFINITY;
  if (expires - Date.now() > 5 * 60_000) return String(s.access_token);
  if (!s.refresh_token) throw new Settled('The ANAF token has expired and there is no refresh token: connect again.');
  return tokenRequest(host, s, { grant_type: 'refresh_token', refresh_token: String(s.refresh_token) });
}

/** A job's run, with a `Settled` failure ending it as done: nothing to retry. */
const settled =
  (job: ExtensionJob): ExtensionJob =>
  async (input, host) => {
    try {
      await job(input, host);
    } catch (err) {
      if (!(err instanceof Settled)) throw err;
      console.error(`[efactura] ${err.message}`);
    }
  };

/**
 * Sign-in: trade the callback's code for a token pair, then call ANAF's hello
 * service, which proves the token (not that the application is enrolled for
 * e-Factura: only a real e-Factura call shows that). Without a code it only
 * checks (and refreshes) the stored token. Never retried: the code is single-use.
 */
const connect = settled(async (input, host) => {
  const { settings_id, code } = input as { settings_id: string; code?: string };
  const s = (await host.collections.read(SETTINGS, settings_id)) as Row | null;
  if (!s) throw new Settled('The settings row is gone.');
  let token: string;
  try {
    token = code
      ? await tokenRequest(host, s, { grant_type: 'authorization_code', code, redirect_uri: String(s.callback_url ?? '') })
      : await bearer(host, s);
  } catch (err) {
    if (err instanceof Settled) await fail(host, s, err.message);
    throw err;
  }
  const res = await fetchOf(host)(ANAF_HELLO, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  await host.collections.update(
    SETTINGS,
    s.id,
    res.ok
      ? { last_verified_at: new Date().toISOString(), last_error: null }
      : { last_error: `ANAF's hello check answered ${res.status}: ${text.slice(0, 300)}` },
  );
});

/**
 * The upload. The action moved the invoice to `submitting`; only this run moves
 * it on. The job is never retried (`retry.limit` 0): a run that dies after ANAF
 * took the file but before the answer was written would send it twice, and a
 * duplicate filing is corrected only by storno. A network failure leaves it
 * `submitting` — whether ANAF has it is unknown — for the message list to tell.
 */
const submit = settled(async (input, host) => {
  const { id } = input as { id: string };
  const inv = (await host.collections.read(INVOICES, id)) as Row | null;
  if (!inv || inv.status !== 'submitting') return;
  const expect = { status: ['submitting'] };
  const back = (anaf_response: string) =>
    host.collections.update(INVOICES, id, { status: 'xml_generated', anaf_response }, { expect });
  // Nothing has gone to ANAF yet: any failure here hands the invoice back.
  let s: Row;
  let file: Row | null;
  let cif: string;
  let token: string;
  try {
    file = await fileOf(host, id);
    if (!file?.xml) throw new Settled('No XML was generated for this invoice.');
    s = await settingsOf(host);
    cif = filingCif(s.seller_cif || inv.seller_cui);
    if (!cif) throw new Settled('No filing CIF is configured.');
    token = await bearer(host, s);
  } catch (err) {
    await back((err as Error).message);
    throw err;
  }
  let status: number;
  let body: string;
  try {
    const res = await fetchOf(host)(`${anafApi(s.environment)}/upload?standard=UBL&cif=${encodeURIComponent(cif)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/xml' },
      body: String(file!.xml),
    });
    status = res.status;
    body = await res.text();
  } catch (err) {
    await host.collections.update(
      INVOICES,
      id,
      {
        anaf_response:
          `Upload outcome unknown: ${(err as Error).message}. Check the ANAF message list before sending ` +
          'again: a second filing of the same invoice is corrected only by storno.',
      },
      { expect },
    );
    return;
  }
  if (status < 200 || status >= 300) {
    return void (await back(`ANAF refused the upload (HTTP ${status}): ${body.slice(0, 2000)}`));
  }
  const index = xmlAttr(body, 'index_incarcare');
  if (!index) {
    // A 2xx without an index is not a refusal anyone can be sure of: left as unknown.
    await host.collections.update(
      INVOICES,
      id,
      { anaf_response: `Upload outcome unknown (no upload index in ANAF's answer): ${body.slice(0, 1800)}` },
      { expect },
    );
    return;
  }
  await host.collections.update(
    INVOICES,
    id,
    { status: 'submitted', anaf_index: index, anaf_response: body.slice(0, 2000), submitted_at: new Date().toISOString() },
    { expect },
  );
});

/**
 * ANAF's verdict on an upload: `ok` (validated, delivered to the buyer) or `nok`
 * (refused, NOT delivered), with the signed answer archive downloaded into the
 * invoice's file row. Anything else (`in prelucrare`) is recorded as it is.
 */
const checkStatus = settled(async (input, host) => {
  const { id } = input as { id: string };
  const inv = (await host.collections.read(INVOICES, id)) as Row | null;
  if (!inv?.anaf_index) return;
  const s = await settingsOf(host);
  const token = await bearer(host, s);
  const api = anafApi(s.environment);
  const res = await fetchOf(host)(`${api}/stareMesaj?id_incarcare=${encodeURIComponent(String(inv.anaf_index))}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ANAF's state query answered ${res.status}: ${text.slice(0, 300)}`);
  const stare = xmlAttr(text, 'stare');
  const downloadId = xmlAttr(text, 'id_descarcare');
  const final = stare === 'ok' || stare === 'nok';
  await host.collections.update(INVOICES, id, {
    anaf_state: stare ?? text.slice(0, 200),
    anaf_response: text.slice(0, 2000),
    ...(downloadId ? { anaf_download_id: downloadId } : {}),
    ...(final && ['submitted', 'accepted', 'rejected'].includes(inv.status)
      ? { status: stare === 'ok' ? 'accepted' : 'rejected' }
      : {}),
  });
  if (!final || !downloadId) return;
  const archive = await download(host, api, token, downloadId);
  const file = await fileOf(host, id);
  if (file) await host.collections.update(FILES, file.id, { archive });
});

async function download(host: JobHost, api: string, token: string, downloadId: string): Promise<string> {
  const res = await fetchOf(host)(`${api}/descarcare?id=${encodeURIComponent(downloadId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`ANAF refused the download (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return toBase64(new Uint8Array(await res.arrayBuffer()));
}

/** ANAF's own PDF rendering of the XML (a public service, no token). */
const renderPdf = settled(async (input, host) => {
  const { id } = input as { id: string };
  const file = await fileOf(host, id);
  if (!file?.xml) throw new Settled('Generate the XML first.');
  const res = await fetchOf(host)(`${ANAF_PUBLIC}/transformare/FACT1`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: String(file.xml),
  });
  const bytes = new Uint8Array(await res.arrayBuffer());
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || !type.includes('pdf')) {
    throw new Settled(`ANAF could not render the PDF (${res.status}): ${new TextDecoder().decode(bytes).slice(0, 300)}`);
  }
  await host.collections.update(FILES, file.id, { pdf: toBase64(bytes) });
});

/**
 * ANAF's message list for the filing CIF: answers to uploads (`FACTURA
 * TRIMISA`, `ERORI FACTURA`) and invoices received from suppliers (`FACTURA
 * PRIMITA`). New messages become rows; one already listed is left as it is.
 */
const syncMessages = settled(async (input, host) => {
  const { days, filter } = input as { days: number; filter?: string };
  const s = await settingsOf(host);
  const cif = filingCif(s.seller_cif);
  if (!cif) throw new Settled('No filing CIF is configured.');
  const token = await bearer(host, s);
  let url = `${anafApi(s.environment)}/listaMesajeFactura?zile=${days}&cif=${encodeURIComponent(cif)}`;
  if (filter) url += `&filtru=${filter}`;
  const res = await fetchOf(host)(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`ANAF's message list answered ${res.status}: ${text.slice(0, 300)}`);
  const body = JSON.parse(text) as { mesaje?: Row[]; eroare?: string };
  // "Nu exista mesaje in ultimele N zile" arrives as an error; it is an empty list.
  if (body.eroare && !/nu exista mesaje/i.test(body.eroare)) throw new Settled(`ANAF: ${body.eroare}`);
  const mesaje = (body.mesaje ?? []).filter((m) => m?.id);
  for (let i = 0; i < mesaje.length; i += 100) {
    const chunk = mesaje.slice(i, i + 100);
    const { records } = await host.collections.list(MESSAGES, {
      filter: { anaf_id: { in: chunk.map((m) => String(m.id)) } },
      limit: 100,
      count: 'none',
    });
    const known = new Set((records as Row[]).map((r) => r.anaf_id));
    for (const m of chunk) {
      if (known.has(String(m.id))) continue;
      await host.collections.insert(MESSAGES, {
        anaf_id: String(m.id),
        tip: m.tip ?? null,
        cif: m.cif ?? null,
        data_creare: m.data_creare ?? null,
        id_solicitare: m.id_solicitare ?? null,
        detalii: m.detalii ?? null,
      });
    }
  }
});

/** One message's archive (the signed XML and ANAF's signature), into its row. */
const downloadMessage = settled(async (input, host) => {
  const { id } = input as { id: string };
  const m = (await host.collections.read(MESSAGES, id)) as Row | null;
  if (!m) return;
  const s = await settingsOf(host);
  const token = await bearer(host, s);
  const archive = await download(host, anafApi(s.environment), token, String(m.anaf_id));
  await host.collections.update(MESSAGES, id, { archive, downloaded_at: new Date().toISOString() });
});

export default { connect, submit, checkStatus, renderPdf, syncMessages, downloadMessage };
