/**
 * SSRF guard for admin-configured provider endpoints.
 *
 * Deliberately NOT the engine's `validatePublicUrl`/`assertPublicUrl`: those
 * reject private ranges, and a provider base URL is legitimately private —
 * Ollama's own default is `http://localhost:11434`, and a self-hosted
 * OpenAI-compatible gateway usually sits on 10.x. Applying the public-URL guard
 * here would break every documented self-hosted setup.
 *
 * What is never legitimate is a cloud-metadata address: those hand out instance
 * credentials, so pointing a provider at 169.254.169.254 turns a config field
 * into credential exfiltration. In a multi-tenant install the provider config is
 * reachable by a *tenant* admin, who is not otherwise trusted with the host's
 * cloud identity — which is what makes this worth guarding rather than filing
 * under "admins can already do anything".
 *
 * Mirrors METADATA_PATTERNS in the engine's lib/security/url-validator.ts. Kept
 * local (rather than imported through ctx.internals) so the extension does not
 * couple to an engine version, and so it can run in plain constructor/factory
 * code that never sees the extension context.
 */

function intToIPv4(n: number): string {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.');
}

/** Normalize alternative IP encodings so the blocklist can't be walked around. */
function normalizeHost(host: string): string {
  const h = host.toLowerCase();

  let m = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (m) return m[1];

  m = h.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (m) {
    const hi = parseInt(m[1], 16);
    const lo = parseInt(m[2], 16);
    return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
  }

  if (/^0x[0-9a-f]+$/.test(h)) return intToIPv4(parseInt(h, 16));

  if (/^\d+$/.test(h)) {
    const n = parseInt(h, 10);
    if (n > 0xffff && n <= 0xffffffff) return intToIPv4(n);
  }

  if (/^[\da-fx.]+$/.test(h) && h.includes('.')) {
    const octets = h.split('.');
    if (octets.length === 4) {
      const nums = octets.map((o) => {
        if (o.startsWith('0x')) return parseInt(o, 16);
        if (o.startsWith('0') && o.length > 1) return parseInt(o, 8);
        return parseInt(o, 10);
      });
      if (nums.every((n) => !Number.isNaN(n) && n >= 0 && n <= 255)) return nums.join('.');
    }
  }

  return h;
}

const METADATA_PATTERNS: RegExp[] = [
  /^169\.254\.\d+\.\d+$/, // IPv4 link-local — AWS/GCP/Azure IMDS 169.254.169.254
  /^fe[89ab][0-9a-f]:/, // IPv6 link-local
  /^fd00:ec2:/, // AWS IMDSv6
  /(^|\.)metadata\.google\.internal$/,
  /(^|\.)metadata\.azure\.com$/,
];

/**
 * Throws when `rawUrl` is malformed, not http(s), or points at cloud metadata.
 * Private/loopback addresses are intentionally allowed.
 */
export function assertNonMetadataUrl(rawUrl: string, label = 'Endpoint'): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid ${label} URL: "${rawUrl}"`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${label} must be http/https (got "${parsed.protocol}")`);
  }
  const bare = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const normalized = normalizeHost(bare);
  if (METADATA_PATTERNS.some((re) => re.test(bare) || re.test(normalized))) {
    throw new Error(`${label} may not target a cloud-metadata address: ${rawUrl}`);
  }
}
