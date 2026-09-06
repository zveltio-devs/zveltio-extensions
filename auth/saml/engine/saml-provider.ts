/**
 * SAML 2.0 provider wrapper (node-saml).
 * node-saml is auto-installed by the extension loader via manifest.json peerDependencies.
 */

// @ts-ignore — node-saml is installed at runtime by extension-loader before this module loads
import { SAML } from 'node-saml';

export interface SamlIdpConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  callbackUrl: string;
  privateKey?: string;
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512';
  wantAuthnResponseSigned?: boolean;
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
    cert: config.cert,
    callbackUrl: config.callbackUrl,
    privateKey: config.privateKey,
    signatureAlgorithm: config.signatureAlgorithm ?? 'sha256',
    wantAuthnResponseSigned: config.wantAuthnResponseSigned ?? true,
    acceptedClockSkewMs: config.acceptedClockSkewMs ?? 5000,
    // `false`, and it has to be, on the major this extension pins.
    //
    // This read `'ifPresent'` — a node-saml 4.x idiom. `peerDependencies` asks
    // for `^3.1.0`, and in 3.1.2 the option is a plain boolean:
    //
    //   node_modules/node-saml/src/saml.js:39
    //     validateInResponseTo: options.validateInResponseTo || false
    //
    // So the string was coerced to `true`, which in `_validateInResponseTo`
    // (saml.js:706) means "ALWAYS require InResponseTo". An IdP-initiated
    // response carries none by construction, so every one of them was refused
    // with `InResponseTo is missing from response`, and the ACS answered 401.
    //
    // SP-initiated was refused too, for a second and independent reason: the
    // default `cacheProvider` is a fresh `InMemoryCacheProvider` per instance
    // (saml.js:41), and `samlRoutes` builds a new instance on every request —
    // `/login` at one call site, `/callback` at another. The request id saved
    // while generating the AuthnRequest was never in the cache of the instance
    // validating the response, so the lookup missed and it became
    // `InResponseTo is not valid`.
    //
    // Measured, on the instance this function returns:
    //   options.validateInResponseTo = "ifPresent" -> truthy? true
    //   same cacheProvider object? false
    //   keys cached on the /login instance : 1
    //   keys cached on the /callback instance: 0
    //
    // The binding was therefore never in force — it rejected everything, which
    // is not the same as protecting anything. It is set to `false` explicitly
    // rather than left to a version's coercion, and the protection the author
    // meant to have is replaced by assertion replay detection in `routes.ts`
    // (migration 005), which covers BOTH flows where InResponseTo could only
    // ever have covered one.
    //
    // Note for a future upgrade: on 4.x this option became an enum and
    // `'ifPresent'` means there what it says. Moving to that major is a
    // deliberate change — it also renames the promise-returning methods, which
    // is the same boundary that broke `getAuthorizeUrl`/`validatePostResponse`
    // here once already.
    validateInResponseTo: false,
    disableRequestedAuthnContext: true,
    // node-saml only checks AudienceRestriction when `audience` is truthy
    // (`if (this.options.audience)`), so LEAVING THIS UNSET SILENTLY DISABLES
    // the check — which is what it used to do here. Without it we accept any
    // correctly-signed assertion from the trusted IdP, including one the IdP
    // minted for a DIFFERENT service provider. In an enterprise where one IdP
    // fronts many SPs, an assertion issued for some low-trust internal app
    // could then be replayed here to log in. Defaulting to our own entityID
    // (`issuer`) is the value the SAML spec expects in AudienceRestriction.
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
 * than one assertion (saml.js:196), so "the first one" is "the only one".
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
  // `validatePostResponse`, not `validatePostResponseAsync` — the same major
  // mismatch as `getAuthorizeUrl` in routes.ts. node-saml `^3.1.0`, which this
  // extension pins, dropped the `*Async` suffix from the promise-returning
  // methods. So the assertion callback threw a TypeError on the line that
  // validates the assertion: the IdP could post a perfectly good response and
  // nobody was ever signed in.
  const { profile } = await saml.validatePostResponse(body);
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
