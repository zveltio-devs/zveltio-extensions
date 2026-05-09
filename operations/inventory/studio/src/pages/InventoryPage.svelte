<script lang="ts">
  import { onMount } from 'svelte';
  import { Boxes, Plus, Search, X, Warehouse, Package } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let tab = $state<'products' | 'warehouses' | 'stock'>('products');
  let products = $state<any[]>([]);
  let warehouses = $state<any[]>([]);
  let stock = $state<any[]>([]);
  let loading = $state(false);
  let error = $state('');
  let q = $state('');

  let showProductForm = $state(false);
  let saving = $state(false);
  let productForm = $state({
    sku: '', name: '', description: '', price: 0, currency: 'RON', tax_rate: 19, is_active: true,
  });

  let showWarehouseForm = $state(false);
  let warehouseForm = $state({ name: '', code: '', address: '' });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadProducts() {
    loading = true; error = '';
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const res = await api(`/api/inventory/products?${params}`);
      products = res.data ?? [];
    } catch (e: any) { error = e.message; }
    finally { loading = false; }
  }

  async function loadWarehouses() {
    try {
      const res = await api('/api/inventory/warehouses');
      warehouses = res.data ?? [];
    } catch (e: any) { error = e.message; }
  }

  async function loadStock() {
    try {
      const res = await api('/api/inventory/stock-levels');
      stock = res.data ?? [];
    } catch (e: any) { error = e.message; }
  }

  async function createProduct() {
    saving = true; error = '';
    try {
      await api('/api/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });
      showProductForm = false;
      productForm = { sku: '', name: '', description: '', price: 0, currency: 'RON', tax_rate: 19, is_active: true };
      await loadProducts();
    } catch (e: any) { error = e.message; }
    finally { saving = false; }
  }

  async function createWarehouse() {
    saving = true; error = '';
    try {
      await api('/api/inventory/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warehouseForm),
      });
      showWarehouseForm = false;
      warehouseForm = { name: '', code: '', address: '' };
      await loadWarehouses();
    } catch (e: any) { error = e.message; }
    finally { saving = false; }
  }

  $effect(() => {
    if (tab === 'products') loadProducts();
    else if (tab === 'warehouses') loadWarehouses();
    else loadStock();
  });

  onMount(() => { loadProducts(); loadWarehouses(); });

  function fmtMoney(n: number, c = 'RON') { return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: c }).format(n); }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Boxes class="h-6 w-6" /> Inventory</h1>
    <div class="flex gap-2">
      {#if tab === 'products'}
        <button class="btn btn-primary btn-sm gap-2" onclick={() => (showProductForm = true)}><Plus class="h-4 w-4" /> New product</button>
      {:else if tab === 'warehouses'}
        <button class="btn btn-primary btn-sm gap-2" onclick={() => (showWarehouseForm = true)}><Plus class="h-4 w-4" /> New warehouse</button>
      {/if}
    </div>
  </header>

  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div role="tablist" class="tabs tabs-bordered">
    <button role="tab" class:tab-active={tab === 'products'} class="tab gap-2" onclick={() => (tab = 'products')}><Package class="h-4 w-4" /> Products</button>
    <button role="tab" class:tab-active={tab === 'warehouses'} class="tab gap-2" onclick={() => (tab = 'warehouses')}><Warehouse class="h-4 w-4" /> Warehouses</button>
    <button role="tab" class:tab-active={tab === 'stock'} class="tab gap-2" onclick={() => (tab = 'stock')}><Boxes class="h-4 w-4" /> Stock levels</button>
  </div>

  {#if tab === 'products'}
    <div class="join">
      <input class="input input-sm input-bordered join-item" placeholder="Search SKU / name..." bind:value={q} onkeydown={(e) => e.key === 'Enter' && loadProducts()} />
      <button class="btn btn-sm join-item" onclick={loadProducts}><Search class="h-4 w-4" /></button>
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>SKU</th><th>Name</th><th class="text-right">Price</th><th>VAT</th><th>Active</th></tr></thead>
        <tbody>
          {#if loading}<tr><td colspan="5" class="text-center py-6 text-base-content/60">Loading…</td></tr>
          {:else if products.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No products.</td></tr>
          {:else}
            {#each products as p (p.id)}
              <tr><td class="font-mono text-xs">{p.sku}</td><td>{p.name}</td><td class="text-right">{fmtMoney(Number(p.price), p.currency)}</td><td>{p.tax_rate}%</td><td>{p.is_active ? '✓' : '—'}</td></tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  {:else if tab === 'warehouses'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Code</th><th>Name</th><th>Address</th></tr></thead>
        <tbody>
          {#if warehouses.length === 0}<tr><td colspan="3" class="text-center py-6 text-base-content/60">No warehouses.</td></tr>
          {:else}{#each warehouses as w (w.id)}<tr><td class="font-mono">{w.code}</td><td>{w.name}</td><td>{w.address ?? '—'}</td></tr>{/each}{/if}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Product</th><th>Warehouse</th><th class="text-right">Quantity</th></tr></thead>
        <tbody>
          {#if stock.length === 0}<tr><td colspan="3" class="text-center py-6 text-base-content/60">No stock data.</td></tr>
          {:else}{#each stock as s (s.id)}<tr><td>{s.product_name ?? s.product_id}</td><td>{s.warehouse_name ?? s.warehouse_id}</td><td class="text-right font-medium {Number(s.quantity) <= 0 ? 'text-error' : ''}">{s.quantity}</td></tr>{/each}{/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if showProductForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showProductForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">New product</h2>
        <button class="btn btn-ghost btn-sm btn-square" onclick={() => (showProductForm = false)}><X class="h-4 w-4" /></button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-1"><label class="label label-text">SKU</label><input class="input input-bordered w-full" bind:value={productForm.sku} /></div>
        <div class="col-span-1"><label class="label label-text">Currency</label><input class="input input-bordered w-full" bind:value={productForm.currency} maxlength="3" /></div>
        <div class="col-span-2"><label class="label label-text">Name</label><input class="input input-bordered w-full" bind:value={productForm.name} /></div>
        <div class="col-span-2"><label class="label label-text">Description</label><textarea class="textarea textarea-bordered w-full" bind:value={productForm.description}></textarea></div>
        <div><label class="label label-text">Price</label><input type="number" step="0.01" class="input input-bordered w-full" bind:value={productForm.price} /></div>
        <div><label class="label label-text">VAT %</label><input type="number" step="0.01" class="input input-bordered w-full" bind:value={productForm.tax_rate} /></div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn btn-ghost" onclick={() => (showProductForm = false)}>Cancel</button>
        <button class="btn btn-primary" disabled={saving || !productForm.sku || !productForm.name} onclick={createProduct}>{saving ? 'Saving…' : 'Create'}</button>
      </div>
    </div>
  </div>
{/if}

{#if showWarehouseForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showWarehouseForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">New warehouse</h2>
        <button class="btn btn-ghost btn-sm btn-square" onclick={() => (showWarehouseForm = false)}><X class="h-4 w-4" /></button>
      </div>
      <div class="space-y-3">
        <div><label class="label label-text">Code</label><input class="input input-bordered w-full" bind:value={warehouseForm.code} /></div>
        <div><label class="label label-text">Name</label><input class="input input-bordered w-full" bind:value={warehouseForm.name} /></div>
        <div><label class="label label-text">Address</label><input class="input input-bordered w-full" bind:value={warehouseForm.address} /></div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn btn-ghost" onclick={() => (showWarehouseForm = false)}>Cancel</button>
        <button class="btn btn-primary" disabled={saving || !warehouseForm.code || !warehouseForm.name} onclick={createWarehouse}>{saving ? 'Saving…' : 'Create'}</button>
      </div>
    </div>
  </div>
{/if}
