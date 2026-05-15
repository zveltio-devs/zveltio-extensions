<script lang="ts">
  import { onMount } from 'svelte';
  import { FileText, Plus, Search, Send, CheckCircle, XCircle, X } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let invoices = $state<any[]>([]);
  let total = $state(0);
  let page = $state(1);
  let search = $state('');
  let statusFilter = $state<'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'>('all');
  let loading = $state(false);
  let error = $state('');

  let showForm = $state(false);
  let saving = $state(false);
  let contactsOptions = $state<Array<{ id: string; label: string }>>([]);
  let form = $state({
    client_id: '',
    client_name: '',
    client_email: '',
    client_address: '',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
    currency: 'RON',
    discount_percent: 0,
    tax_rate: 19,
    notes: '',
    lines: [{ description: '', quantity: 1, unit: 'buc', unit_price: 0, tax_rate: 19, sort_order: 0 }] as any[],
  });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadInvoices() {
    loading = true; error = '';
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api(`/ext/finance/invoicing/invoices?${params}`);
      invoices = res.data ?? [];
      total = res.meta?.total ?? invoices.length;
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function loadContacts() {
    try {
      const res = await api('/ext/crm/contacts?limit=200');
      contactsOptions = (res.data ?? []).map((c: any) => ({
        id: c.id,
        label: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() + (c.email ? ` <${c.email}>` : ''),
      }));
    } catch {
      // CRM extension may not be installed — invoicing still works without it.
      contactsOptions = [];
    }
  }

  function addLine() {
    form.lines = [...form.lines, { description: '', quantity: 1, unit: 'buc', unit_price: 0, tax_rate: form.tax_rate, sort_order: form.lines.length }];
  }
  function removeLine(idx: number) {
    form.lines = form.lines.filter((_, i) => i !== idx);
  }

  function lineTotal(l: any): number {
    const sub = l.quantity * l.unit_price * (1 - form.discount_percent / 100);
    return sub * (1 + l.tax_rate / 100);
  }
  let invoiceTotal = $derived(form.lines.reduce((s, l) => s + lineTotal(l), 0));

  async function createInvoice() {
    saving = true; error = '';
    try {
      await api('/ext/finance/invoicing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      showForm = false;
      form.lines = [{ description: '', quantity: 1, unit: 'buc', unit_price: 0, tax_rate: form.tax_rate, sort_order: 0 }];
      form.client_name = '';
      form.client_id = '';
      await loadInvoices();
    } catch (e: any) {
      error = e.message;
    } finally {
      saving = false;
    }
  }

  async function markPaid(id: string) {
    try {
      await api(`/ext/finance/invoicing/invoices/${id}/mark-paid`, { method: 'POST' });
      await loadInvoices();
    } catch (e: any) { error = e.message; }
  }
  async function cancelInvoice(id: string) {
    if (!confirm('Cancel invoice?')) return;
    try {
      await api(`/ext/finance/invoicing/invoices/${id}/cancel`, { method: 'POST' });
      await loadInvoices();
    } catch (e: any) { error = e.message; }
  }

  onMount(() => {
    loadInvoices();
    loadContacts();
  });

  $effect(() => {
    page; statusFilter;
    loadInvoices();
  });

  function fmtMoney(n: number, curr: string): string {
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: curr || 'RON' }).format(n);
  }

  function statusBadge(s: string): string {
    return ({ draft: 'badge-ghost', sent: 'badge-info', paid: 'badge-success', overdue: 'badge-error', cancelled: 'badge-warning' } as any)[s] ?? 'badge-ghost';
  }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2">
      <FileText class="h-6 w-6" /> Invoicing
    </h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}>
      <Plus class="h-4 w-4" /> New invoice
    </button>
  </header>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}

  <div class="flex gap-3 items-center">
    <div class="join">
      <input
        type="text"
        placeholder="Search number, client..."
        class="input input-sm input-bordered join-item"
        bind:value={search}
        onkeydown={(e) => e.key === 'Enter' && loadInvoices()}
      />
      <button class="btn btn-sm join-item" onclick={loadInvoices}><Search class="h-4 w-4" /></button>
    </div>
    <select bind:value={statusFilter} class="select select-sm select-bordered">
      <option value="all">All statuses</option>
      <option value="draft">Draft</option>
      <option value="sent">Sent</option>
      <option value="paid">Paid</option>
      <option value="overdue">Overdue</option>
      <option value="cancelled">Cancelled</option>
    </select>
  </div>

  <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
    <table class="table table-sm">
      <thead>
        <tr>
          <th>Number</th><th>Client</th><th>Issued</th><th>Due</th><th class="text-right">Total</th><th>Status</th><th></th>
        </tr>
      </thead>
      <tbody>
        {#if loading}
          <tr><td colspan="7" class="text-center py-6 text-base-content/60">Loading…</td></tr>
        {:else if invoices.length === 0}
          <tr><td colspan="7" class="text-center py-6 text-base-content/60">No invoices yet.</td></tr>
        {:else}
          {#each invoices as inv (inv.id)}
            <tr>
              <td class="font-mono">{inv.number}</td>
              <td>{inv.client_name}{inv.client_email ? ` <${inv.client_email}>` : ''}</td>
              <td>{inv.issue_date}</td>
              <td>{inv.due_date}</td>
              <td class="text-right">{fmtMoney(Number(inv.total), inv.currency)}</td>
              <td><span class="badge {statusBadge(inv.status)} badge-sm">{inv.status}</span></td>
              <td>
                {#if inv.status !== 'paid' && inv.status !== 'cancelled'}
                  <button class="btn btn-ghost btn-xs gap-1" title="Mark paid" onclick={() => markPaid(inv.id)}>
                    <CheckCircle class="h-3.5 w-3.5" />
                  </button>
                  <button class="btn btn-ghost btn-xs gap-1" title="Cancel" onclick={() => cancelInvoice(inv.id)}>
                    <XCircle class="h-3.5 w-3.5" />
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <div class="flex justify-between items-center text-sm text-base-content/70">
    <span>{total} invoices</span>
    <div class="join">
      <button class="btn btn-xs join-item" disabled={page <= 1} onclick={() => page--}>Prev</button>
      <button class="btn btn-xs join-item btn-ghost">Page {page}</button>
      <button class="btn btn-xs join-item" disabled={invoices.length < 20} onclick={() => page++}>Next</button>
    </div>
  </div>
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">New invoice</h2>
        <button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label class="label label-text">Client</label>
          {#if contactsOptions.length > 0}
            <select bind:value={form.client_id} class="select select-bordered w-full" onchange={() => {
              const opt = contactsOptions.find((o) => o.id === form.client_id);
              if (opt) form.client_name = opt.label.split(' <')[0];
            }}>
              <option value="">— Select contact —</option>
              {#each contactsOptions as c (c.id)}
                <option value={c.id}>{c.label}</option>
              {/each}
            </select>
          {:else}
            <input type="text" placeholder="Client name" class="input input-bordered w-full" bind:value={form.client_name} />
          {/if}
        </div>
        <div>
          <label class="label label-text">Issue date</label>
          <input type="date" class="input input-bordered w-full" bind:value={form.issue_date} />
        </div>
        <div>
          <label class="label label-text">Due date</label>
          <input type="date" class="input input-bordered w-full" bind:value={form.due_date} />
        </div>
        <div>
          <label class="label label-text">Currency</label>
          <input type="text" class="input input-bordered w-full" bind:value={form.currency} maxlength="3" />
        </div>
        <div>
          <label class="label label-text">Tax rate (default %)</label>
          <input type="number" step="0.01" class="input input-bordered w-full" bind:value={form.tax_rate} />
        </div>
      </div>

      <div class="mt-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">Lines</span>
          <button class="btn btn-ghost btn-xs gap-1" onclick={addLine}><Plus class="h-3 w-3" /> Add line</button>
        </div>
        <table class="table table-xs">
          <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Price</th><th>VAT %</th><th class="text-right">Total</th><th></th></tr></thead>
          <tbody>
            {#each form.lines as line, idx}
              <tr>
                <td><input class="input input-xs input-bordered w-full" bind:value={line.description} placeholder="Description" /></td>
                <td><input type="number" step="0.01" class="input input-xs input-bordered w-20" bind:value={line.quantity} /></td>
                <td><input class="input input-xs input-bordered w-16" bind:value={line.unit} /></td>
                <td><input type="number" step="0.01" class="input input-xs input-bordered w-24" bind:value={line.unit_price} /></td>
                <td><input type="number" step="0.01" class="input input-xs input-bordered w-16" bind:value={line.tax_rate} /></td>
                <td class="text-right">{fmtMoney(lineTotal(line), form.currency)}</td>
                <td>
                  {#if form.lines.length > 1}
                    <button class="btn btn-ghost btn-xs btn-square" onclick={() => removeLine(idx)}><X class="h-3 w-3" /></button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        <div class="text-right mt-2 text-lg font-semibold">Total: {fmtMoney(invoiceTotal, form.currency)}</div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button>
        <button class="btn btn-primary gap-2" disabled={saving || !form.client_name || form.lines.some((l) => !l.description)} onclick={createInvoice}>
          <Send class="h-4 w-4" /> {saving ? 'Saving…' : 'Create invoice'}
        </button>
      </div>
    </div>
  </div>
{/if}
