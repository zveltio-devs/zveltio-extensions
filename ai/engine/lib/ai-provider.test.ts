/**
 * Regression tests for the boot path of the provider registry.
 *
 * Written because `initAIProviders` read the encrypted `api_key` column without
 * decrypting it, so after any restart every provider carried
 * `aes256gcm:<iv>:<ciphertext>` as its bearer token and every AI call in the
 * product failed with a 401 from the provider. The route that saves a key
 * hot-reloads the provider itself and DOES decrypt, which is why configuring a
 * key worked and kept working — until the next boot. Nothing here was covered:
 * the extension's only test file was the generated contract harness.
 *
 * These assert the crossing itself — what the provider ends up holding — rather
 * than that the function ran, because "it ran" is what was true before.
 */

import { describe, expect, it } from 'bun:test';
import { encryptApiKey } from './ai-crypto.js';
import { AIProviderManager, aiProviderManager, initAIProviders } from './ai-provider.js';

// ai-crypto requires a 32-byte hex key; any fixed value works for a round trip.
process.env.AI_KEY_ENCRYPTION_KEY ??= 'a'.repeat(64);

/** Minimal stand-in for the Kysely chain `initAIProviders` uses. */
function fakeDb(rows: Array<Record<string, unknown>>) {
  return {
    selectFrom: () => ({
      selectAll: () => ({
        where: () => ({ execute: async () => rows }),
      }),
    }),
  };
}

/** The key a provider will actually put on the wire. */
function bearerOf(provider: unknown): string {
  // `apiKey` is a TS-private constructor field, present at runtime.
  return (provider as { apiKey?: string }).apiKey ?? '';
}

describe('initAIProviders — stored keys', () => {
  it('decrypts the api_key column instead of using the ciphertext as a bearer token', async () => {
    const plaintext = 'sk-test-not-a-real-key';
    const stored = await encryptApiKey(plaintext);
    expect(stored).toStartWith('aes256gcm:');

    await initAIProviders(
      fakeDb([
        {
          name: 'openai',
          label: 'OpenAI',
          api_key: stored,
          base_url: null,
          default_model: null,
          is_default: true,
          is_active: true,
        },
      ]),
    );

    const provider = aiProviderManager.get('openai');
    expect(provider).not.toBeNull();
    expect(bearerOf(provider)).toBe(plaintext);
    // The specific regression: never the stored form.
    expect(bearerOf(provider)).not.toStartWith('aes256gcm:');
  });

  it('leaves a legacy plaintext key untouched', async () => {
    await initAIProviders(
      fakeDb([
        {
          name: 'legacy-compat',
          label: 'Legacy',
          api_key: 'sk-plain-legacy',
          base_url: 'https://gateway.example.test/v1',
          default_model: 'gpt-4o-mini',
          is_default: false,
          is_active: true,
        },
      ]),
    );

    expect(bearerOf(aiProviderManager.get('legacy-compat'))).toBe('sk-plain-legacy');
  });

  it('refuses a row whose key cannot be decrypted rather than registering a garbage token', async () => {
    await initAIProviders(
      fakeDb([
        {
          name: 'anthropic',
          label: 'Anthropic',
          // Well-formed prefix, unusable payload — what a rotated
          // AI_KEY_ENCRYPTION_KEY or a copied database looks like.
          api_key: 'aes256gcm:00000000000000000000000000000000:deadbeef',
          base_url: null,
          default_model: null,
          is_default: false,
          is_active: true,
        },
      ]),
    );

    expect(aiProviderManager.get('anthropic')).toBeNull();
  });

  it('skips a provider whose base_url points at cloud metadata', async () => {
    await initAIProviders(
      fakeDb([
        {
          name: 'metadata-probe',
          label: 'Probe',
          api_key: 'sk-plain',
          base_url: 'http://169.254.169.254/latest/meta-data/',
          default_model: null,
          is_default: false,
          is_active: true,
        },
      ]),
    );

    expect(aiProviderManager.get('metadata-probe')).toBeNull();
  });
});

describe('AIProviderManager.list', () => {
  it('returns objects carrying the name, which is what callers match on', () => {
    // `GET /providers` did `aiProviderManager.list().includes(p.name)` — comparing
    // a string against these objects, so every provider reported loaded: false
    // even while serving requests. Pinning the shape so that read stays honest.
    const mgr = new AIProviderManager();
    mgr.register({ name: 'ollama', label: 'Ollama', chat: async () => ({}) as never }, true);

    const listed = mgr.list();
    expect(listed).toEqual([{ name: 'ollama', label: 'Ollama', isDefault: true }]);
    expect(listed.map((p) => p.name)).toContain('ollama');
    // The bug, stated as a test:
    expect((listed as unknown as string[]).includes('ollama')).toBe(false);
  });
});
