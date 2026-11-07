// Names and helpers the actions, the jobs and the routes share.

export const SETTINGS = 'sms_settings';
export const TEMPLATES = 'sms_templates';
export const MESSAGES = 'sms_messages';

export const TWILIO_API = 'https://api.twilio.com/2010-04-01';
export const VONAGE_API = 'https://rest.nexmo.com/sms/json';

/** `{{name}}` placeholders from `variables`; an unknown one becomes empty. */
export function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '');
}

/**
 * Twilio's webhook signature: base64 HMAC-SHA1 of the URL it requested followed
 * by every POST parameter as key+value, sorted by key, under the auth token.
 */
export async function twilioSignature(authToken: string, url: string, params: [string, string][]): Promise<string> {
  const sorted = [...params].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const payload = url + sorted.map(([k, v]) => k + v).join('');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, [
    'sign',
  ]);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
  return btoa(String.fromCharCode(...mac));
}
