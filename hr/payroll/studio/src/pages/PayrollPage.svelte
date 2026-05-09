<script lang="ts">
  import { onMount } from 'svelte';
  import { Wallet, Plus, Download } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let periods = $state<any[]>([]);
  let entries = $state<any[]>([]);
  let selectedPeriod = $state<string | null>(null);
  let loading = $state(false);
  let error = $state('');

  let showCreatePeriod = $state(false);
  let saving = $state(false);
  let periodForm = $state({
    name: '',
    period_start: '',
    period_end: '',
    pay_date: '',
  });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadPeriods() {
    loading = true; error = '';
    try {
      const res = await api('/api/payroll/periods');
      periods = res.data ?? [];
      if (!selectedPeriod && periods.length > 0) selectedPeriod = periods[0].id;
    } catch (e: any) { error = e.message; }
    finally { loading = false; }
  }

  async function loadEntries() {
    if (!selectedPeriod) { entries = []; return; }
    try {
      const res = await api(`/api/payroll/periods/${selectedPeriod}/entries`);
      entries = res.data ?? [];
    } catch (e: any) { error = e.message; }
  }

  async function createPeriod() {
    saving = true; error = '';
    try {
      await api('/api/payroll/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(periodForm),
      });
      showCreatePeriod = false;
      periodForm = { name: '', period_start: '', period_end: '', pay_date: '' };
      await loadPeriods();
    } catch (e: any) { error = e.message; }
    finally { saving = false; }
  }

  async function generateEntries(periodId: string) {
    try {
      await api(`/api/payroll/periods/${periodId}/generate`, { method: 'POST' });
      await loadEntries();
    } catch (e: any) { error = e.message; }
  }

  async function exportRevisal(periodId: string) {
    window.open(`${engineUrl}/api/payroll/periods/${periodId}/revisal-export`, '_blank');
  }

  onMount(loadPeriods);
  $effect(() => { selectedPeriod; loadEntries(); });

  function fmtMoney(n: number, c = 'RON'): string {
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: c }).format(n);
  }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Wallet class="h-6 w-6" /> Payroll</h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => (showCreatePeriod = true)}>
      <Plus class="h-4 w-4" /> New period
    </button>
  </header>

  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="grid grid-cols-12 gap-4">
    <aside class="col-span-3">
      <div class="bg-base-100 rounded-lg shadow">
        <div class="p-3 font-medium border-b">Periods</div>
        <ul class="menu menu-sm">
          {#each periods as p (p.id)}
            <li>
              <button class:active={selectedPeriod === p.id} onclick={() => (selectedPeriod = p.id)}>
                <div>
                  <div class="font-medium">{p.name}</div>
                  <div class="text-xs opacity-60">{p.period_start} → {p.period_end}</div>
                  <div class="text-xs"><span class="badge badge-xs">{p.status}</span></div>
                </div>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </aside>

    <main class="col-span-9 bg-base-100 rounded-lg shadow p-4">
      {#if !selectedPeriod}
        <p class="text-base-content/60 text-center py-12">Select a period to view payroll entries.</p>
      {:else}
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium">Entries</h2>
          <div class="flex gap-2">
            <button class="btn btn-sm gap-1" onclick={() => generateEntries(selectedPeriod!)}>
              <Plus class="h-3.5 w-3.5" /> Generate from active employees
            </button>
            <button class="btn btn-sm gap-1" onclick={() => exportRevisal(selectedPeriod!)}>
              <Download class="h-3.5 w-3.5" /> Revisal XML
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead><tr><th>Employee</th><th class="text-right">Gross</th><th class="text-right">CAS (25%)</th><th class="text-right">CASS (10%)</th><th class="text-right">Income tax (10%)</th><th class="text-right">Net</th></tr></thead>
            <tbody>
              {#if entries.length === 0}
                <tr><td colspan="6" class="text-center py-6 text-base-content/60">No entries — click "Generate".</td></tr>
              {:else}
                {#each entries as e (e.id)}
                  <tr>
                    <td>{e.employee_name}</td>
                    <td class="text-right">{fmtMoney(Number(e.gross_salary))}</td>
                    <td class="text-right">{fmtMoney(Number(e.cas))}</td>
                    <td class="text-right">{fmtMoney(Number(e.cass))}</td>
                    <td class="text-right">{fmtMoney(Number(e.income_tax))}</td>
                    <td class="text-right font-medium">{fmtMoney(Number(e.net_salary))}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      {/if}
    </main>
  </div>
</div>

{#if showCreatePeriod}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showCreatePeriod = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <h2 class="text-xl font-semibold mb-4">New payroll period</h2>
      <div class="space-y-3">
        <div><label class="label label-text">Name (e.g. November 2026)</label><input class="input input-bordered w-full" bind:value={periodForm.name} /></div>
        <div><label class="label label-text">Period start</label><input type="date" class="input input-bordered w-full" bind:value={periodForm.period_start} /></div>
        <div><label class="label label-text">Period end</label><input type="date" class="input input-bordered w-full" bind:value={periodForm.period_end} /></div>
        <div><label class="label label-text">Pay date</label><input type="date" class="input input-bordered w-full" bind:value={periodForm.pay_date} /></div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn btn-ghost" onclick={() => (showCreatePeriod = false)}>Cancel</button>
        <button class="btn btn-primary" disabled={saving || !periodForm.name} onclick={createPeriod}>
          {saving ? 'Saving…' : 'Create'}
        </button>
      </div>
    </div>
  </div>
{/if}
