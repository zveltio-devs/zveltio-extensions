// SAML sign-in is exercised against the real @node-saml/node-saml, not a stub:
// the failures this file guards against were the library's, on input the
// extension formed correctly, and a stub would pass against broken wiring.
//
// The move from the unmaintained `node-saml` (<= 3.1.2, critical
// GHSA-m837-g268-mmv7 SAML auth bypass) to `@node-saml/node-saml` 5.x renamed
// options and methods that have bitten this file before — `cert` -> `idpCert`,
// the `*Async` suffix on the promise methods, and `validateInResponseTo` from a
// value to an enum. So what is asserted here is the INSTALLED library's
// behaviour through `createSamlInstance`/`validateSamlResponse`: a validly
// signed assertion is accepted and its audience is checked, while a tampered
// signature, an unsigned assertion, and a wrong audience are each refused.
import { describe, expect, it } from 'bun:test';
import { createSamlInstance, validateSamlResponse, extractAssertionId } from './saml-provider.js';
// @ts-ignore — node-forge ships no types in this repository.
import forge from 'node-forge';
// @ts-ignore — xml-crypto ships no types.
import { SignedXml } from 'xml-crypto';

const SP = 'zveltio-sp';
const ACS = 'http://localhost/ext/auth/saml/callback';

/** A self-signed IdP and a Response with an enveloped signature over it. */
function createIdp() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date(Date.now() - 86_400_000);
  cert.validity.notAfter = new Date(Date.now() + 86_400_000);
  cert.setSubject([{ name: 'commonName', value: 'test-idp' }]);
  cert.setIssuer([{ name: 'commonName', value: 'test-idp' }]);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const keyPem = forge.pki.privateKeyToPem(keys.privateKey);
  const certPem = forge.pki.certificateToPem(cert);

  const response = (email: string, audience = SP) => {
    const at = new Date().toISOString();
    const later = new Date(Date.now() + 5 * 60_000).toISOString();
    const aid = `_a${crypto.randomUUID().replaceAll('-', '')}`;
    const xml =
      `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r${aid}" Version="2.0" IssueInstant="${at}" Destination="${ACS}">` +
      `<saml:Issuer>https://idp.test</saml:Issuer>` +
      `<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>` +
      `<saml:Assertion ID="${aid}" Version="2.0" IssueInstant="${at}"><saml:Issuer>https://idp.test</saml:Issuer>` +
      `<saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${email}</saml:NameID>` +
      `<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="${later}" Recipient="${ACS}"/></saml:SubjectConfirmation></saml:Subject>` +
      `<saml:Conditions NotBefore="${at}" NotOnOrAfter="${later}"><saml:AudienceRestriction><saml:Audience>${audience}</saml:Audience></saml:AudienceRestriction></saml:Conditions>` +
      `<saml:AuthnStatement AuthnInstant="${at}" SessionIndex="${aid}"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement>` +
      `<saml:AttributeStatement><saml:Attribute Name="email"><saml:AttributeValue>${email}</saml:AttributeValue></saml:Attribute></saml:AttributeStatement>` +
      `</saml:Assertion></samlp:Response>`;
    const sig = new SignedXml({
      privateKey: keyPem,
      signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
      canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
    });
    sig.addReference({
      xpath: "//*[local-name(.)='Response']",
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/2001/10/xml-exc-c14n#',
      ],
      digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
    });
    sig.computeSignature(xml, {
      location: { reference: "//*[local-name(.)='Issuer']", action: 'after' },
    });
    return Buffer.from(sig.getSignedXml()).toString('base64');
  };
  return { certPem, response };
}

const idp = createIdp();
const instance = (audience?: string | false) =>
  createSamlInstance({
    entryPoint: 'https://idp.test/sso',
    issuer: SP,
    cert: idp.certPem,
    callbackUrl: ACS,
    audience,
  });

describe('auth/saml — createSamlInstance option mapping (5.x)', () => {
  it('maps to the 5.x option names the library actually reads', () => {
    const saml = instance() as unknown as {
      options: { idpCert: string; validateInResponseTo: unknown; audience: unknown; wantAuthnResponseSigned: unknown };
    };
    // `cert` -> `idpCert`; a missing idpCert throws in the constructor.
    expect(saml.options.idpCert).toBe(idp.certPem);
    // enum value, not a boolean or the 4.x-era 'ifPresent' string.
    expect(saml.options.validateInResponseTo).toBe('never');
    // audience defaults to our own entityID so the check cannot be silently off.
    expect(saml.options.audience).toBe(SP);
    // a signature is required — the response must be signed by default.
    expect(saml.options.wantAuthnResponseSigned).toBe(true);
  });
});

describe('auth/saml — validateSamlResponse (real @node-saml/node-saml 5.x)', () => {
  it('accepts a validly signed assertion and returns the profile', async () => {
    const profile = await validateSamlResponse(instance(), { SAMLResponse: idp.response('carol@saml.test') });
    expect(profile.nameID).toBe('carol@saml.test');
    expect(profile.email).toBe('carol@saml.test');
  });

  it('rejects a tampered signature', async () => {
    let xml = Buffer.from(idp.response('carol@saml.test'), 'base64').toString('utf8');
    xml = xml.replace(/(SignatureValue[^>]*>)([A-Za-z0-9+/])/, (_m, a, ch) => a + (ch === 'A' ? 'B' : 'A'));
    const tampered = Buffer.from(xml).toString('base64');
    await expect(validateSamlResponse(instance(), { SAMLResponse: tampered })).rejects.toThrow();
  });

  it('rejects an unsigned assertion', async () => {
    let xml = Buffer.from(idp.response('carol@saml.test'), 'base64').toString('utf8');
    xml = xml.replace(/<(?:ds:)?Signature[\s\S]*?<\/(?:ds:)?Signature>/, '');
    const unsigned = Buffer.from(xml).toString('base64');
    await expect(validateSamlResponse(instance(), { SAMLResponse: unsigned })).rejects.toThrow();
  });

  it('rejects an assertion minted for a different audience', async () => {
    const other = idp.response('carol@saml.test', 'some-other-sp');
    await expect(validateSamlResponse(instance(), { SAMLResponse: other })).rejects.toThrow(/audience/i);
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
