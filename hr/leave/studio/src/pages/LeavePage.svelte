<script lang="ts">
  import { onMount } from 'svelte';
  import { CalendarDays, Plus, Check, X } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let requests = $state<any[]>([]);
  let employees = $state<any[]>([]);
  let leaveTypes = $state<any[]>([]);
  let loading = $state(false);
  let error = $state('');
  let statusFilter = $state<'all' | 'pending' | 'approved' | 'rejected'>('all');

  let showForm = $state(false);
  let saving = $state(false);
  let form = $state({
    employee_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '',
  });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadAll() {
    loading = true; error = '';
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const [reqs, emps, types] = await Promise.all([
        api(`/ext/hr/leave/requests?${params}`),
        api('/ext/hr/employees?limit=200'),
        api('/ext/hr/leave/types'),
      ]);
      requests = reqs.data ?? [];
      employees = emps.data ?? [];
      leaveTypes = types.data ?? [];
    } catch (e: any) { error = e.message; }
    finally { loading = false; }
  }

  async function createRequest() {
    saving = true; error = '';
    try {
      await api('/ext/hr/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      showForm = false;
      form = { employee_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '' };
      await loadAll();
    } catch (e: any) { error = e.message; }
    finally { saving = false; }
  }

  async function approve(id: string, approved: boolean) {
    try {
      await api(`/ext/hr/leave/requests/${id}/${approved ? 'approve' : 'reject'}`, { method: 'POST' });
      await loadAll();
    } catch (e: any) { error = e.message; }
  }

  onMount(loadAll);
  $effect(() => { statusFilter; loadAll(); });

  function statusBadge(s: string): string {
    return ({ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error', cancelled: 'badge-ghost' } as any)[s] ?? 'badge-ghost';
  }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><CalendarDays class="h-6 w-6" /> Leave</h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}>
      <Plus class="h-4 w-4" /> New request
    </button>
  </header>

  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="flex gap-3">
    <select bind:value={statusFilter} class="select select-sm select-bordered">
      <option value="all">All</option>
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
    </select>
  </div>

  <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
    <table class="table table-sm">
      <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {#if loading}
          <tr><td colspan="7" class="text-center py-6 text-base-content/60">Loading…</td></tr>
        {:else if requests.length === 0}
          <tr><td colspan="7" class="text-center py-6 text-base-content/60">No requests.</td></tr>
        {:else}
          {#each requests as r (r.id)}
            <tr>
              <td>{r.employee_name ?? r.employee_id}</td>
              <td>{r.leave_type_name ?? '—'}</td>
              <td>{r.start_date}</td>
              <td>{r.end_date}</td>
              <td>{r.working_days ?? '—'}</td>
              <td><span class="badge {statusBadge(r.status)} badge-sm">{r.status}</span></td>
              <td>
                {#if r.status === 'pending'}
                  <button class="btn btn-ghost btn-xs" title="Approve" onclick={() => approve(r.id, true)}>
                    <Check class="h-3.5 w-3.5" />
                  </button>
                  <button class="btn btn-ghost btn-xs" title="Reject" onclick={() => approve(r.id, false)}>
                    <X class="h-3.5 w-3.5" />
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">New leave request</h2>
        <button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button>
      </div>
      <div class="space-y-3">
        <div>
          <label class="label label-text">Employee</label>
          <select class="select select-bordered w-full" bind:value={form.employee_id}>
            <option value="">—</option>
            {#each employees as e (e.id)}<option value={e.id}>{e.first_name} {e.last_name}</option>{/each}
          </select>
        </div>
        <div>
          <label class="label label-text">Leave type</label>
          <select class="select select-bordered w-full" bind:value={form.leave_type_id}>
            <option value="">—</option>
            {#each leaveTypes as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
          </select>
        </div>
        <div><label class="label label-text">Start date</label><input type="date" class="input input-bordered w-full" bind:value={form.start_date} /></div>
        <div><label class="label label-text">End date</label><input type="date" class="input input-bordered w-full" bind:value={form.end_date} /></div>
        <div><label class="label label-text">Reason</label><textarea class="textarea textarea-bordered w-full" bind:value={form.reason}></textarea></div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button>
        <button class="btn btn-primary" disabled={saving || !form.employee_id || !form.start_date || !form.end_date} onclick={createRequest}>
          {saving ? 'Saving…' : 'Submit request'}
        </button>
      </div>
    </div>
  </div>
{/if}
