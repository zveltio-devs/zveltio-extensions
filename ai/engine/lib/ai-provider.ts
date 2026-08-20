/**
 * Engine-level AI provider manager.
 * Supports OpenAI-compatible APIs, Anthropic (Claude), and Ollama (local).
 *
 * Providers are configured in the DB table `zv_ai_providers`, and nowhere else.
 */

import { assertNonMetadataUrl } from './endpoint-guard.js';
import { decryptApiKey } from './ai-crypto.js';

/**
 * Every embedding call is fired from a write hook, so it needs a deadline.
 *
 * `record.created` and `record.updated` run this on every row written anywhere
 * in the instance. The event bus fans out synchronously and does not await
 * listeners, so a slow provider does not block the write — but nothing bounded
 * these calls either, and a provider that is misconfigured, unreachable, or
 * simply gone leaves one detached request per write, each holding a socket,
 * accumulating for as long as people keep working.
 *
 * An audit reported an engine that stopped accepting writes while Postgres sat
 * completely idle and nothing appeared in the log, could not reproduce it, and
 * named this as the most plausible suspect. It stayed unreproduced here too, so
 * this is not presented as the cause. It is an unbounded network call on the
 * hottest path in the product, which is worth closing whether or not it was.
 *
 * Thirty seconds is far above a healthy embedding round-trip and far below
 * "never".
 */
// 30 s, fixed. This was `Number(process.env.AI_EMBED_TIMEOUT_MS ?? 30_000)`,
// which is ambient authority for a tuning knob nobody has ever turned. If an
// instance genuinely needs a different deadline it belongs on the provider row,
// next to the base URL and the model, where an administrator can see it.
const EMBED_TIMEOUT_MS = 30_000;


export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, any>;
    };
  }>;
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export interface ChatResult {
  content: string;
  model: string;
  provider: string;
  usage: { prompt_tokens: number; response_tokens: number };
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

export interface EmbedResult {
  embedding: number[];
  model: string;
}

export interface AIProvider {
  name: string;
  label: string;
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
  embed?(text: string, model?: string): Promise<EmbedResult>;
}

// ─── OpenAI / OpenAI-compatible ────────────────────────────────

export class OpenAIProvider implements AIProvider {
  name: string;
  label: string;

  constructor(
    private apiKey: string,
    private baseUrl = 'https://api.openai.com/v1',
    private defaultModel = 'gpt-4o-mini',
    name = 'openai',
    label = 'OpenAI',
  ) {
    this.name = name;
    this.label = label;
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    const model = opts.model || this.defaultModel;
    const body: any = {
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      ...(opts.max_tokens ? { max_tokens: opts.max_tokens } : {}),
    };

    if (opts.tools && opts.tools.length > 0) {
      body.tools = opts.tools;
      body.tool_choice = opts.tool_choice ?? 'auto';
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err}`);
    }

    const data: any = await res.json();
    return {
      content: data.choices[0].message.content || '',
      model,
      provider: this.name,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        response_tokens: data.usage?.completion_tokens ?? 0,
      },
      tool_calls: data.choices[0].message.tool_calls,
    };
  }

  async embed(text: string, model = 'text-embedding-3-small'): Promise<EmbedResult> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model, input: text }),
      signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
    });

    if (!res.ok) throw new Error(`OpenAI embeddings error: ${res.status}`);

    const data: any = await res.json();
    return { embedding: data.data[0].embedding, model };
  }
}

// ─── Anthropic (Claude) ────────────────────────────────────────

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  label = 'Anthropic (Claude)';

  constructor(
    private apiKey: string,
    private defaultModel = 'claude-haiku-4-5-20251001',
  ) {}

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    const model = opts.model || this.defaultModel;
    const systemMsg = messages.find((m) => m.role === 'system')?.content;
    const userMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const body: any = {
      model,
      messages: userMessages,
      max_tokens: opts.max_tokens ?? 2048,
      temperature: opts.temperature ?? 0.7,
    };
    if (systemMsg) body.system = systemMsg;

    if (opts.tools && opts.tools.length > 0) {
      body.tools = opts.tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      }));
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${err}`);
    }

    const data: any = await res.json();
    const textBlocks = data.content.filter((b: any) => b.type === 'text');
    const content = textBlocks.map((b: any) => b.text).join('');
    const toolUseBlocks = data.content.filter((b: any) => b.type === 'tool_use');
    const tool_calls = toolUseBlocks.map((b: any) => ({
      id: b.id,
      type: 'function' as const,
      function: { name: b.name, arguments: JSON.stringify(b.input) },
    }));

    return {
      content,
      model,
      provider: this.name,
      usage: {
        prompt_tokens: data.usage?.input_tokens ?? 0,
        response_tokens: data.usage?.output_tokens ?? 0,
      },
      tool_calls: tool_calls.length > 0 ? tool_calls : undefined,
    };
  }
}

