<script lang="ts">
  import { onMount } from 'svelte';
  import { Repeat, Plus, X, AlertCircle } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let tab = $state<'subscribers' | 'plans' | 'dunning'>('subscribers');
  let subscribers = $state<any[]>([]);
  let plans = $state<any[]>([]);
  let dunning = $state<any[]>([]);
  let error = $state('');

  let showPlanForm = $state(false);
  let saving = $state(false);
  let planForm = $state({ name: '', code: '', price: 0, currency: 'RON', interval: 'monthly', trial_days: 0 });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadSubs() { try { const r = await api('/ext/finance/subscriptions/subscribers'); subscribers = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadPlans() { try { const r = await api('/ext/finance/subscriptions/plans'); plans = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadDunning() { try { const r = await api('/ext/finance/subscriptions/dunning'); dunning = r.data ?? []; } catch (e: any) { error = e.message; } }

  async function createPlan() {
    saving = true; error = '';
    try {
      await api('/ext/finance/subscriptions/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(planForm) });
      showPlanForm = false;
      planForm = { name: '', code: '', price: 0, currency: 'RON', interval: 'monthly', trial_days: 0 };
      await loadPlans();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  $effect(() => {
    if (tab === 'subscribers') loadSubs();
    else if (tab === 'plans') loadPlans();
    else loadDunning();
  });
  onMount(loadSubs);

  function fmtMoney(n: number, c = 'RON') { return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: c }).format(n); }
  function statusBadge(s: string) { return ({ active: 'badge-success', trialing: 'badge-info', past_due: 'badge-warning', cancelled: 'badge-error' } as any)[s] ?? 'badge-ghost'; }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Repeat class="h-6 w-6" /> Subscriptions</h1>
    {#if tab === 'plans'}<button class="btn btn-primary btn-sm gap-2" onclick={() => (showPlanForm = true)}><Plus class="h-4 w-4" /> New plan</button>{/if}
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div role="tablist" class="tabs tabs-bordered">
    <button role="tab" class:tab-active={tab === 'subscribers'} class="tab" onclick={() => (tab = 'subscribers')}>Subscribers</button>
    <button role="tab" class:tab-active={tab === 'plans'} class="tab" onclick={() => (tab = 'plans')}>Plans</button>
    <button role="tab" class:tab-active={tab === 'dunning'} class="tab gap-2" onclick={() => (tab = 'dunning')}><AlertCircle class="h-4 w-4" /> Dunning</button>
  </div>

  {#if tab === 'subscribers'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Subscriber</th><th>Plan</th><th>Started</th><th>Next bill</th><th class="text-right">MRR</th><th>Status</th></tr></thead>
        <tbody>
          {#if subscribers.length === 0}<tr><td colspan="6" class="text-center py-6 text-base-content/60">No subscribers.</td></tr>
          {:else}{#each subscribers as s (s.id)}
            <tr><td>{s.subscriber_email ?? s.subscriber_id}</td><td>{s.plan_name}</td><td>{s.started_at?.slice(0, 10)}</td><td>{s.next_billing_date}</td><td class="text-right">{fmtMoney(Number(s.mrr ?? s.price), s.currency)}</td><td><span class="badge {statusBadge(s.status)} badge-sm">{s.status}</span></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else if tab === 'plans'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Code</th><th>Name</th><th>Interval</th><th class="text-right">Price</th><th>Trial days</th></tr></thead>
        <tbody>
          {#if plans.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No plans yet.</td></tr>
          {:else}{#each plans as p (p.id)}
            <tr><td class="font-mono text-xs">{p.code}</td><td>{p.name}</td><td>{p.interval}</td><td class="text-right">{fmtMoney(Number(p.price), p.currency)}</td><td>{p.trial_days ?? 0}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Subscriber</th><th>Attempt #</th><th>Last attempt</th><th class="text-right">Amount</th><th>Status</th></tr></thead>
        <tbody>
          {#if dunning.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No failed payments.</td></tr>
          {:else}{#each dunning as d (d.id)}
            <tr><td>{d.subscriber_email}</td><td>{d.attempt_count}</td><td>{d.last_attempt_at?.slice(0, 16)}</td><td class="text-right">{fmtMoney(Number(d.amount))}</td><td><span class="badge badge-warning badge-sm">{d.status}</span></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if showPlanForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showPlanForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New plan</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showPlanForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="space-y-3">
        <div><label class="label label-text">Code</label><input class="input input-bordered w-full font-mono" bind:value={planForm.code} /></div>
        <div><label class="label label-text">Name</label><input class="input input-bordered w-full" bind:value={planForm.name} /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label label-text">Price</label><input type="number" step="0.01" class="input input-bordered w-full" bind:value={planForm.price} /></div>
          <div><label class="label label-text">Currency</label><input class="input input-bordered w-full" bind:value={planForm.currency} maxlength="3" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label label-text">Interval</label><select class="select select-bordered w-full" bind:value={planForm.interval}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div>
          <div><label class="label label-text">Trial days</label><input type="number" class="input input-bordered w-full" bind:value={planForm.trial_days} /></div>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showPlanForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !planForm.code || !planForm.name} onclick={createPlan}>{saving ? 'Saving…' : 'Create'}</button></div>
    </div>
  </div>
{/if}
