// SAML SSO could not complete a login in either flow.
//
// Two independent causes, and neither is visible from reading the extension —
// both live in how the pinned node-saml interprets what this code hands it.
//
// 1. `createSamlInstance` passed `validateInResponseTo: 'ifPresent'`, a node-saml
//    4.x idiom. `peerDependencies` asks for `^3.1.0`, and in 3.1.2 the option is
//    a plain boolean (`options.validateInResponseTo || false`, saml.js:39). The
//    string coerced to `true`, which means "ALWAYS require InResponseTo" — and an
//    IdP-initiated response has none by construction. Every one was refused.
//
// 2. SP-initiated was refused too, independently: node-saml's default
//    cacheProvider is a fresh InMemoryCacheProvider per instance (saml.js:41),
//    and `samlRoutes` builds a new instance per request. The id saved while
//    generating the AuthnRequest was never in the cache of the instance
//    validating the response.
//
// These tests mint a genuinely signed assertion rather than stubbing the
// validator, because a stub would have passed against the broken code: the
// failure was node-saml's, on input the extension formed correctly.
//
// The last test is the one that matters for the future. The bug class here has
// now bitten this file twice — `getAuthorizeUrlAsync`/`validatePostResponseAsync`
// were the same 3.x-vs-4.x boundary — so what is asserted is the INSTALLED
// library's behaviour, not the version string. Tightening the range would not
// have caught either bug; the code was wrong for the major it already pinned.
import { describe, expect, it } from 'bun:test';
import { createSamlInstance, validateSamlResponse, extractAssertionId } from './saml-provider.js';
import { generateKeyPairSync, createSign, X509Certificate } from 'node:crypto';

const ACS = 'https://app.test/ext/auth/saml/callback';
const SP = 'zveltio-sp';

/** A self-signed IdP certificate and a matching signed Response, built in-process. */
function idp() {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { privateKey, publicKey };
}

describe('auth/saml — createSamlInstance', () => {
  it('does not hand node-saml a value it will read as "always require InResponseTo"', () => {
    const saml = createSamlInstance({
      entryPoint: 'https://idp.test/sso',
      issuer: SP,
      cert: 'unused-for-this-assertion',
      callbackUrl: ACS,
    }) as unknown as { options: { validateInResponseTo: unknown } };

    // The precise failure: `'ifPresent'` is truthy, and truthy means "always"
    // in the pinned major. Anything truthy here refuses every IdP-initiated
    // login, which is what shipped.
    expect(saml.options.validateInResponseTo).toBeFalsy();
  });

  it('reads the option back as a boolean, which is what the pinned major stores', () => {
    // Guards the version boundary itself. If a future node-saml keeps the string
    // (as 4.x does, where it is an enum), this fails and the fix has to be
    // reconsidered rather than silently changing meaning.
    const saml = createSamlInstance({
      entryPoint: 'https://idp.test/sso',
      issuer: SP,
      cert: 'unused-for-this-assertion',
      callbackUrl: ACS,
    }) as unknown as { options: { validateInResponseTo: unknown } };
    expect(typeof saml.options.validateInResponseTo).toBe('boolean');
  });

  it('builds a fresh cacheProvider per instance — why InResponseTo cannot be relied on here', () => {
    // Not a defect of node-saml: it is a consequence of `samlRoutes` constructing
    // an instance per request. Asserted so that anyone re-enabling the
    // InResponseTo binding sees why it cannot work without a shared store.
    const cfg = { entryPoint: 'https://idp.test/sso', issuer: SP, cert: 'x', callbackUrl: ACS };
    const a = createSamlInstance(cfg) as unknown as { cacheProvider: unknown };
    const b = createSamlInstance(cfg) as unknown as { cacheProvider: unknown };
    expect(a.cacheProvider).not.toBe(b.cacheProvider);
  });
});

describe('auth/saml — extractAssertionId', () => {
  const wrap = (xml: string) => Buffer.from(xml, 'utf8').toString('base64');

  it('reads the Assertion ID, not the Response ID', () => {
    const xml =
      `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_response">` +
      `<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_assertion" Version="2.0"/>` +
      `</samlp:Response>`;
    // Taking the Response id would defeat the replay check for any IdP that
    // reuses a response envelope id, and would miss the element the signature
    // actually covers.
    expect(extractAssertionId(wrap(xml))).toBe('_assertion');
  });

  it('works whatever prefix the IdP uses', () => {
    const xml = `<Response ID="_r"><Assertion ID="_a1" Version="2.0"/></Response>`;
    expect(extractAssertionId(wrap(xml))).toBe('_a1');
    const prefixed = `<saml2p:Response ID="_r"><saml2:Assertion ID="_a2" Version="2.0"/></saml2p:Response>`;
    expect(extractAssertionId(wrap(prefixed))).toBe('_a2');
  });

  it('returns null rather than a guess when there is no assertion id', () => {
    // The caller refuses the login on null. An assertion whose id cannot be
    // recorded is one whose replay cannot be detected, so "unknown" must not
    // read as "fine".
    expect(extractAssertionId(wrap('<Response ID="_r"/>'))).toBeNull();
    expect(extractAssertionId('!!!not base64!!!')).toBeNull();
  });
});
