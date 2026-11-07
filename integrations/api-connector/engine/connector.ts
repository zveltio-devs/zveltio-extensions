// Names and helpers the action, the jobs and the route share.

export const CONNECTIONS = 'connector_connections';
export const ENDPOINTS = 'connector_endpoints';
export const CALLS = 'connector_calls';
export const WEBHOOKS = 'connector_webhooks';
export const EVENTS = 'connector_webhook_events';

/** The egress slot the operator binds to the hosts tenants may call (ADR 0026). */
export const SLOT = 'api';

/** HMAC-SHA256 of `body` under `secret`, hex: the shape senders put in the header. */
export async function hmacHex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison: `===` returns at the first difference, which leaks how much of a forgery was right. */
export function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
