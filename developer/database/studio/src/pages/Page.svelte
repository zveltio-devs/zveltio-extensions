<script lang="ts">
  import { onMount } from 'svelte';
  import { Database, Table2, Play, Search } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let tables = $state<any[]>([]);
  let q = $state('');
  let activeTable = $state<any | null>(null);
  let columns = $state<any[]>([]);
  let rows = $state<any[]>([]);
  let rowCount = $state(0);
  let loading = $state(false);
  let error = $state('');

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadTables() {
    loading = true; error = '';
    try {
      const r = await api('/api/database/tables');
      tables = (r.data ?? r.tables ?? []).filter((t: any) => !t.name?.startsWith('zv_') || t.is_data);
    } catch (e: any) { error = e.message; }
    finally { loading = false; }
  }

  async function openTable(t: any) {
    activeTable = t;
    try {
      const r = await api(`/api/database/tables/${encodeURIComponent(t.name)}`);
      columns = r.columns ?? r.data?.columns ?? [];
      rows = r.rows ?? r.data?.rows ?? [];
      rowCount = r.row_count ?? r.data?.row_count ?? rows.length;
    } catch (e: any) { error = e.message; }
  }

  let filteredTables = $derived(
    q ? tables.filter((t) => (t.name as string).toLowerCase().includes(q.toLowerCase())) : tables,
  );

  onMount(loadTables);
</script>

<div class="p-6 space-y-4">
  <header><h1 class="text-2xl font-semibold flex items-center gap-2"><Database class="h-6 w-6" /> Database</h1></header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="grid grid-cols-12 gap-4">
    <aside class="col-span-3">
      <div class="bg-base-100 rounded-lg shadow">
        <div class="p-3 border-b">
          <div class="font-medium mb-2">Tables ({tables.length})</div>
          <div class="join w-full">
            <input class="input input-xs input-bordered join-item flex-1" placeholder="Filter..." bind:value={q} />
            <button class="btn btn-xs join-item" onclick={loadTables}><Search class="h-3 w-3" /></button>
          </div>
        </div>
        <ul class="menu menu-sm max-h-[60vh] overflow-y-auto">
          {#if loading}
            <li class="p-3 text-base-content/60">Loading…</li>
          {:else if filteredTables.length === 0}
            <li class="p-3 text-base-content/60">No tables.</li>
          {:else}
            {#each filteredTables as t (t.name)}
              <li>
                <button class="font-mono text-xs gap-1" class:active={activeTable?.name === t.name} onclick={() => openTable(t)}>
                  <Table2 class="h-3.5 w-3.5 shrink-0" /> {t.name}
                </button>
              </li>
            {/each}
          {/if}
        </ul>
      </div>
    </aside>

    <main class="col-span-9">
      {#if !activeTable}
        <div class="bg-base-100 rounded-lg p-12 text-center text-base-content/60">Select a table to inspect.</div>
      {:else}
        <div class="bg-base-100 rounded-lg shadow">
          <div class="p-3 border-b flex items-center justify-between">
            <div>
              <div class="font-mono font-medium">{activeTable.name}</div>
              <div class="text-xs text-base-content/60">{rowCount.toLocaleString()} rows · {columns.length} columns</div>
            </div>
          </div>

          <div class="p-3 border-b">
            <div class="font-medium text-sm mb-2">Schema</div>
            <table class="table table-xs">
              <thead><tr><th>Column</th><th>Type</th><th>Nullable</th><th>Default</th></tr></thead>
              <tbody>
                {#each columns as c (c.name)}
                  <tr><td class="font-mono">{c.name}</td><td><span class="badge badge-ghost badge-xs">{c.type ?? c.data_type}</span></td><td>{c.nullable ?? c.is_nullable ? 'yes' : 'no'}</td><td class="font-mono text-xs text-base-content/60">{c.default ?? '—'}</td></tr>
                {/each}
              </tbody>
            </table>
          </div>

          <div class="p-3">
            <div class="font-medium text-sm mb-2">Sample rows</div>
            <div class="overflow-x-auto">
              <table class="table table-xs">
                <thead><tr>{#each columns.slice(0, 8) as c (c.name)}<th class="font-mono">{c.name}</th>{/each}</tr></thead>
                <tbody>
                  {#if rows.length === 0}
                    <tr><td colspan={Math.max(1, columns.length)} class="text-center py-6 text-base-content/60">No rows.</td></tr>
                  {:else}
                    {#each rows.slice(0, 50) as row, idx (idx)}
                      <tr>
                        {#each columns.slice(0, 8) as c (c.name)}
                          <td class="max-w-xs truncate">{
                            row[c.name] === null ? '—'
                            : typeof row[c.name] === 'object' ? JSON.stringify(row[c.name])
                            : String(row[c.name])
                          }</td>
                        {/each}
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>
            {#if rows.length > 50}
              <div class="text-xs text-base-content/60 mt-2">Showing first 50 of {rowCount}.</div>
            {/if}
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>
