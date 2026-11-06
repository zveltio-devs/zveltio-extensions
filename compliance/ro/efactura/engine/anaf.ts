// What talking to ANAF needs, with no runtime of its own: the actions (Bun) and
// the jobs (Deno, no permissions) both import it, so it uses nothing but the
// web platform.

/**
 * Three hosts, and the difference matters. `logincert.anaf.ro` is the identity
 * provider (authorize, token); `api.anaf.ro` takes the OAuth token (upload,
 * state, messages, download, the hello check); `webservicesp.anaf.ro` needs no
 * credentials and renders the official PDF. Every one is an `egress` entry of
 * the job that calls it, which the operator approves.
 */
export const ANAF_IDP = 'https://logincert.anaf.ro/anaf-oauth2/v1';
export const ANAF_PUBLIC = 'https://webservicesp.anaf.ro/prod/FCTEL/rest';
export const ANAF_HELLO = 'https://api.anaf.ro/TestOauth/jaxrs/hello?name=zveltio';
export const anafApi = (env: unknown) => `https://api.anaf.ro/${env === 'prod' ? 'prod' : 'test'}/FCTEL/rest`;

export const INVOICES = 'efactura_invoices';
export const FILES = 'efactura_files';
export const MESSAGES = 'efactura_messages';
export const SETTINGS = 'efactura_settings';

/** The filing CIF as ANAF's `cif` parameter wants it: digits, no `RO`. */
export const filingCif = (v: unknown) => String(v ?? '').trim().replace(/^RO/i, '');

/** One `attribute="value"` of ANAF's XML answers (upload, state). */
export function xmlAttr(xml: string, name: string): string | null {
  return new RegExp(`${name}\\s*=\\s*"([^"]+)"`, 'i').exec(xml)?.[1] ?? null;
}

/** Bytes as base64, for a binary answer kept in a text field. */
export function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromBase64(s: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

/** The authorize URL the browser is sent to; `state` comes back on the callback. */
export function authorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const url = new URL(`${ANAF_IDP}/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('token_content_type', 'jwt');
  url.searchParams.set('state', state);
  return url.toString();
}
