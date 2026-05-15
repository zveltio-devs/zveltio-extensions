<script lang="ts">
  import { onMount } from 'svelte';
  import { ScanLine, Play, Square, Receipt } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let activeSession = $state<any>(null);
  let recentOrders = $state<any[]>([]);
  let zReports = $state<any[]>([]);
  let loading = $state(false);
  let error = $state('');
  let openingFloat = $state(0);
  let closingFloat = $state(0);

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadAll() {
    loading = true; error = '';
    try {
      const [active, orders, reports] = await Promise.all([
        api('/ext/operations/pos/sessions/active').catch(() => ({ data: null })),
        api('/ext/operations/pos/orders?limit=20'),
        api('/ext/operations/pos/z-reports?limit=10').catch(() => ({ data: [] })),
      ]);
      activeSession = active.data;
      recentOrders = orders.data ?? [];
      zReports = reports.data ?? [];
    } catch (e: any) { error = e.message; }
    finally { loading = false; }
  }

  async function openSession() {
    try {
      await api('/ext/operations/pos/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_float: openingFloat }),
      });
      await loadAll();
    } catch (e: any) { error = e.message; }
  }

  async function closeSession() {
    if (!activeSession) return;
    try {
      await api(`/ext/operations/pos/sessions/${activeSession.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closing_float: closingFloat }),
      });
      await loadAll();
    } catch (e: any) { error = e.message; }
  }

  onMount(loadAll);

  function fmtMoney(n: number) { return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(n); }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><ScanLine class="h-6 w-6" /> Point of Sale</h1>
  </header>

  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="bg-base-100 rounded-lg shadow p-4">
    {#if activeSession}
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-base-content/60">Session open since</div>
          <div class="font-medium">{new Date(activeSession.opened_at).toLocaleString()}</div>
          <div class="text-xs text-base-content/60">Opening float: {fmtMoney(Number(activeSession.opening_float))}</div>
        </div>
        <div class="flex gap-2 items-center">
          <input type="number" step="0.01" placeholder="Closing float" class="input input-sm input-bordered w-32" bind:value={closingFloat} />
          <button class="btn btn-error btn-sm gap-2" onclick={closeSession}><Square class="h-4 w-4" /> Close session</button>
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-between">
        <div class="text-base-content/70">No open session.</div>
        <div class="flex gap-2 items-center">
          <input type="number" step="0.01" placeholder="Opening float" class="input input-sm input-bordered w-32" bind:value={openingFloat} />
          <button class="btn btn-primary btn-sm gap-2" onclick={openSession}><Play class="h-4 w-4" /> Open session</button>
        </div>
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div class="bg-base-100 rounded-lg shadow">
      <div class="p-3 font-medium border-b flex items-center gap-2"><Receipt class="h-4 w-4" /> Recent orders</div>
      <table class="table table-sm">
        <thead><tr><th>Number</th><th>Time</th><th class="text-right">Total</th><th>Status</th></tr></thead>
        <tbody>
          {#if recentOrders.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No orders yet.</td></tr>
          {:else}{#each recentOrders as o (o.id)}
            <tr><td class="font-mono">{o.order_number}</td><td>{new Date(o.created_at).toLocaleTimeString()}</td><td class="text-right">{fmtMoney(Number(o.total))}</td><td><span class="badge badge-sm">{o.status}</span></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
    <div class="bg-base-100 rounded-lg shadow">
      <div class="p-3 font-medium border-b">Recent Z-reports</div>
      <table class="table table-sm">
        <thead><tr><th>Date</th><th class="text-right">Sales</th><th class="text-right">Orders</th></tr></thead>
        <tbody>
          {#if zReports.length === 0}<tr><td colspan="3" class="text-center py-6 text-base-content/60">No reports.</td></tr>
          {:else}{#each zReports as z (z.id)}
            <tr><td>{new Date(z.created_at).toLocaleDateString()}</td><td class="text-right">{fmtMoney(Number(z.total_sales))}</td><td class="text-right">{z.order_count}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
