<script lang="ts">
  import { onMount } from 'svelte';
  import { FileSignature, Plus, X, FileText, Send } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let quotes = $state<any[]>([]);
  let contacts = $state<any[]>([]);
  let error = $state('');
  let statusFilter = $state<'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'>('all');

  let showForm = $state(false);
  let saving = $state(false);
  let form = $state({
    client_id: '',
    client_name: '',
    valid_until: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    currency: 'RON',
    discount_percent: 0,
    notes: '',
    lines: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 19 }] as any[],
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
      const r = await api(`/ext/finance/quotes?${params}`);
      quotes = r.data ?? [];
    } catch (e: any) { error = e.message; }
  }
  async function loadContacts() {
    try { const r = await api('/ext/crm/contacts?limit=200'); contacts = (r.data ?? []).map((c: any) => ({ id: c.id, label: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() })); } catch { contacts = []; }
  }

  function addLine() { form.lines = [...form.lines, { description: '', quantity: 1, unit_price: 0, tax_rate: 19 }]; }
  function removeLine(i: number) { form.lines = form.lines.filter((_, idx) => idx !== i); }
  function lineTotal(l: any) { return l.quantity * l.unit_price * (1 - form.discount_percent / 100) * (1 + l.tax_rate / 100); }
  let total = $derived(form.lines.reduce((s, l) => s + lineTotal(l), 0));

  async function createQuote() {
    saving = true; error = '';
    try {
      await api('/ext/finance/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      showForm = false;
      form.lines = [{ description: '', quantity: 1, unit_price: 0, tax_rate: 19 }];
      form.client_name = ''; form.client_id = '';
      await load();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  async function send(id: string) { try { await api(`/ext/finance/quotes/${id}/send`, { method: 'POST' }); await load(); } catch (e: any) { error = e.message; } }
  async function convert(id: string) { try { await api(`/ext/finance/quotes/${id}/convert-to-invoice`, { method: 'POST' }); await load(); } catch (e: any) { error = e.message; } }

  $effect(() => { statusFilter; load(); });
  onMount(() => { load(); loadContacts(); });

  function fmtMoney(n: number, c = 'RON') { return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: c }).format(n); }
  function statusBadge(s: string) { return ({ draft: 'badge-ghost', sent: 'badge-info', accepted: 'badge-success', rejected: 'badge-error', expired: 'badge-warning' } as any)[s] ?? 'badge-ghost'; }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><FileSignature class="h-6 w-6" /> Quotes</h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}><Plus class="h-4 w-4" /> New quote</button>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}
  <select bind:value={statusFilter} class="select select-sm select-bordered max-w-xs">
    <option value="all">All</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="expired">Expired</option>
  </select>

  <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
    <table class="table table-sm">
      <thead><tr><th>Number</th><th>Client</th><th>Valid until</th><th class="text-right">Total</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {#if quotes.length === 0}<tr><td colspan="6" class="text-center py-6 text-base-content/60">No quotes.</td></tr>
        {:else}{#each quotes as q (q.id)}
          <tr><td class="font-mono">{q.number}</td><td>{q.client_name}</td><td>{q.valid_until}</td><td class="text-right">{fmtMoney(Number(q.total), q.currency)}</td><td><span class="badge {statusBadge(q.status)} badge-sm">{q.status}</span></td><td>{#if q.status === 'draft'}<button class="btn btn-ghost btn-xs gap-1" onclick={() => send(q.id)}><Send class="h-3 w-3" /> Send</button>{/if}{#if q.status === 'accepted'}<button class="btn btn-ghost btn-xs gap-1" onclick={() => convert(q.id)}><FileText class="h-3 w-3" /> → Invoice</button>{/if}</td></tr>
        {/each}{/if}
      </tbody>
    </table>
  </div>
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New quote</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label class="label label-text">Client</label>
          {#if contacts.length > 0}
            <select class="select select-bordered w-full" bind:value={form.client_id} onchange={() => { const opt = contacts.find((c) => c.id === form.client_id); if (opt) form.client_name = opt.label; }}>
              <option value="">— Select contact —</option>{#each contacts as c (c.id)}<option value={c.id}>{c.label}</option>{/each}
            </select>
          {:else}<input class="input input-bordered w-full" bind:value={form.client_name} placeholder="Client name" />{/if}
        </div>
        <div><label class="label label-text">Valid until</label><input type="date" class="input input-bordered w-full" bind:value={form.valid_until} /></div>
        <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" bind:value={form.currency} maxlength="3" /></div>
        <div><label class="label label-text">Discount %</label><input type="number" step="0.01" class="input input-bordered w-full" bind:value={form.discount_percent} /></div>
      </div>
      <div class="mt-4">
        <div class="flex items-center justify-between mb-2"><span class="font-medium">Lines</span><button class="btn btn-ghost btn-xs gap-1" onclick={addLine}><Plus class="h-3 w-3" /> Add</button></div>
        <table class="table table-xs">
          <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>VAT %</th><th class="text-right">Total</th><th></th></tr></thead>
          <tbody>
            {#each form.lines as line, idx}
              <tr>
                <td><input class="input input-xs input-bordered w-full" bind:value={line.description} /></td>
                <td><input type="number" step="0.01" class="input input-xs input-bordered w-20" bind:value={line.quantity} /></td>
                <td><input type="number" step="0.01" class="input input-xs input-bordered w-24" bind:value={line.unit_price} /></td>
                <td><input type="number" step="0.01" class="input input-xs input-bordered w-16" bind:value={line.tax_rate} /></td>
                <td class="text-right">{fmtMoney(lineTotal(line), form.currency)}</td>
                <td>{#if form.lines.length > 1}<button class="btn btn-ghost btn-xs btn-square" onclick={() => removeLine(idx)}><X class="h-3 w-3" /></button>{/if}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <div class="text-right mt-2 text-lg font-semibold">Total: {fmtMoney(total, form.currency)}</div>
      </div>
      <div class="flex justify-end gap-2 mt-6"><button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !form.client_name} onclick={createQuote}>{saving ? 'Saving…' : 'Create'}</button></div>
    </div>
  </div>
{/if}