// ─── Ollama (local) ────────────────────────────────────────────

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  label = 'Ollama (local)';

  constructor(
    private baseUrl = 'http://localhost:11434',
    private defaultModel = 'llama3.2',
  ) {}

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    const model = opts.model || this.defaultModel;
    const body: any = {
      model,
      messages,
      stream: false,
      options: {
        temperature: opts.temperature ?? 0.7,
        num_predict: opts.max_tokens ?? -1,
      },
    };

    if (opts.tools && opts.tools.length > 0) {
      body.tools = opts.tools;
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

    const data: any = await res.json();
    const tool_calls = data.message.tool_calls?.map((tc: any) => ({
      id: tc.id || crypto.randomUUID(),
      type: 'function' as const,
      function: { name: tc.function.name, arguments: JSON.stringify(tc.function.arguments) },
    }));

    return {
      content: data.message.content,
      model,
      provider: this.name,
      usage: {
        prompt_tokens: data.prompt_eval_count ?? 0,
        response_tokens: data.eval_count ?? 0,
      },
      tool_calls: tool_calls?.length > 0 ? tool_calls : undefined,
    };
  }

  async embed(text: string, model?: string): Promise<EmbedResult> {
    const useModel = model || this.defaultModel;
    const res = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: useModel, input: text }),
      signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
    });

    // Without this, a 404 from a model Ollama has not pulled surfaced as
    // "Cannot read properties of undefined (reading '0')" from the line below —
    // which names neither Ollama nor the model.
    if (!res.ok) {
      throw new Error(`Ollama embeddings error ${res.status} for model "${useModel}": ${await res.text()}`);
    }

    const data: any = await res.json();
    return { embedding: data.embeddings[0], model: useModel };
  }
}

// ─── Provider Manager ──────────────────────────────────────────

export class AIProviderManager {
  private providers = new Map<string, AIProvider>();
  private _defaultName: string | null = null;

  register(provider: AIProvider, isDefault = false): void {
    this.providers.set(provider.name, provider);
    if (isDefault || this.providers.size === 1) {
      this._defaultName = provider.name;
    }
  }

  getDefault(): AIProvider | null {
    return this._defaultName ? (this.providers.get(this._defaultName) ?? null) : null;
  }

  get(name: string): AIProvider | null {
    return this.providers.get(name) ?? null;
  }

