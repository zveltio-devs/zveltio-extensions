// The model call. `complete` runs in the engine's Deno runner (ADR 0022): no
// permissions, every request a message to the engine, which performs it only
// toward the authorities the operator bound to the `provider` egress slot
// (ADR 0026). Each collection call is its own transaction, so every status
// write names the status it expects (`expect`).

import type { ExtensionJob, JobHost } from '@zveltio/sdk/extension';
import { CONVERSATIONS, HISTORY, MESSAGES, PROVIDERS, SLOT, TEMPLATES, USAGE } from './ai.js';

type Row = Record<string, any>;
interface Turn {
  role: 'user' | 'assistant';
  content: string;
}
interface Answer {
  content: string;
  prompt_tokens: number | null;
  response_tokens: number | null;
}

const TIMEOUT_MS = 240_000;
const DEFAULT_MAX_TOKENS = 4096;

/** Where each kind answers when the provider row names no base URL. */
const DEFAULT_BASE: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  ollama: 'http://localhost:11434/v1',
};

function fetchOf(host: JobHost): NonNullable<JobHost['fetch']> {
  if (!host.fetch || !host.egress) throw new Error('This engine runs jobs without egress slots; AI needs 3.0.0-beta.104 or later.');
  return host.fetch;
}

const num = (v: unknown): number | null => (Number.isFinite(Number(v)) && v != null && v !== '' ? Number(v) : null);

/** The provider's error text, short: never the request, which carries the key. */
async function failure(res: Response): Promise<Error> {
  const text = await res.text().catch(() => '');
  let detail = text;
  try {
    const j = JSON.parse(text);
    detail = j?.error?.message ?? j?.error ?? j?.message ?? text;
  } catch {}
  return new Error(`The provider answered HTTP ${res.status}: ${String(detail).slice(0, 500)}`);
}

async function callProvider(
  host: JobHost,
  provider: Row,
  req: { model: string; system: string | null; turns: Turn[]; temperature: number | null; max_tokens: number },
): Promise<Answer> {
  const kind = String(provider.kind);
  const base = String(provider.base_url || DEFAULT_BASE[kind] || '').replace(/\/$/, '');
  if (!base) throw new Error(`The provider "${provider.name}" has no base URL.`);
  const key = provider.api_key ? String(provider.api_key) : '';
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  if (kind === 'anthropic') {
    const res = await fetchOf(host)(`${base}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.max_tokens,
        ...(req.system ? { system: req.system } : {}),
        ...(req.temperature != null ? { temperature: req.temperature } : {}),
        messages: req.turns,
      }),
      signal,
    });
    if (!res.ok) throw await failure(res);
    const j = (await res.json()) as { content?: { type: string; text?: string }[]; usage?: Row };
    return {
      content: (j.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join(''),
      prompt_tokens: num(j.usage?.input_tokens),
      response_tokens: num(j.usage?.output_tokens),
    };
  }

  // OpenAI, Ollama and every OpenAI-compatible server share the chat completions shape.
  const res = await fetchOf(host)(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.max_tokens,
      ...(req.temperature != null ? { temperature: req.temperature } : {}),
      messages: [...(req.system ? [{ role: 'system', content: req.system }] : []), ...req.turns],
    }),
    signal,
  });
  if (!res.ok) throw await failure(res);
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: Row };
  return {
    content: String(j.choices?.[0]?.message?.content ?? ''),
    prompt_tokens: num(j.usage?.prompt_tokens),
    response_tokens: num(j.usage?.completion_tokens),
  };
}

/** The conversation's provider, else the active default one. */
async function providerOf(host: JobHost, conv: Row): Promise<Row | null> {
  if (conv.provider_id) {
    const p = (await host.collections.read(PROVIDERS, conv.provider_id)) as Row | null;
    return p?.is_active ? p : null;
  }
  const page = (await host.collections.list(PROVIDERS, {
    filter: { is_default: { eq: true }, is_active: { eq: true } },
    limit: 1,
    count: 'none',
  })) as { records?: Row[] };
  return page.records?.[0] ?? null;
}

/**
 * Answer one `pending` assistant message. Claimed as `running` first, and not
 * re-run by the queue: a provider bills a request whose answer was lost.
 */
const complete: ExtensionJob = async (input, host) => {
  const { id } = input as { id: string };
  const msg = (await host.collections.read(MESSAGES, id)) as Row | null;
  if (!msg || msg.status !== 'pending') return;
  await host.collections.update(MESSAGES, id, { status: 'running' }, { expect: { status: ['pending'] } });
  const expect = { status: ['running'] };
  const fail = (error: string) =>
    host.collections.update(MESSAGES, id, { status: 'failed', error: error.slice(0, 2000) }, { expect });

  try {
    fetchOf(host);
    const conv = (await host.collections.read(CONVERSATIONS, msg.conversation_id)) as Row | null;
    if (!conv) return void (await fail('The conversation is gone.'));
    const provider = await providerOf(host, conv);
    if (!provider) return void (await fail('No active AI provider: set one on the conversation or mark one as default.'));
    // An unbound slot is the capability off (ADR 0026): the engine would refuse the request anyway.
    if ((await host.egress!.slot(SLOT)).length === 0) {
      return void (await fail('The operator has not bound the "provider" egress slot: no model can be called.'));
    }
    const tpl = conv.template_id ? ((await host.collections.read(TEMPLATES, conv.template_id)) as Row | null) : null;

    // The newest HISTORY finished messages, oldest first. A turn's question and
    // answer are written in one transaction, so they share `created_at`: the
    // question goes first.
    const page = (await host.collections.list(MESSAGES, {
      filter: { conversation_id: { eq: conv.id }, status: { eq: 'done' } },
      sort: 'created_at',
      order: 'desc',
      limit: HISTORY,
      count: 'none',
    })) as { records?: Row[] };
    const at = (m: Row) => Date.parse(String(m.created_at));
    const history = (page.records ?? []).sort((a, b) => at(a) - at(b) || (a.role === b.role ? 0 : a.role === 'user' ? -1 : 1));
    const turns: Turn[] = history.map((m) => ({ role: m.role, content: String(m.content) }));
    // Both APIs want the first turn from the user.
    while (turns.length && turns[0].role !== 'user') turns.shift();
    if (!turns.length) return void (await fail('There is no user message to answer.'));

    const model = String(conv.model || tpl?.model || provider.default_model);
    const started = Date.now();
    const answer = await callProvider(host, provider, {
      model,
      system: conv.system_prompt || tpl?.system_prompt || null,
      turns,
      temperature: num(tpl?.temperature),
      max_tokens: num(tpl?.max_tokens) ?? DEFAULT_MAX_TOKENS,
    });
    const latency = Date.now() - started;
    await host.collections.update(
      MESSAGES,
      id,
      { status: 'done', content: answer.content, model, prompt_tokens: answer.prompt_tokens, response_tokens: answer.response_tokens },
      { expect },
    );
    await host.collections.insert(USAGE, {
      provider_id: provider.id,
      conversation_id: conv.id,
      model,
      operation: 'chat',
      prompt_tokens: answer.prompt_tokens ?? 0,
      response_tokens: answer.response_tokens ?? 0,
      latency_ms: latency,
    });
  } catch (err) {
    await fail((err as Error).message);
  }
};

export default { complete };
