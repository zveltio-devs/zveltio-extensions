<script lang="ts">
  import { onMount } from 'svelte';
  import { Landmark, Plus, X, ArrowLeftRight, FileSpreadsheet } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let tab = $state<'accounts' | 'transactions' | 'reconciliation'>('accounts');
  let accounts = $state<any[]>([]);
  let transactions = $state<any[]>([]);
  let unreconciled = $state<any[]>([]);
  let openInvoices = $state<any[]>([]);
  let error = $state('');

  let showForm = $state(false);
  let saving = $state(false);
  let form = $state({ name: '', bank_name: '', iban: '', currency: 'RON', opening_balance: 0 });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadAccounts() { try { const r = await api('/ext/finance/banking/accounts'); accounts = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadTransactions() { try { const r = await api('/ext/finance/banking/transactions?limit=100'); transactions = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadReconciliation() {
    try {
      const [u, inv] = await Promise.all([
        api('/ext/finance/banking/transactions?reconciled=false&limit=100'),
        api('/ext/finance/invoicing/invoices?status=sent&limit=100').catch(() => ({ data: [] })),
      ]);
      unreconciled = u.data ?? [];
      openInvoices = inv.data ?? [];
    } catch (e: any) { error = e.message; }
  }

  async function createAccount() {
    saving = true; error = '';
    try {
      await api('/ext/finance/banking/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      showForm = false;
      form = { name: '', bank_name: '', iban: '', currency: 'RON', opening_balance: 0 };
      await loadAccounts();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  async function reconcile(txId: string, invoiceId: string) {
    try {
      await api(`/ext/finance/banking/transactions/${txId}/reconcile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: invoiceId }) });
      await loadReconciliation();
    } catch (e: any) { error = e.message; }
  }

  $effect(() => {
    if (tab === 'accounts') loadAccounts();
    else if (tab === 'transactions') loadTransactions();
    else loadReconciliation();
  });

  onMount(() => loadAccounts());

  function fmtMoney(n: number, c = 'RON') { return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: c }).format(n); }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Landmark class="h-6 w-6" /> Banking</h1>
    {#if tab === 'accounts'}<button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}><Plus class="h-4 w-4" /> New account</button>{/if}
  </header>

  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div role="tablist" class="tabs tabs-bordered">
    <button role="tab" class:tab-active={tab === 'accounts'} class="tab gap-2" onclick={() => (tab = 'accounts')}><Landmark class="h-4 w-4" /> Accounts</button>
    <button role="tab" class:tab-active={tab === 'transactions'} class="tab gap-2" onclick={() => (tab = 'transactions')}><FileSpreadsheet class="h-4 w-4" /> Transactions</button>
    <button role="tab" class:tab-active={tab === 'reconciliation'} class="tab gap-2" onclick={() => (tab = 'reconciliation')}><ArrowLeftRight class="h-4 w-4" /> Reconciliation</button>
  </div>

  {#if tab === 'accounts'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Name</th><th>Bank</th><th class="font-mono">IBAN</th><th>Currency</th><th class="text-right">Balance</th></tr></thead>
        <tbody>
          {#if accounts.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No accounts.</td></tr>
          {:else}{#each accounts as a (a.id)}
            <tr><td>{a.name}</td><td>{a.bank_name}</td><td class="font-mono text-xs">{a.iban}</td><td>{a.currency}</td><td class="text-right">{fmtMoney(Number(a.balance), a.currency)}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else if tab === 'transactions'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Date</th><th>Account</th><th>Description</th><th class="text-right">Amount</th><th>Reconciled</th></tr></thead>
        <tbody>
          {#if transactions.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No transactions yet — import a bank statement to start.</td></tr>
          {:else}{#each transactions as t (t.id)}
            <tr><td>{t.transaction_date}</td><td>{t.account_name ?? '—'}</td><td class="max-w-xs truncate">{t.description}</td><td class="text-right {Number(t.amount) < 0 ? 'text-error' : 'text-success'}">{fmtMoney(Number(t.amount), t.currency)}</td><td>{t.reconciled ? '✓' : '—'}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-base-100 rounded-lg shadow">
        <div class="p-3 font-medium border-b">Unreconciled transactions</div>
        <table class="table table-sm">
          <thead><tr><th>Date</th><th>Description</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            {#if unreconciled.length === 0}<tr><td colspan="3" class="text-center py-6 text-base-content/60">All clear.</td></tr>
            {:else}{#each unreconciled as t (t.id)}
              <tr><td>{t.transaction_date}</td><td class="max-w-xs truncate">{t.description}</td><td class="text-right">{fmtMoney(Number(t.amount))}</td></tr>
            {/each}{/if}
          </tbody>
        </table>
      </div>
      <div class="bg-base-100 rounded-lg shadow">
        <div class="p-3 font-medium border-b">Open invoices (sent)</div>
        <table class="table table-sm">
          <thead><tr><th>Number</th><th>Client</th><th class="text-right">Total</th></tr></thead>
          <tbody>
            {#if openInvoices.length === 0}<tr><td colspan="3" class="text-center py-6 text-base-content/60">No open invoices.</td></tr>
            {:else}{#each openInvoices as i (i.id)}
              <tr><td class="font-mono">{i.number}</td><td>{i.client_name}</td><td class="text-right">{fmtMoney(Number(i.total))}</td></tr>
            {/each}{/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New bank account</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="space-y-3">
        <div><label class="label label-text">Internal name</label><input class="input input-bordered w-full" bind:value={form.name} /></div>
        <div><label class="label label-text">Bank</label><input class="input input-bordered w-full" bind:value={form.bank_name} /></div>
        <div><label class="label label-text">IBAN</label><input class="input input-bordered w-full font-mono" bind:value={form.iban} /></div>
        <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" bind:value={form.currency} maxlength="3" /></div>
        <div><label class="label label-text">Opening balance</label><input type="number" step="0.01" class="input input-bordered w-full" bind:value={form.opening_balance} /></div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !form.name || !form.iban} onclick={createAccount}>{saving ? 'Saving…' : 'Create'}</button></div>
    </div>
  </div>
{/if}
