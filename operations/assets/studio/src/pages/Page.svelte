<script lang="ts">
  import { onMount } from 'svelte';
  import { Building, Plus, X, Wrench, TrendingDown } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let tab = $state<'register' | 'maintenance' | 'depreciation'>('register');
  let assets = $state<any[]>([]);
  let maintenance = $state<any[]>([]);
  let depreciation = $state<any[]>([]);
  let error = $state('');

  let showForm = $state(false);
  let saving = $state(false);
  let form = $state({
    name: '', asset_tag: '', category: 'equipment',
    purchase_date: new Date().toISOString().slice(0, 10),
    purchase_cost: 0, useful_life_years: 5,
    depreciation_method: 'straight_line', currency: 'RON',
  });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadAssets() { try { const r = await api('/api/assets'); assets = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadMaintenance() { try { const r = await api('/api/assets/maintenance'); maintenance = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadDepreciation() { try { const r = await api('/api/assets/depreciation'); depreciation = r.data ?? []; } catch (e: any) { error = e.message; } }

  async function createAsset() {
    saving = true; error = '';
    try {
      await api('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      showForm = false;
      form = { name: '', asset_tag: '', category: 'equipment', purchase_date: new Date().toISOString().slice(0, 10), purchase_cost: 0, useful_life_years: 5, depreciation_method: 'straight_line', currency: 'RON' };
      await loadAssets();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  $effect(() => {
    if (tab === 'register') loadAssets();
    else if (tab === 'maintenance') loadMaintenance();
    else loadDepreciation();
  });
  onMount(loadAssets);

  function fmtMoney(n: number, c = 'RON') { return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: c }).format(n); }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Building class="h-6 w-6" /> Fixed Assets</h1>
    {#if tab === 'register'}<button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}><Plus class="h-4 w-4" /> New asset</button>{/if}
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div role="tablist" class="tabs tabs-bordered">
    <button role="tab" class:tab-active={tab === 'register'} class="tab gap-2" onclick={() => (tab = 'register')}><Building class="h-4 w-4" /> Register</button>
    <button role="tab" class:tab-active={tab === 'maintenance'} class="tab gap-2" onclick={() => (tab = 'maintenance')}><Wrench class="h-4 w-4" /> Maintenance</button>
    <button role="tab" class:tab-active={tab === 'depreciation'} class="tab gap-2" onclick={() => (tab = 'depreciation')}><TrendingDown class="h-4 w-4" /> Depreciation</button>
  </div>

  {#if tab === 'register'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Tag</th><th>Name</th><th>Category</th><th>Acquired</th><th class="text-right">Cost</th><th class="text-right">NBV</th><th>Status</th></tr></thead>
        <tbody>
          {#if assets.length === 0}<tr><td colspan="7" class="text-center py-6 text-base-content/60">No assets.</td></tr>
          {:else}{#each assets as a (a.id)}
            <tr><td class="font-mono">{a.asset_tag}</td><td>{a.name}</td><td><span class="badge badge-ghost badge-sm">{a.category}</span></td><td>{a.purchase_date}</td><td class="text-right">{fmtMoney(Number(a.purchase_cost), a.currency)}</td><td class="text-right">{fmtMoney(Number(a.net_book_value ?? a.purchase_cost), a.currency)}</td><td><span class="badge badge-sm">{a.status ?? 'active'}</span></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else if tab === 'maintenance'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Asset</th><th>Date</th><th>Description</th><th class="text-right">Cost</th><th>Status</th></tr></thead>
        <tbody>
          {#if maintenance.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No maintenance records.</td></tr>
          {:else}{#each maintenance as m (m.id)}
            <tr><td>{m.asset_name ?? m.asset_id}</td><td>{m.maintenance_date}</td><td class="max-w-xs truncate">{m.description}</td><td class="text-right">{fmtMoney(Number(m.cost ?? 0))}</td><td><span class="badge badge-sm">{m.status}</span></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Asset</th><th>Period</th><th class="text-right">Depreciation</th><th class="text-right">Accumulated</th><th class="text-right">NBV</th></tr></thead>
        <tbody>
          {#if depreciation.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No depreciation entries.</td></tr>
          {:else}{#each depreciation as d (d.id)}
            <tr><td>{d.asset_name}</td><td>{d.period}</td><td class="text-right">{fmtMoney(Number(d.depreciation_amount))}</td><td class="text-right">{fmtMoney(Number(d.accumulated))}</td><td class="text-right">{fmtMoney(Number(d.net_book_value))}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New asset</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-1"><label class="label label-text">Tag</label><input class="input input-bordered w-full font-mono" bind:value={form.asset_tag} /></div>
        <div class="col-span-1"><label class="label label-text">Category</label><select class="select select-bordered w-full" bind:value={form.category}><option value="equipment">Equipment</option><option value="vehicle">Vehicle</option><option value="building">Building</option><option value="furniture">Furniture</option><option value="other">Other</option></select></div>
        <div class="col-span-2"><label class="label label-text">Name</label><input class="input input-bordered w-full" bind:value={form.name} /></div>
        <div><label class="label label-text">Acquired</label><input type="date" class="input input-bordered w-full" bind:value={form.purchase_date} /></div>
        <div><label class="label label-text">Useful life (years)</label><input type="number" class="input input-bordered w-full" bind:value={form.useful_life_years} /></div>
        <div><label class="label label-text">Cost</label><input type="number" step="0.01" class="input input-bordered w-full" bind:value={form.purchase_cost} /></div>
        <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" bind:value={form.currency} maxlength="3" /></div>
        <div class="col-span-2"><label class="label label-text">Depreciation method</label><select class="select select-bordered w-full" bind:value={form.depreciation_method}><option value="straight_line">Straight line</option><option value="declining_balance">Declining balance</option></select></div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !form.name || !form.asset_tag} onclick={createAsset}>{saving ? 'Saving…' : 'Create'}</button></div>
    </div>
  </div>
{/if}
