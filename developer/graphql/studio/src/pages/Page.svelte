<script lang="ts">
  import { onMount } from 'svelte';
  import { Network, Play, Save } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';
  let tab = $state<'playground' | 'logs' | 'persisted' | 'policies'>('playground');
  let logs = $state<any[]>([]);
  let persisted = $state<any[]>([]);
  let policies = $state<any[]>([]);
  let error = $state('');

  let queryText = $state('{\n  collections {\n    name\n    display_name\n  }\n}');
  let queryResult = $state('');
  let running = $state(false);

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function runQuery() {
    running = true; error = ''; queryResult = '';
    try {
      const res = await fetch(`${engineUrl}/api/graphql`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });
      const json = await res.json();
      queryResult = JSON.stringify(json, null, 2);
    } catch (e: any) { error = e.message; }
    finally { running = false; }
  }

  async function loadLogs() { try { const r = await api('/api/graphql/operations?limit=100'); logs = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadPersisted() { try { const r = await api('/api/graphql/persisted'); persisted = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadPolicies() { try { const r = await api('/api/graphql/field-policies'); policies = r.data ?? []; } catch (e: any) { error = e.message; } }

  $effect(() => {
    if (tab === 'logs') loadLogs();
    else if (tab === 'persisted') loadPersisted();
    else if (tab === 'policies') loadPolicies();
  });
</script>

<div class="p-6 space-y-4">
  <header><h1 class="text-2xl font-semibold flex items-center gap-2"><Network class="h-6 w-6" /> GraphQL</h1></header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div role="tablist" class="tabs tabs-bordered">
    <button role="tab" class:tab-active={tab === 'playground'} class="tab gap-2" onclick={() => (tab = 'playground')}><Play class="h-4 w-4" /> Playground</button>
    <button role="tab" class:tab-active={tab === 'logs'} class="tab" onclick={() => (tab = 'logs')}>Operation logs</button>
    <button role="tab" class:tab-active={tab === 'persisted'} class="tab gap-2" onclick={() => (tab = 'persisted')}><Save class="h-4 w-4" /> Persisted queries</button>
    <button role="tab" class:tab-active={tab === 'policies'} class="tab" onclick={() => (tab = 'policies')}>Field policies</button>
  </div>

  {#if tab === 'playground'}
    <div class="grid grid-cols-2 gap-4 h-[60vh]">
      <div class="bg-base-100 rounded-lg shadow flex flex-col">
        <div class="p-3 border-b flex items-center justify-between"><span class="font-medium text-sm">Query</span><button class="btn btn-primary btn-sm gap-2" disabled={running} onclick={runQuery}><Play class="h-3 w-3" /> {running ? 'Running…' : 'Run'}</button></div>
        <textarea class="textarea textarea-ghost flex-1 font-mono text-sm rounded-none" bind:value={queryText}></textarea>
      </div>
      <div class="bg-base-100 rounded-lg shadow flex flex-col">
        <div class="p-3 border-b font-medium text-sm">Response</div>
        <pre class="flex-1 p-3 overflow-auto font-mono text-xs">{queryResult || '(run a query to see output)'}</pre>
      </div>
    </div>
  {:else if tab === 'logs'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Time</th><th>Operation</th><th>User</th><th>Duration</th><th>Status</th></tr></thead>
        <tbody>
          {#if logs.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No operations logged.</td></tr>
          {:else}{#each logs as l (l.id)}
            <tr><td>{l.created_at?.slice(0, 19).replace('T', ' ')}</td><td class="font-mono text-xs max-w-xs truncate">{l.operation_name ?? l.query_preview}</td><td>{l.user_id ?? 'anon'}</td><td>{l.duration_ms ?? '—'} ms</td><td><span class="badge badge-sm" class:badge-error={l.error}>{l.error ? 'error' : 'ok'}</span></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else if tab === 'persisted'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>ID</th><th>Operation</th><th>Created</th></tr></thead>
        <tbody>
          {#if persisted.length === 0}<tr><td colspan="3" class="text-center py-6 text-base-content/60">No persisted queries.</td></tr>
          {:else}{#each persisted as p (p.id)}
            <tr><td class="font-mono text-xs">{p.id?.slice(0, 16)}…</td><td class="font-mono text-xs max-w-md truncate">{p.operation_name ?? p.query_preview}</td><td>{p.created_at?.slice(0, 10)}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Type</th><th>Field</th><th>Roles</th><th>Mode</th></tr></thead>
        <tbody>
          {#if policies.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No field policies — all fields readable.</td></tr>
          {:else}{#each policies as p (p.id)}
            <tr><td class="font-mono">{p.type_name}</td><td class="font-mono">{p.field_name}</td><td class="text-xs">{(p.allowed_roles ?? []).join(', ') || '—'}</td><td><span class="badge badge-sm">{p.mode ?? 'allow'}</span></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>