  list(): Array<{ name: string; label: string; isDefault: boolean }> {
    return [...this.providers.values()].map((p) => ({
      name: p.name,
      label: p.label,
      isDefault: p.name === this._defaultName,
    }));
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  setDefault(name: string): void {
    if (this.providers.has(name)) this._defaultName = name;
  }
}

export const aiProviderManager = new AIProviderManager();

/**
 * Initialize AI providers from DB config + env vars.
 * Called once on engine startup.
 */
export async function initAIProviders(db: any): Promise<void> {
  // Load from DB
  const rows = await db
    .selectFrom('zv_ai_providers' as any)
    .selectAll()
    .where('is_active' as any, '=', true)
    .execute();
    // No `.catch(() => [])`. An empty provider list means "AI is not configured",
    // so a failed read turned every AI feature off and said nothing. `register()`
    // already wraps this call and logs `initAIProviders failed (non-fatal)` — that
    // handler was written for exactly this and the swallow made it unreachable.

  for (const row of rows as any[]) {
    let provider: AIProvider | null = null;

    // The column holds `aes256gcm:iv:ciphertext` — `PUT /providers/:name`
    // encrypts on write. This function is the OTHER reader of that column and
    // did not decrypt, so every provider built at boot carried the ciphertext
    // as its API key and sent `Authorization: Bearer aes256gcm:…`.
    //
    // Only a restart exposed it: the same route hot-reloads the provider it just
    // saved and DOES decrypt, so configuring a key worked and kept working for
    // the rest of the process lifetime. The next boot broke every AI call in the
    // product with a 401 from the provider — on every install, and invisible in
    // any session that never restarted.
    //
    // `decryptApiKey` returns its input unchanged when the value lacks the
    // `aes256gcm:` prefix, so rows written before encryption existed still load.
    let apiKey: string | null = row.api_key ?? null;
    if (apiKey) {
      try {
        apiKey = await decryptApiKey(apiKey);
      } catch (err) {
        // A key that cannot be decrypted (rotated AI_KEY_ENCRYPTION_KEY, copied
        // database) must not silently become a garbage bearer token. Skip the
        // row and name it, so the operator sees which provider to re-enter.
        console.error(
          `[ai] refusing provider "${row.name}": stored API key could not be decrypted ` +
            `(AI_KEY_ENCRYPTION_KEY changed?) — re-enter it in AI Settings. ${(err as Error).message}`,
        );
        continue;
      }
    }

    // A provider base URL may legitimately be private (self-hosted Ollama /
    // gateway), but must never be cloud metadata — that would turn this config
    // field into instance-credential exfiltration. Skip the row rather than
    // throw: one bad row must not stop the whole provider init at boot.
    if (row.base_url) {
      try {
        assertNonMetadataUrl(row.base_url, `AI provider "${row.name}" base_url`);
      } catch (err) {
        console.error(`[ai] refusing provider "${row.name}":`, (err as Error).message);
        continue;
      }
    }

    switch (row.name) {
      case 'openai':
        if (apiKey) {
          provider = new OpenAIProvider(apiKey, row.base_url || undefined, row.default_model || undefined);
        }
        break;
      case 'anthropic':
        if (apiKey) {
          provider = new AnthropicProvider(apiKey, row.default_model || undefined);
        }
        break;
      case 'ollama':
        provider = new OllamaProvider(row.base_url || undefined, row.default_model || undefined);
        break;
      default:
        // OpenAI-compatible custom provider
        if (apiKey && row.base_url) {
          provider = new OpenAIProvider(apiKey, row.base_url, row.default_model || 'gpt-4o-mini', row.name, row.label || row.name);
        }
    }

    // A configured row that produces no provider is a dead setting the admin
    // cannot see: `PUT /providers/:name` answers `{success:true}` for any name,
    // and the label map offers "gemini", for which no class exists. Say so.
    if (!provider) {
      console.warn(
        `[ai] provider "${row.name}" is active in zv_ai_providers but was not loaded — ` +
          `either the name has no implementation (supported: openai, anthropic, ollama, ` +
          `or any OpenAI-compatible name with both api_key and base_url set), or its API key is missing.`,
      );
    }

    if (provider) {
      aiProviderManager.register(provider, row.is_default);
    }
  }

  // There was an env-var fallback here — OPENAI_API_KEY / ANTHROPIC_API_KEY /
  // OLLAMA_URL, used when no provider row existed. It is gone, for two reasons
  // that point the same way.
  //
  // It was a second source of truth for a setting that already has one. A
  // provider configured this way is invisible to `GET /providers`, cannot be
  // edited or disabled from the admin UI, and its key is not encrypted — so
  // "which model is this instance using" had two answers and only one of them
  // was on screen.
  //
  // And reading it at all meant reading `process.env` from inside an extension,
  // which hands the extension the ENGINE's whole environment: DATABASE_URL,
  // BETTER_AUTH_SECRET, FIELD_ENCRYPTION_KEY. An extension that wanted to
  // decrypt without holding the `secrets` capability could simply take the key
  // and do it itself.
  //
  // Configure providers at `PUT /api/ext/ai/providers/:name`, which is what the
  // admin UI drives.
}

/** Matches {{variableName}} placeholders in template strings. */
const TEMPLATE_VAR_RE = /\{\{(\w+)\}\}/g;

/**
 * Simple Handlebars-like template renderer: {{variable}} → value
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(TEMPLATE_VAR_RE, (_, key) => variables[key] ?? `{{${key}}}`);
}
