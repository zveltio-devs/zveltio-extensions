<script lang="ts">
  import { onMount } from 'svelte';
  import { ShoppingCart, Package, Tag, Truck } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let tab = $state<'orders' | 'products' | 'categories'>('orders');
  let orders = $state<any[]>([]);
  let products = $state<any[]>([]);
  let categories = $state<any[]>([]);
  let loading = $state(false);
  let error = $state('');

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadOrders() { try { const r = await api('/ext/ecommerce/store/orders?limit=50'); orders = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadProducts() { try { const r = await api('/ext/ecommerce/store/products?limit=100'); products = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadCategories() { try { const r = await api('/ext/ecommerce/store/categories'); categories = r.data ?? []; } catch (e: any) { error = e.message; } }

  $effect(() => {
    if (tab === 'orders') loadOrders();
    else if (tab === 'products') loadProducts();
    else loadCategories();
  });

  onMount(() => loadOrders());

  function fmtMoney(n: number, c = 'RON') { return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: c }).format(n); }
  function statusBadge(s: string) {
    return ({ pending: 'badge-warning', paid: 'badge-success', shipped: 'badge-info', delivered: 'badge-success', cancelled: 'badge-error' } as any)[s] ?? 'badge-ghost';
  }
</script>

<div class="p-6 space-y-4">
  <header><h1 class="text-2xl font-semibold flex items-center gap-2"><ShoppingCart class="h-6 w-6" /> eCommerce</h1></header>

  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div role="tablist" class="tabs tabs-bordered">
    <button role="tab" class:tab-active={tab === 'orders'} class="tab gap-2" onclick={() => (tab = 'orders')}><Truck class="h-4 w-4" /> Orders</button>
    <button role="tab" class:tab-active={tab === 'products'} class="tab gap-2" onclick={() => (tab = 'products')}><Package class="h-4 w-4" /> Products</button>
    <button role="tab" class:tab-active={tab === 'categories'} class="tab gap-2" onclick={() => (tab = 'categories')}><Tag class="h-4 w-4" /> Categories</button>
  </div>

  {#if tab === 'orders'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Number</th><th>Customer</th><th>Date</th><th class="text-right">Total</th><th>Status</th></tr></thead>
        <tbody>
          {#if orders.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No orders.</td></tr>
          {:else}{#each orders as o (o.id)}
            <tr><td class="font-mono">{o.order_number}</td><td>{o.customer_email ?? '—'}</td><td>{new Date(o.created_at).toLocaleDateString()}</td><td class="text-right">{fmtMoney(Number(o.total), o.currency)}</td><td><span class="badge {statusBadge(o.status)} badge-sm">{o.status}</span></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else if tab === 'products'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th class="text-right">Price</th><th class="text-right">Stock</th></tr></thead>
        <tbody>
          {#if products.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No products.</td></tr>
          {:else}{#each products as p (p.id)}
            <tr><td class="font-mono text-xs">{p.sku}</td><td>{p.name}</td><td>{p.category_name ?? '—'}</td><td class="text-right">{fmtMoney(Number(p.price), p.currency)}</td><td class="text-right">{p.stock_qty}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Slug</th><th>Name</th><th>Active</th></tr></thead>
        <tbody>
          {#if categories.length === 0}<tr><td colspan="3" class="text-center py-6 text-base-content/60">No categories.</td></tr>
          {:else}{#each categories as c (c.id)}
            <tr><td class="font-mono text-xs">{c.slug}</td><td>{c.name}</td><td>{c.is_active ? '✓' : '—'}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>
