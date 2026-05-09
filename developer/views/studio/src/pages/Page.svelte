<script lang="ts">
  import { onMount } from 'svelte';
  import { LayoutGrid, Plus, X, List, Calendar, KanbanSquare, Map } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';
  let views = $state<any[]>([]);
  let collections = $state<any[]>([]);
  let error = $state('');

  let showForm = $state(false);
  let saving = $state(false);
  let form = $state({
    name: '',
    collection: '',
    view_type: 'list',
    config: '{\n  "columns": [],\n  "filters": [],\n  "sort": []\n}',
  });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function load() { try { const r = await api('/api/views'); views = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadCollections() { try { const r = await api('/api/collections'); collections = r.collections ?? r.data ?? []; } catch {} }

  async function createView() {
    saving = true; error = '';
    try {
      let cfg: any = {};
      try { cfg = JSON.parse(form.config); } catch { throw new Error('Invalid JSON in config'); }
      await api('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, config: cfg }) });
      showForm = false;
      form = { name: '', collection: '', view_type: 'list', config: '{\n  "columns": [],\n  "filters": [],\n  "sort": []\n}' };
      await load();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  async function deleteView(id: string) {
    if (!confirm('Delete view?')) return;
    try { await api(`/api/views/${id}`, { method: 'DELETE' }); await load(); }
    catch (e: any) { error = e.message; }
  }

  onMount(() => { load(); loadCollections(); });

  function viewIcon(t: string) {
    return ({ list: List, board: KanbanSquare, calendar: Calendar, map: Map, card: LayoutGrid } as any)[t] ?? List;
  }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><LayoutGrid class="h-6 w-6" /> Custom Views</h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}><Plus class="h-4 w-4" /> New view</button>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {#if views.length === 0}
      <div class="col-span-full bg-base-100 rounded-lg p-12 text-center text-base-content/60">No saved views yet.</div>
    {:else}
      {#each views as v (v.id)}
        {@const Icon = viewIcon(v.view_type)}
        <div class="bg-base-100 rounded-lg shadow p-4">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <Icon class="h-5 w-5 text-base-content/60" />
              <div class="font-medium">{v.name}</div>
            </div>
            <span class="badge badge-ghost badge-sm">{v.view_type}</span>
          </div>
          <div class="text-xs text-base-content/60 font-mono">{v.collection}</div>
          <div class="flex justify-end mt-3">
            <button class="btn btn-ghost btn-xs" onclick={() => deleteView(v.id)}>Delete</button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New view</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="space-y-3">
        <div><label class="label label-text">Name</label><input class="input input-bordered w-full" bind:value={form.name} /></div>
        <div>
          <label class="label label-text">Collection</label>
          <select class="select select-bordered w-full" bind:value={form.collection}>
            <option value="">—</option>
            {#each collections as c (c.name)}<option value={c.name}>{c.display_name ?? c.name}</option>{/each}
          </select>
        </div>
        <div>
          <label class="label label-text">View type</label>
          <select class="select select-bordered w-full" bind:value={form.view_type}>
            <option value="list">List</option>
            <option value="board">Kanban board</option>
            <option value="card">Card grid</option>
            <option value="calendar">Calendar</option>
            <option value="map">Map (requires PostGIS)</option>
          </select>
        </div>
        <div><label class="label label-text">Config (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="8" bind:value={form.config}></textarea></div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !form.name || !form.collection} onclick={createView}>{saving ? 'Saving…' : 'Create'}</button></div>
    </div>
  </div>
{/if}
