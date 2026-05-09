<script lang="ts">
  import { onMount } from 'svelte';
  import { Plug, Plus, X, Webhook, ListChecks } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';
  let tab = $state<'connections' | 'webhooks' | 'logs'>('connections');
  let connections = $state<any[]>([]);
  let webhooks = $state<any[]>([]);
  let logs = $state<any[]>([]);
  let error = $state('');

  let showForm = $state(false);
  let saving = $state(false);
  let form = $state({
    name: '',
    base_url: '',
    auth_type: 'none' as 'none' | 'bearer' | 'basic' | 'oauth2',
    auth_token: '',
    auth_username: '',
    auth_password: '',
    headers: '{}',
  });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }
  async function loadConnections() { try { const r = await api('/api/connector/connections'); connections = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadWebhooks() { try { const r = await api('/api/connector/incoming-webhooks'); webhooks = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadLogs() { try { const r = await api('/api/connector/logs?limit=100'); logs = r.data ?? []; } catch (e: any) { error = e.message; } }

  async function createConnection() {
    saving = true; error = '';
    try {
      let extraHeaders: any = {};
      try { extraHeaders = JSON.parse(form.headers); } catch { throw new Error('Invalid JSON in headers'); }
      await api('/api/connector/connections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, headers: extraHeaders }),
      });
      showForm = false;
      form = { name: '', base_url: '', auth_type: 'none', auth_token: '', auth_username: '', auth_password: '', headers: '{}' };
      await loadConnections();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  async function deleteConnection(id: string) {
    if (!confirm('Delete connection?')) return;
    try { await api(`/api/connector/connections/${id}`, { method: 'DELETE' }); await loadConnections(); }
    catch (e: any) { error = e.message; }
  }

  $effect(() => {
    if (tab === 'connections') loadConnections();
    else if (tab === 'webhooks') loadWebhooks();
    else loadLogs();
  });
  onMount(loadConnections);
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Plug class="h-6 w-6" /> API Connector</h1>
    {#if tab === 'connections'}<button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}><Plus class="h-4 w-4" /> New connection</button>{/if}
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div role="tablist" class="tabs tabs-bordered">
    <button role="tab" class:tab-active={tab === 'connections'} class="tab gap-2" onclick={() => (tab = 'connections')}><Plug class="h-4 w-4" /> Connections</button>
    <button role="tab" class:tab-active={tab === 'webhooks'} class="tab gap-2" onclick={() => (tab = 'webhooks')}><Webhook class="h-4 w-4" /> Incoming webhooks</button>
    <button role="tab" class:tab-active={tab === 'logs'} class="tab gap-2" onclick={() => (tab = 'logs')}><ListChecks class="h-4 w-4" /> Call logs</button>
  </div>

  {#if tab === 'connections'}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {#if connections.length === 0}
        <div class="col-span-full bg-base-100 rounded-lg p-12 text-center text-base-content/60">No external API connections yet.</div>
      {:else}
        {#each connections as c (c.id)}
          <div class="bg-base-100 rounded-lg shadow p-4">
            <div class="flex items-start justify-between mb-2">
              <div class="font-medium">{c.name}</div>
              <span class="badge badge-ghost badge-sm">{c.auth_type}</span>
            </div>
            <div class="text-xs text-base-content/60 font-mono break-all">{c.base_url}</div>
            <div class="flex justify-end mt-3"><button class="btn btn-ghost btn-xs" onclick={() => deleteConnection(c.id)}>Delete</button></div>
          </div>
        {/each}
      {/if}
    </div>
  {:else if tab === 'webhooks'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Name</th><th>URL</th><th>Created</th><th>Last received</th></tr></thead>
        <tbody>
          {#if webhooks.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No incoming webhook endpoints.</td></tr>
          {:else}{#each webhooks as w (w.id)}
            <tr><td>{w.name}</td><td class="font-mono text-xs"><code>{engineUrl}/api/webhook/{w.slug}</code></td><td>{w.created_at?.slice(0, 10)}</td><td>{w.last_received_at?.slice(0, 16).replace('T', ' ') ?? 'never'}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Time</th><th>Connection</th><th>Method</th><th>URL</th><th>Status</th><th>Duration</th></tr></thead>
        <tbody>
          {#if logs.length === 0}<tr><td colspan="6" class="text-center py-6 text-base-content/60">No call logs.</td></tr>
          {:else}{#each logs as l (l.id)}
            <tr><td>{l.created_at?.slice(0, 19).replace('T', ' ')}</td><td>{l.connection_name ?? '—'}</td><td><span class="badge badge-ghost badge-sm">{l.method}</span></td><td class="font-mono text-xs max-w-md truncate">{l.url}</td><td><span class="badge badge-sm" class:badge-success={l.status_code < 400} class:badge-error={l.status_code >= 400}>{l.status_code}</span></td><td>{l.duration_ms ?? '—'} ms</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New API connection</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="space-y-3">
        <div><label class="label label-text">Name</label><input class="input input-bordered w-full" bind:value={form.name} /></div>
        <div><label class="label label-text">Base URL</label><input class="input input-bordered w-full font-mono" bind:value={form.base_url} placeholder="https://api.example.com" /></div>
        <div>
          <label class="label label-text">Auth</label>
          <select class="select select-bordered w-full" bind:value={form.auth_type}>
            <option value="none">None</option><option value="bearer">Bearer token</option><option value="basic">Basic auth</option><option value="oauth2">OAuth 2.0</option>
          </select>
        </div>
        {#if form.auth_type === 'bearer'}
          <div><label class="label label-text">Token</label><input type="password" class="input input-bordered w-full font-mono" bind:value={form.auth_token} /></div>
        {:else if form.auth_type === 'basic'}
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label label-text">Username</label><input class="input input-bordered w-full" bind:value={form.auth_username} /></div>
            <div><label class="label label-text">Password</label><input type="password" class="input input-bordered w-full" bind:value={form.auth_password} /></div>
          </div>
        {/if}
        <div><label class="label label-text">Extra headers (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="4" bind:value={form.headers}></textarea></div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !form.name || !form.base_url} onclick={createConnection}>{saving ? 'Saving…' : 'Create'}</button></div>
    </div>
  </div>
{/if}
