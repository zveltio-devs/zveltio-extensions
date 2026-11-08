// engine/ai.ts
var PROVIDERS = "ai_providers";
var TEMPLATES = "ai_prompt_templates";
var CONVERSATIONS = "ai_conversations";
var MESSAGES = "ai_messages";
var USAGE = "ai_usage";
var SLOT = "provider";
var HISTORY = 50;

// engine/jobs.ts
var TIMEOUT_MS = 240000;
var DEFAULT_MAX_TOKENS = 4096;
var DEFAULT_BASE = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  ollama: "http://localhost:11434/v1"
};
function fetchOf(host) {
  if (!host.fetch || !host.egress)
    throw new Error("This engine runs jobs without egress slots; AI needs 3.0.0-beta.104 or later.");
  return host.fetch;
}
var num = (v) => Number.isFinite(Number(v)) && v != null && v !== "" ? Number(v) : null;
async function failure(res) {
  const text = await res.text().catch(() => "");
  let detail = text;
  try {
    const j = JSON.parse(text);
    detail = j?.error?.message ?? j?.error ?? j?.message ?? text;
  } catch {}
  return new Error(`The provider answered HTTP ${res.status}: ${String(detail).slice(0, 500)}`);
}
async function callProvider(host, provider, req) {
  const kind = String(provider.kind);
  const base = String(provider.base_url || DEFAULT_BASE[kind] || "").replace(/\/$/, "");
  if (!base)
    throw new Error(`The provider "${provider.name}" has no base URL.`);
  const key = provider.api_key ? String(provider.api_key) : "";
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  if (kind === "anthropic") {
    const res = await fetchOf(host)(`${base}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.max_tokens,
        ...req.system ? { system: req.system } : {},
        ...req.temperature != null ? { temperature: req.temperature } : {},
        messages: req.turns
      }),
      signal
    });
    if (!res.ok)
      throw await failure(res);
    const j = await res.json();
    return {
      content: (j.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join(""),
      prompt_tokens: num(j.usage?.input_tokens),
      response_tokens: num(j.usage?.output_tokens)
    };
  }
  const res = await fetchOf(host)(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...key ? { Authorization: `Bearer ${key}` } : {} },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.max_tokens,
      ...req.temperature != null ? { temperature: req.temperature } : {},
      messages: [...req.system ? [{ role: "system", content: req.system }] : [], ...req.turns]
    }),
    signal
  });
  if (!res.ok)
    throw await failure(res);
  const j = await res.json();
  return {
    content: String(j.choices?.[0]?.message?.content ?? ""),
    prompt_tokens: num(j.usage?.prompt_tokens),
    response_tokens: num(j.usage?.completion_tokens)
  };
}
async function providerOf(host, conv) {
  if (conv.provider_id) {
    const p = await host.collections.read(PROVIDERS, conv.provider_id);
    return p?.is_active ? p : null;
  }
  const page = await host.collections.list(PROVIDERS, {
    filter: { is_default: { eq: true }, is_active: { eq: true } },
    limit: 1,
    count: "none"
  });
  return page.records?.[0] ?? null;
}
var complete = async (input, host) => {
  const { id } = input;
  const msg = await host.collections.read(MESSAGES, id);
  if (!msg || msg.status !== "pending")
    return;
  await host.collections.update(MESSAGES, id, { status: "running" }, { expect: { status: ["pending"] } });
  const expect = { status: ["running"] };
  const fail = (error) => host.collections.update(MESSAGES, id, { status: "failed", error: error.slice(0, 2000) }, { expect });
  try {
    fetchOf(host);
    const conv = await host.collections.read(CONVERSATIONS, msg.conversation_id);
    if (!conv)
      return void await fail("The conversation is gone.");
    const provider = await providerOf(host, conv);
    if (!provider)
      return void await fail("No active AI provider: set one on the conversation or mark one as default.");
    if ((await host.egress.slot(SLOT)).length === 0) {
      return void await fail('The operator has not bound the "provider" egress slot: no model can be called.');
    }
    const tpl = conv.template_id ? await host.collections.read(TEMPLATES, conv.template_id) : null;
    const page = await host.collections.list(MESSAGES, {
      filter: { conversation_id: { eq: conv.id }, status: { eq: "done" } },
      sort: "created_at",
      order: "desc",
      limit: HISTORY,
      count: "none"
    });
    const at = (m) => Date.parse(String(m.created_at));
    const history = (page.records ?? []).sort((a, b) => at(a) - at(b) || (a.role === b.role ? 0 : a.role === "user" ? -1 : 1));
    const turns = history.map((m) => ({ role: m.role, content: String(m.content) }));
    while (turns.length && turns[0].role !== "user")
      turns.shift();
    if (!turns.length)
      return void await fail("There is no user message to answer.");
    const model = String(conv.model || tpl?.model || provider.default_model);
    const started = Date.now();
    const answer = await callProvider(host, provider, {
      model,
      system: conv.system_prompt || tpl?.system_prompt || null,
      turns,
      temperature: num(tpl?.temperature),
      max_tokens: num(tpl?.max_tokens) ?? DEFAULT_MAX_TOKENS
    });
    const latency = Date.now() - started;
    await host.collections.update(MESSAGES, id, { status: "done", content: answer.content, model, prompt_tokens: answer.prompt_tokens, response_tokens: answer.response_tokens }, { expect });
    await host.collections.insert(USAGE, {
      provider_id: provider.id,
      conversation_id: conv.id,
      model,
      operation: "chat",
      prompt_tokens: answer.prompt_tokens ?? 0,
      response_tokens: answer.response_tokens ?? 0,
      latency_ms: latency
    });
  } catch (err) {
    await fail(err.message);
  }
};
var jobs_default = { complete };
export {
  jobs_default as default
};
