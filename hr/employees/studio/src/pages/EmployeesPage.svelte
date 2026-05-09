<script lang="ts">
  import { onMount } from 'svelte';
  import { Users, Plus, Search, X } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let employees = $state<any[]>([]);
  let departments = $state<any[]>([]);
  let positions = $state<any[]>([]);
  let loading = $state(false);
  let error = $state('');
  let q = $state('');
  let statusFilter = $state<'all' | 'active' | 'on_leave' | 'terminated'>('active');

  let showForm = $state(false);
  let saving = $state(false);
  let form = $state({
    first_name: '', last_name: '', email: '', work_email: '', phone: '',
    hire_date: new Date().toISOString().slice(0, 10),
    department_id: '', position_id: '', employment_type: 'full_time',
    salary: 0, salary_type: 'gross', currency: 'RON', address: '',
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
      const params = new URLSearchParams({ limit: '100' });
      if (q) params.set('q', q);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const [emps, depts, posList] = await Promise.all([
        api(`/api/hr?${params}`),
        api('/api/hr/departments'),
        api('/api/hr/positions'),
      ]);
      employees = emps.data ?? [];
      departments = depts.data ?? [];
      positions = posList.data ?? [];
    } catch (e: any) { error = e.message; }
    finally { loading = false; }
  }

  async function createEmployee() {
    saving = true; error = '';
    try {
      await api('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          department_id: form.department_id || undefined,
          position_id: form.position_id || undefined,
          salary: form.salary || undefined,
        }),
      });
      showForm = false;
      form = { first_name: '', last_name: '', email: '', work_email: '', phone: '',
               hire_date: new Date().toISOString().slice(0, 10),
               department_id: '', position_id: '', employment_type: 'full_time',
               salary: 0, salary_type: 'gross', currency: 'RON', address: '' };
      await loadAll();
    } catch (e: any) { error = e.message; }
    finally { saving = false; }
  }

  onMount(loadAll);
  $effect(() => { statusFilter; loadAll(); });

  function statusBadge(s: string): string {
    return ({ active: 'badge-success', on_leave: 'badge-warning', terminated: 'badge-error', inactive: 'badge-ghost' } as any)[s] ?? 'badge-ghost';
  }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Users class="h-6 w-6" /> Employees</h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}>
      <Plus class="h-4 w-4" /> New employee
    </button>
  </header>

  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="flex gap-3 items-center">
    <div class="join">
      <input type="text" placeholder="Search name, email..." class="input input-sm input-bordered join-item"
             bind:value={q} onkeydown={(e) => e.key === 'Enter' && loadAll()} />
      <button class="btn btn-sm join-item" onclick={loadAll}><Search class="h-4 w-4" /></button>
    </div>
    <select bind:value={statusFilter} class="select select-sm select-bordered">
      <option value="all">All statuses</option>
      <option value="active">Active</option>
      <option value="on_leave">On leave</option>
      <option value="terminated">Terminated</option>
    </select>
  </div>

  <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
    <table class="table table-sm">
      <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Hire date</th><th>Status</th></tr></thead>
      <tbody>
        {#if loading}
          <tr><td colspan="7" class="text-center py-6 text-base-content/60">Loading…</td></tr>
        {:else if employees.length === 0}
          <tr><td colspan="7" class="text-center py-6 text-base-content/60">No employees yet.</td></tr>
        {:else}
          {#each employees as e (e.id)}
            <tr>
              <td class="font-mono text-xs">{e.employee_number}</td>
              <td>{e.first_name} {e.last_name}</td>
              <td>{e.email}</td>
              <td>{e.department_name ?? '—'}</td>
              <td>{e.position_title ?? '—'}</td>
              <td>{e.hire_date}</td>
              <td><span class="badge {statusBadge(e.status)} badge-sm">{e.status}</span></td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">New employee</h2>
        <button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label label-text">First name</label><input class="input input-bordered w-full" bind:value={form.first_name} /></div>
        <div><label class="label label-text">Last name</label><input class="input input-bordered w-full" bind:value={form.last_name} /></div>
        <div><label class="label label-text">Email</label><input type="email" class="input input-bordered w-full" bind:value={form.email} /></div>
        <div><label class="label label-text">Work email</label><input type="email" class="input input-bordered w-full" bind:value={form.work_email} /></div>
        <div><label class="label label-text">Phone</label><input class="input input-bordered w-full" bind:value={form.phone} /></div>
        <div><label class="label label-text">Hire date</label><input type="date" class="input input-bordered w-full" bind:value={form.hire_date} /></div>
        <div>
          <label class="label label-text">Department</label>
          <select class="select select-bordered w-full" bind:value={form.department_id}>
            <option value="">— None —</option>
            {#each departments as d (d.id)}<option value={d.id}>{d.name}</option>{/each}
          </select>
        </div>
        <div>
          <label class="label label-text">Position</label>
          <select class="select select-bordered w-full" bind:value={form.position_id}>
            <option value="">— None —</option>
            {#each positions as p (p.id)}<option value={p.id}>{p.title}</option>{/each}
          </select>
        </div>
        <div>
          <label class="label label-text">Employment type</label>
          <select class="select select-bordered w-full" bind:value={form.employment_type}>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="contractor">Contractor</option>
            <option value="intern">Intern</option>
          </select>
        </div>
        <div><label class="label label-text">Salary</label><input type="number" step="0.01" class="input input-bordered w-full" bind:value={form.salary} /></div>
        <div>
          <label class="label label-text">Currency</label>
          <input class="input input-bordered w-full" bind:value={form.currency} maxlength="3" />
        </div>
        <div class="col-span-2"><label class="label label-text">Address</label><input class="input input-bordered w-full" bind:value={form.address} /></div>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button>
        <button class="btn btn-primary" disabled={saving || !form.first_name || !form.last_name || !form.email} onclick={createEmployee}>
          {saving ? 'Saving…' : 'Create employee'}
        </button>
      </div>
    </div>
  </div>
{/if}
