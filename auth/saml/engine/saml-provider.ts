/**
 * SAML 2.0 provider wrapper (@node-saml/node-saml).
 * The library is auto-installed by the extension loader via manifest.json peerDependencies.
 */

// @ts-ignore — @node-saml/node-saml is installed at runtime by extension-loader before this module loads
import { SAML, ValidateInResponseTo } from '@node-saml/node-saml';

export interface SamlIdpConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  callbackUrl: string;
  privateKey?: string;
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512';
  /**
   * Require the wrapping `<Response>` to be signed. On by default — this is the
   * signature this SP relies on (its enveloped signature covers the assertion),
   * and it matches the config schema's default. Turn it off for an IdP that
   * signs only the assertion (see `wantAssertionsSigned`).
   */
  wantAuthnResponseSigned?: boolean;
  /**
   * Require the `<Assertion>` itself to be signed. Off by default: with the
   * response signed (above) the assertion is already inside verified content, so
   * demanding a second, assertion-level signature would reject IdPs that sign
   * only the response. Turn it on for an IdP that signs the assertion but not
   * the response (and then turn `wantAuthnResponseSigned` off).
   */
  wantAssertionsSigned?: boolean;
  acceptedClockSkewMs?: number;
  /**
   * Expected `<AudienceRestriction>` value — our own SP entityID. Defaults to
   * `issuer`, which is what an IdP is required to put there for us. Override
   * only if your IdP is configured with a different audience string; setting it
   * to `false` disables the check and is strongly discouraged (see below).
   */
  audience?: string | false;
}

export function createSamlInstance(config: SamlIdpConfig): any {
  return new SAML({
    entryPoint: config.entryPoint,
    issuer: config.issuer,
    // 5.x renamed `cert` -> `idpCert` (MandatorySamlOptions.idpCert in
    // types.d.ts; asserted required in saml.js). Passing the old `cert` name
    // would throw `idpCert is required`.
    idpCert: config.cert,
    callbackUrl: config.callbackUrl,
    privateKey: config.privateKey,
    signatureAlgorithm: config.signatureAlgorithm ?? 'sha256',

    // A signature is required, and every accepted profile is read from
    // `getVerifiedXml()` — verified content only. That is the fix for
    // GHSA-m837-g268-mmv7 (node-saml <= 3.1.2 read the assertion from the
    // unsigned original document), which is why this extension moved to 5.x.
    //
    //   wantAuthnResponseSigned: the <Response> must be signed (default on, and
    //                            what the config schema defaults to). Its
    //                            enveloped signature covers the assertion, so
    //                            node-saml extracts the assertion from the
    //                            verified response content.
    //   wantAssertionsSigned:    the <Assertion> must ALSO carry its own
    //                            signature. Off by default — 5.x's own default
    //                            is `true`, which would reject an IdP that signs
    //                            only the response, so it is set explicitly.
    //
    // With the response required signed, node-saml throws `Invalid document
    // signature` (saml.js) when the response is unsigned or tampered, so no such
    // response can produce a profile. An IdP that signs only the assertion sets
    // `wantAuthnResponseSigned: false` in config, and node-saml then requires a
    // valid assertion signature instead.
    wantAuthnResponseSigned: config.wantAuthnResponseSigned ?? true,
    wantAssertionsSigned: config.wantAssertionsSigned ?? false,

    acceptedClockSkewMs: config.acceptedClockSkewMs ?? 5000,

    // `ValidateInResponseTo.never`, and it has to be.
    //
    // node-saml's default `cacheProvider` is a fresh `InMemoryCacheProvider`
    // per instance, and `samlRoutes` builds a new instance on every request —
    // `/login` at one call site, `/callback` at another. The request id saved
    // while generating the AuthnRequest is never in the cache of the instance
    // validating the response, so `ifPresent`/`always` would reject every
    // SP-initiated login (`InResponseTo is not valid`), and `always` also
    // refuses IdP-initiated ones (they carry no InResponseTo by construction).
    //
    // The InResponseTo binding is therefore replaced by assertion replay
    // detection in `routes.ts` (migration 005), which covers BOTH flows where
    // InResponseTo could only ever have covered the SP-initiated one.
    //
    // 5.x made this option an enum (`ValidateInResponseTo`, types.d.ts) and
    // validates it in the constructor, so an old boolean — or the 4.x-era
    // string `'ifPresent'` — now throws `validateInResponseTo must be one of
    // ['never', 'ifPresent', 'always']` instead of being silently coerced.
    validateInResponseTo: ValidateInResponseTo.never,
    disableRequestedAuthnContext: true,

    // node-saml checks AudienceRestriction unless `audience` is `false`
    // (`if (this.options.audience !== false)`, saml.js), so `false` disables the
    // check. Without a real value we would accept any correctly-signed assertion
    // from the trusted IdP, including one the IdP minted for a DIFFERENT service
    // provider. In an enterprise where one IdP fronts many SPs, an assertion
    // issued for some low-trust internal app could then be replayed here to log
    // in. Defaulting to our own entityID (`issuer`) is the value the SAML spec
    // expects in AudienceRestriction, and is also 5.x's default when omitted.
    audience: config.audience ?? config.issuer,
  });
}

export interface SamlProfile {
  nameID: string;
  nameIDFormat?: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

/**
 * The `ID` of the signed Assertion inside a SAML Response.
 *
 * Read from the same bytes node-saml has just validated, so the value is one the
 * signature covers: the reference in the enveloped signature is the Assertion
 * element, ID attribute included. node-saml refuses a response carrying more
 * than one assertion (`Invalid signature: multiple assertions`, saml.js), so
 * "the first one" is "the only one".
 *
 * Returns null when no id can be read. The caller treats that as a refusal
 * rather than as permission — an assertion whose id cannot be recorded is one
 * whose replay cannot be detected.
 */
export function extractAssertionId(samlResponseBase64: string): string | null {
  let xml: string;
  try {
    xml = Buffer.from(samlResponseBase64, 'base64').toString('utf8');
  } catch {
    return null;
  }
  const m = /<(?:[A-Za-z0-9_.-]+:)?Assertion\b[^>]*?\bID\s*=\s*"([^"]+)"/.exec(xml);
  return m ? m[1] : null;
}

export async function validateSamlResponse(
  saml: any,
  body: Record<string, string>,
): Promise<SamlProfile> {
  // `validatePostResponseAsync` — 5.x carries the `*Async` suffix on the
  // promise-returning methods (saml.d.ts), the same boundary that renamed
  // `getAuthorizeUrl` -> `getAuthorizeUrlAsync` in routes.ts. Calling the
  // suffix-less name would be a TypeError and nobody would ever be signed in.
  const { profile } = await saml.validatePostResponseAsync(body);
  if (!profile) throw new Error('SAML validation returned empty profile');

  return {
    nameID: profile.nameID,
    nameIDFormat: profile.nameIDFormat,
    email: profile.email ?? profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
    displayName: profile.displayName ?? profile['http://schemas.microsoft.com/identity/claims/displayname'],
    firstName: profile.givenName ?? profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
    lastName: profile.sn ?? profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
    ...profile,
  };
}
