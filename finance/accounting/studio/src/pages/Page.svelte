<script lang="ts">
  import { onMount } from 'svelte';
  import { Calculator, Plus, X, BookOpen, Coins, TrendingUp } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let tab = $state<'entries' | 'accounts' | 'fiscal'>('entries');
  let entries = $state<any[]>([]);
  let accounts = $state<any[]>([]);
  let fiscalYears = $state<any[]>([]);
  let error = $state('');

  let showEntryForm = $state(false);
  let showAccountForm = $state(false);
  let saving = $state(false);

  let entryForm = $state({
    entry_date: new Date().toISOString().slice(0, 10),
    description: '',
    document_number: '',
    lines: [
      { account_code: '', description: '', debit: 0, credit: 0 },
      { account_code: '', description: '', debit: 0, credit: 0 },
    ] as any[],
  });

  let accountForm = $state({ code: '', name: '', account_type: 'asset', parent_code: '' });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadEntries() { try { const r = await api('/api/accounting/journal-entries?limit=100'); entries = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadAccounts() { try { const r = await api('/api/accounting/accounts'); accounts = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadFiscal() { try { const r = await api('/api/accounting/fiscal-years'); fiscalYears = r.data ?? []; } catch (e: any) { error = e.message; } }

  function lineSums() {
    const debit = entryForm.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const credit = entryForm.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.005 };
  }
  let sums = $derived(lineSums());

  function addLine() { entryForm.lines = [...entryForm.lines, { account_code: '', description: '', debit: 0, credit: 0 }]; }
  function removeLine(idx: number) { entryForm.lines = entryForm.lines.filter((_, i) => i !== idx); }

  async function createEntry() {
    saving = true; error = '';
    try {
      await api('/api/accounting/journal-entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entryForm) });
      showEntryForm = false;
      entryForm = { entry_date: new Date().toISOString().slice(0, 10), description: '', document_number: '',
        lines: [{ account_code: '', description: '', debit: 0, credit: 0 }, { account_code: '', description: '', debit: 0, credit: 0 }] };
      await loadEntries();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  async function createAccount() {
    saving = true; error = '';
    try {
      await api('/api/accounting/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(accountForm) });
      showAccountForm = false;
      accountForm = { code: '', name: '', account_type: 'asset', parent_code: '' };
      await loadAccounts();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  $effect(() => {
    if (tab === 'entries') loadEntries();
    else if (tab === 'accounts') loadAccounts();
    else loadFiscal();
  });

  onMount(() => { loadEntries(); loadAccounts(); });

  function fmtMoney(n: number, c = 'RON') { return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: c }).format(n); }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Calculator class="h-6 w-6" /> Accounting</h1>
    <div class="flex gap-2">
      {#if tab === 'entries'}<button class="btn btn-primary btn-sm gap-2" onclick={() => (showEntryForm = true)}><Plus class="h-4 w-4" /> New entry</button>{/if}
      {#if tab === 'accounts'}<button class="btn btn-primary btn-sm gap-2" onclick={() => (showAccountForm = true)}><Plus class="h-4 w-4" /> New account</button>{/if}
    </div>
  </header>

  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div role="tablist" class="tabs tabs-bordered">
    <button role="tab" class:tab-active={tab === 'entries'} class="tab gap-2" onclick={() => (tab = 'entries')}><BookOpen class="h-4 w-4" /> Journal entries</button>
    <button role="tab" class:tab-active={tab === 'accounts'} class="tab gap-2" onclick={() => (tab = 'accounts')}><Coins class="h-4 w-4" /> Chart of accounts</button>
    <button role="tab" class:tab-active={tab === 'fiscal'} class="tab gap-2" onclick={() => (tab = 'fiscal')}><TrendingUp class="h-4 w-4" /> Fiscal years</button>
  </div>

  {#if tab === 'entries'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Date</th><th>Doc #</th><th>Description</th><th class="text-right">Debit</th><th class="text-right">Credit</th><th>Status</th></tr></thead>
        <tbody>
          {#if entries.length === 0}<tr><td colspan="6" class="text-center py-6 text-base-content/60">No journal entries.</td></tr>
          {:else}{#each entries as e (e.id)}
            <tr><td>{e.entry_date}</td><td class="font-mono text-xs">{e.document_number ?? '—'}</td><td>{e.description}</td><td class="text-right">{fmtMoney(Number(e.total_debit ?? 0))}</td><td class="text-right">{fmtMoney(Number(e.total_credit ?? 0))}</td><td><span class="badge badge-sm">{e.status ?? 'posted'}</span></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else if tab === 'accounts'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Parent</th></tr></thead>
        <tbody>
          {#if accounts.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No accounts. Create one to start.</td></tr>
          {:else}{#each accounts as a (a.code)}
            <tr><td class="font-mono">{a.code}</td><td>{a.name}</td><td><span class="badge badge-ghost badge-sm">{a.account_type}</span></td><td class="font-mono text-xs">{a.parent_code ?? '—'}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Year</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
        <tbody>
          {#if fiscalYears.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No fiscal years.</td></tr>
          {:else}{#each fiscalYears as f (f.id)}
            <tr><td>{f.name}</td><td>{f.start_date}</td><td>{f.end_date}</td><td><span class="badge badge-sm">{f.is_closed ? 'closed' : 'open'}</span></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if showEntryForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showEntryForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">New journal entry</h2>
        <button class="btn btn-ghost btn-sm btn-square" onclick={() => (showEntryForm = false)}><X class="h-4 w-4" /></button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label label-text">Date</label><input type="date" class="input input-bordered w-full" bind:value={entryForm.entry_date} /></div>
        <div><label class="label label-text">Document #</label><input class="input input-bordered w-full" bind:value={entryForm.document_number} /></div>
        <div class="col-span-2"><label class="label label-text">Description</label><input class="input input-bordered w-full" bind:value={entryForm.description} /></div>
      </div>
      <div class="mt-4">
        <div class="flex items-center justify-between mb-2"><span class="font-medium">Lines</span><button class="btn btn-ghost btn-xs gap-1" onclick={addLine}><Plus class="h-3 w-3" /> Add line</button></div>
        <table class="table table-xs">
          <thead><tr><th>Account</th><th>Description</th><th class="text-right">Debit</th><th class="text-right">Credit</th><th></th></tr></thead>
          <tbody>
            {#each entryForm.lines as line, idx}
              <tr>
                <td><select class="select select-xs select-bordered w-32" bind:value={line.account_code}><option value="">—</option>{#each accounts as a (a.code)}<option value={a.code}>{a.code} {a.name}</option>{/each}</select></td>
                <td><input class="input input-xs input-bordered w-full" bind:value={line.description} placeholder="Description" /></td>
                <td><input type="number" step="0.01" class="input input-xs input-bordered w-24 text-right" bind:value={line.debit} /></td>
                <td><input type="number" step="0.01" class="input input-xs input-bordered w-24 text-right" bind:value={line.credit} /></td>
                <td>{#if entryForm.lines.length > 2}<button class="btn btn-ghost btn-xs btn-square" onclick={() => removeLine(idx)}><X class="h-3 w-3" /></button>{/if}</td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr class="font-medium">
              <td colspan="2" class="text-right">Totals</td>
              <td class="text-right">{fmtMoney(sums.debit)}</td>
              <td class="text-right">{fmtMoney(sums.credit)}</td>
              <td>{#if !sums.balanced}<span class="text-error text-xs">Off by {fmtMoney(Math.abs(sums.debit - sums.credit))}</span>{/if}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button class="btn btn-ghost" onclick={() => (showEntryForm = false)}>Cancel</button>
        <button class="btn btn-primary" disabled={saving || !sums.balanced || sums.debit === 0 || !entryForm.description} onclick={createEntry}>{saving ? 'Posting…' : 'Post entry'}</button>
      </div>
    </div>
  </div>
{/if}

{#if showAccountForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showAccountForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">New account</h2>
        <button class="btn btn-ghost btn-sm btn-square" onclick={() => (showAccountForm = false)}><X class="h-4 w-4" /></button>
      </div>
      <div class="space-y-3">
        <div><label class="label label-text">Code (e.g. 4111)</label><input class="input input-bordered w-full font-mono" bind:value={accountForm.code} /></div>
        <div><label class="label label-text">Name</label><input class="input input-bordered w-full" bind:value={accountForm.name} /></div>
        <div><label class="label label-text">Type</label><select class="select select-bordered w-full" bind:value={accountForm.account_type}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expense</option></select></div>
        <div><label class="label label-text">Parent code (optional)</label><input class="input input-bordered w-full font-mono" bind:value={accountForm.parent_code} /></div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn btn-ghost" onclick={() => (showAccountForm = false)}>Cancel</button>
        <button class="btn btn-primary" disabled={saving || !accountForm.code || !accountForm.name} onclick={createAccount}>{saving ? 'Saving…' : 'Create'}</button>
      </div>
    </div>
  </div>
{/if}
