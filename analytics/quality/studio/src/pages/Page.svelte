<script lang="ts">
  import { onMount } from 'svelte';
  import { ScanSearch, Play, AlertTriangle } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';
  let scans = $state<any[]>([]);
  let issues = $state<any[]>([]);
  let collections = $state<any[]>([]);
  let selectedCollection = $state('');
  let scanning = $state(false);
  let error = $state('');

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadAll() {
    try {
      const [s, c] = await Promise.all([api('/api/quality/scans'), api('/api/collections').catch(() => ({ collections: [] }))]);
      scans = s.data ?? [];
      collections = c.collections ?? [];
    } catch (e: any) { error = e.message; }
  }

  async function runScan() {
    if (!selectedCollection) return;
    scanning = true; error = '';
    try {
      const r = await api('/api/quality/scans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collection: selectedCollection }) });
      issues = r.issues ?? [];
      await loadAll();
    } catch (e: any) { error = e.message; }
    finally { scanning = false; }
  }

  async function viewIssues(scanId: string) {
    try { const r = await api(`/api/quality/scans/${scanId}/issues`); issues = r.data ?? []; } catch (e: any) { error = e.message; }
  }

  onMount(loadAll);

  function severityBadge(s: string) { return ({ critical: 'badge-error', high: 'badge-warning', info: 'badge-info' } as any)[s] ?? 'badge-ghost'; }
</script>

<div class="p-6 space-y-4">
  <header><h1 class="text-2xl font-semibold flex items-center gap-2"><ScanSearch class="h-6 w-6" /> Data Quality</h1></header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="bg-base-100 rounded-lg shadow p-4">
    <div class="flex gap-2 items-end">
      <div class="flex-1">
        <label class="label label-text">Collection</label>
        <select class="select select-bordered w-full" bind:value={selectedCollection}>
          <option value="">— Select collection —</option>
          {#each collections as c (c.name)}<option value={c.name}>{c.display_name ?? c.name}</option>{/each}
        </select>
      </div>
      <button class="btn btn-primary gap-2" disabled={scanning || !selectedCollection} onclick={runScan}>
        <Play class="h-4 w-4" /> {scanning ? 'Scanning…' : 'Run scan'}
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div class="bg-base-100 rounded-lg shadow">
      <div class="p-3 font-medium border-b">Scan history</div>
      <table class="table table-sm">
        <thead><tr><th>Collection</th><th>Date</th><th>Issues</th><th></th></tr></thead>
        <tbody>
          {#if scans.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No scans yet.</td></tr>
          {:else}{#each scans as s (s.id)}
            <tr><td>{s.collection}</td><td>{s.created_at?.slice(0, 16).replace('T', ' ')}</td><td><span class="badge badge-sm">{s.issue_count ?? 0}</span></td><td><button class="btn btn-ghost btn-xs" onclick={() => viewIssues(s.id)}>View</button></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
    <div class="bg-base-100 rounded-lg shadow">
      <div class="p-3 font-medium border-b flex items-center gap-2"><AlertTriangle class="h-4 w-4" /> Issues</div>
      <table class="table table-sm">
        <thead><tr><th>Severity</th><th>Type</th><th>Field</th><th>Description</th></tr></thead>
        <tbody>
          {#if issues.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No issues to show. Run a scan.</td></tr>
          {:else}{#each issues as i (i.id ?? `${i.field_name}-${i.issue_type}`)}
            <tr><td><span class="badge {severityBadge(i.severity)} badge-sm">{i.severity}</span></td><td>{i.issue_type}</td><td class="font-mono text-xs">{i.field_name ?? '—'}</td><td class="max-w-xs truncate">{i.description}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
