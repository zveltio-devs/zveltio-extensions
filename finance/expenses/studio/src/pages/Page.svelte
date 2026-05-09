<script lang="ts">
  import { onMount } from 'svelte';
  import { Receipt, Plus, X, Check } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let expenses = $state<any[]>([]);
  let error = $state('');
  let statusFilter = $state<'all' | 'draft' | 'submitted' | 'approved' | 'reimbursed'>('all');
  let showForm = $state(false);
  let saving = $state(false);
  let form = $state({
    expense_date: new Date().toISOString().slice(0, 10),
    category: 'travel',
    description: '',
    amount: 0,
    currency: 'RON',
    vendor: '',
    receipt_url: '',
  });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function load() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const r = await api(`/api/expenses?${params}`);
      expenses = r.data ?? [];
    } catch (e: any) { error = e.message; }
  }

  async function createExpense() {
    saving = true; error = '';
    try {
      await api('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      showForm = false;
      form = { expense_date: new Date().toISOString().slice(0, 10), category: 'travel', description: '', amount: 0, currency: 'RON', vendor: '', receipt_url: '' };
      await load();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  async function approve(id: string) { try { await api(`/api/expenses/${id}/approve`, { method: 'POST' }); await load(); } catch (e: any) { error = e.message; } }

  $effect(() => { statusFilter; load(); });
  onMount(load);

  function fmtMoney(n: number, c = 'RON') { return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: c }).format(n); }
  function statusBadge(s: string) { return ({ draft: 'badge-ghost', submitted: 'badge-warning', approved: 'badge-success', reimbursed: 'badge-info', rejected: 'badge-error' } as any)[s] ?? 'badge-ghost'; }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Receipt class="h-6 w-6" /> Expenses</h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}><Plus class="h-4 w-4" /> New expense</button>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <select bind:value={statusFilter} class="select select-sm select-bordered max-w-xs">
    <option value="all">All</option>
    <option value="draft">Draft</option>
    <option value="submitted">Submitted</option>
    <option value="approved">Approved</option>
    <option value="reimbursed">Reimbursed</option>
  </select>

  <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
    <table class="table table-sm">
      <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th class="text-right">Amount</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {#if expenses.length === 0}<tr><td colspan="7" class="text-center py-6 text-base-content/60">No expenses.</td></tr>
        {:else}{#each expenses as e (e.id)}
          <tr><td>{e.expense_date}</td><td><span class="badge badge-ghost badge-sm">{e.category}</span></td><td>{e.vendor ?? '—'}</td><td class="max-w-xs truncate">{e.description}</td><td class="text-right">{fmtMoney(Number(e.amount), e.currency)}</td><td><span class="badge {statusBadge(e.status)} badge-sm">{e.status}</span></td><td>{#if e.status === 'submitted'}<button class="btn btn-ghost btn-xs" title="Approve" onclick={() => approve(e.id)}><Check class="h-3.5 w-3.5" /></button>{/if}</td></tr>
        {/each}{/if}
      </tbody>
    </table>
  </div>
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New expense</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label label-text">Date</label><input type="date" class="input input-bordered w-full" bind:value={form.expense_date} /></div>
        <div><label class="label label-text">Category</label><select class="select select-bordered w-full" bind:value={form.category}><option value="travel">Travel</option><option value="meals">Meals</option><option value="office">Office</option><option value="software">Software</option><option value="other">Other</option></select></div>
        <div class="col-span-2"><label class="label label-text">Vendor</label><input class="input input-bordered w-full" bind:value={form.vendor} /></div>
        <div class="col-span-2"><label class="label label-text">Description</label><input class="input input-bordered w-full" bind:value={form.description} /></div>
        <div><label class="label label-text">Amount</label><input type="number" step="0.01" class="input input-bordered w-full" bind:value={form.amount} /></div>
        <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" bind:value={form.currency} maxlength="3" /></div>
        <div class="col-span-2"><label class="label label-text">Receipt URL (optional)</label><input class="input input-bordered w-full" bind:value={form.receipt_url} /></div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !form.description || form.amount <= 0} onclick={createExpense}>{saving ? 'Saving…' : 'Submit'}</button></div>
    </div>
  </div>
{/if}
