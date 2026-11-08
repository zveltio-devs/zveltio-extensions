// The jobs as the engine runs them: the PACKED `engine/jobs.js`, in the
// engine's own Deno runner (`runInDeno`, ADR 0022), with no permissions — every
// collection call, slot read and request a message the test answers. Each
// request is also checked against the operator's binding of the `provider` slot,
// which is all the engine would let the job reach (ADR 0026).
import { beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;
type Row = Record<string, Any>;

const ENGINE = join(import.meta.dir, '../../../zveltio/packages/engine/src');
const manifest = JSON.parse(readFileSync(join(import.meta.dir, '../manifest.json'), 'utf8'));
const code = new Uint8Array(readFileSync(join(import.meta.dir, 'jobs.js')));

let runInDeno: (r: Any) => Promise<void>;
let deno = '';

beforeAll(async () => {
  process.env.ZVELTIO_EXT_TRANSPORT = 'process';
  ({ runInDeno } = await import(join(ENGINE, 'lib/extensions/job-runner.ts')));
  deno = await (await import(join(ENGINE, 'lib/extensions/deno.ts'))).ensureDeno();
}, 120_000);

const b64 = (s: string) => Buffer.from(s).toString('base64');

interface Answer {
  status?: number;
  body?: string;
  type?: string;
}
type Route = (req: { url: URL; method: string; headers: Headers; body: string }) => Answer;

/** An in-memory data API, an operator's slot binding and scripted remotes, as one job's host. */
function world(routes: Record<string, Route>, bound: string[] = ['llm.example.com']) {
  const store: Record<string, Map<string, Row>> = {};
  const table = (c: string) => (store[c] ??= new Map());
  const seen: { method: string; url: string; headers: Headers; body: string }[] = [];
  const put = (c: string, row: Row) => {
    const r = { id: crypto.randomUUID(), tenant_id: 't1', ...row };
    table(c).set(r.id, r);
    return r;
  };
  async function run(job: string, input: unknown) {
    const def = manifest.jobs.find((j: Row) => j.name === job);
    const call = async (name: string, a: Any[]) => {
      switch (name) {
        case 'collections.read':
          return table(a[0]).get(a[1]) ?? null;
        case 'collections.list': {
          const f = (a[1]?.filter ?? {}) as Record<string, { eq: Any }>;
          const records = [...table(a[0]).values()].filter((r) => Object.entries(f).every(([k, v]) => r[k] === v.eq));
          if (a[1]?.sort) records.sort((x, y) => String(y[a[1].sort]).localeCompare(String(x[a[1].sort])));
          return { records: records.slice(0, a[1]?.limit ?? records.length) };
        }
        case 'collections.insert':
          return put(a[0], a[1]);
        case 'collections.update': {
          const row = table(a[0]).get(a[1]);
          for (const [f, vs] of Object.entries((a[3]?.expect ?? {}) as Record<string, Any[]>)) {
            if (!vs.includes(row?.[f])) throw Object.assign(new Error('precondition failed'), { status: 409 });
          }
          const next = { ...row, ...a[2] };
          table(a[0]).set(a[1], next);
          return next;
        }
        case 'egress.slot':
          expect(def.egressSlots).toContain(a[0]);
          return bound;
        case 'fetch': {
          const req = a[0] as { url: string; method: string; headers: [string, string][]; body: string | null };
          const url = new URL(req.url);
          expect(bound).toContain(url.host);
          const headers = new Headers(req.headers);
          const body = req.body ? Buffer.from(req.body, 'base64').toString('utf8') : '';
          seen.push({ method: req.method, url: req.url, headers, body });
          const route = routes[`${req.method} ${url.origin}${url.pathname}`];
          if (!route) throw new Error(`no stub for ${req.method} ${req.url}`);
          const ans = route({ url, method: req.method, headers, body });
          return {
            url: req.url,
            redirected: false,
            status: ans.status ?? 200,
            statusText: '',
            headers: [['content-type', ans.type ?? 'application/json']],
            body: b64(ans.body ?? ''),
          };
        }
      }
      throw new Error(`unexpected host call ${name}`);
    };
    await runInDeno({
      extName: manifest.name,
      deno,
      code,
      job,
      input,
      timezone: 'UTC',
      memoryMb: 128,
      timeoutSeconds: 30,
      call,
    });
  }
  return { table, put, run, seen };
}

const LLM = 'https://llm.example.com';
const T1 = '2026-11-08T10:00:00.000Z';
const T2 = '2026-11-08T10:01:00.000Z';

/** A provider, a conversation with one finished turn, and a new question with its pending answer (both at T2). */
function setup(w: ReturnType<typeof world>, provider: Row = {}, conv: Row = {}) {
  const p = w.put('ai_providers', {
    name: 'p',
    kind: 'openai',
    base_url: `${LLM}/v1`,
    api_key: 'sk-1',
    default_model: 'm-default',
    is_active: true,
    is_default: true,
    ...provider,
  });
  const c = w.put('ai_conversations', { system_prompt: 'Be brief.', ...conv });
  const msg = (role: string, content: string, at: string, status = 'done') =>
    w.put('ai_messages', { conversation_id: c.id, role, content, status, created_at: at, created_by: 'u1' });
  // Inserted answer-first, as a shared timestamp gives no order.
  msg('assistant', 'Hello.', T1);
  msg('user', 'Hi', T1);
  msg('user', 'Old failed', '2026-11-08T09:00:00.000Z', 'failed');
  msg('user', 'And now?', T2);
  const answer = msg('assistant', '', T2, 'pending');
  return { p, c, answer };
}

const chat = (content: string, usage = { prompt_tokens: 7, completion_tokens: 3 }) => () => ({
  body: JSON.stringify({ choices: [{ message: { content } }], usage }),
});

describe('complete', () => {
  it('sends the history in order to an OpenAI-shaped provider and records the answer and the usage', async () => {
    const w = world({ [`POST ${LLM}/v1/chat/completions`]: chat('Fine.') });
    const { p, c, answer } = setup(w);
    await w.run('complete', { id: answer.id });
    const req = w.seen[0]!;
    expect(req.headers.get('authorization')).toBe('Bearer sk-1');
    expect(JSON.parse(req.body)).toMatchObject({
      model: 'm-default',
      messages: [
        { role: 'system', content: 'Be brief.' },
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello.' },
        { role: 'user', content: 'And now?' },
      ],
    });
    expect(w.table('ai_messages').get(answer.id)).toMatchObject({
      status: 'done',
      content: 'Fine.',
      model: 'm-default',
      prompt_tokens: 7,
      response_tokens: 3,
    });
    expect([...w.table('ai_usage').values()]).toEqual([
      expect.objectContaining({ provider_id: p.id, conversation_id: c.id, prompt_tokens: 7, response_tokens: 3 }),
    ]);
  });

  it('speaks the Anthropic messages API, with the system prompt apart and the template filling the model', async () => {
    const w = world({
      [`POST ${LLM}/v1/messages`]: () => ({
        body: JSON.stringify({ content: [{ type: 'text', text: 'Ok.' }], usage: { input_tokens: 5, output_tokens: 1 } }),
      }),
    });
    const tpl = w.put('ai_prompt_templates', { name: 't', system_prompt: 'Template.', model: 'm-tpl', max_tokens: 99 });
    const { answer } = setup(w, { kind: 'anthropic' }, { system_prompt: null, template_id: tpl.id });
    await w.run('complete', { id: answer.id });
    const req = w.seen[0]!;
    expect(req.headers.get('x-api-key')).toBe('sk-1');
    const body = JSON.parse(req.body);
    expect(body).toMatchObject({ model: 'm-tpl', max_tokens: 99, system: 'Template.' });
    expect(body.messages[0]).toEqual({ role: 'user', content: 'Hi' });
    expect(w.table('ai_messages').get(answer.id)).toMatchObject({ status: 'done', content: 'Ok.', prompt_tokens: 5 });
  });

  it('fails the answer, without leaking the key, when the provider refuses', async () => {
    const w = world({
      [`POST ${LLM}/v1/chat/completions`]: () => ({ status: 401, body: '{"error":{"message":"bad key"}}' }),
    });
    const { answer } = setup(w);
    await w.run('complete', { id: answer.id });
    const row = w.table('ai_messages').get(answer.id)!;
    expect(row).toMatchObject({ status: 'failed' });
    expect(row.error).toContain('HTTP 401: bad key');
    expect(row.error).not.toContain('sk-1');
    expect(w.table('ai_usage').size).toBe(0);
  });

  it('fails without a request when the slot is unbound or no provider is active', async () => {
    const w1 = world({}, []);
    const s1 = setup(w1);
    await w1.run('complete', { id: s1.answer.id });
    expect(w1.table('ai_messages').get(s1.answer.id)!.error).toContain('"provider" egress slot');

    const w2 = world({});
    const s2 = setup(w2, { is_default: false });
    await w2.run('complete', { id: s2.answer.id });
    expect(w2.table('ai_messages').get(s2.answer.id)!.error).toContain('No active AI provider');
    expect([...w1.seen, ...w2.seen]).toHaveLength(0);
  });

  it('leaves an answer that is no longer pending alone', async () => {
    const w = world({});
    const { answer } = setup(w);
    w.table('ai_messages').set(answer.id, { ...answer, status: 'running' });
    await w.run('complete', { id: answer.id });
    expect(w.table('ai_messages').get(answer.id)!.status).toBe('running');
  });
});
