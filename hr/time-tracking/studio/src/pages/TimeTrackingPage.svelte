<script lang="ts">
  import { onMount } from 'svelte';
  import { Clock, Play, Square, Plus } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let entries = $state<any[]>([]);
  let projects = $state<any[]>([]);
  let activeTimer = $state<any>(null);
  let loading = $state(false);
  let error = $state('');

  let timerForm = $state({ project_id: '', description: '' });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadAll() {
    loading = true; error = '';
    try {
      const [ent, projs, timer] = await Promise.all([
        api('/api/time/entries?limit=50'),
        api('/api/time/projects'),
        api('/api/time/timer/active').catch(() => ({ data: null })),
      ]);
      entries = ent.data ?? [];
      projects = projs.data ?? [];
      activeTimer = timer.data;
    } catch (e: any) { error = e.message; }
    finally { loading = false; }
  }

  async function startTimer() {
    try {
      await api('/api/time/timer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timerForm),
      });
      timerForm = { project_id: '', description: '' };
      await loadAll();
    } catch (e: any) { error = e.message; }
  }

  async function stopTimer() {
    try {
      await api('/api/time/timer/stop', { method: 'POST' });
      await loadAll();
    } catch (e: any) { error = e.message; }
  }

  function fmtDuration(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }

  onMount(loadAll);
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Clock class="h-6 w-6" /> Time Tracking</h1>
  </header>

  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="bg-base-100 rounded-lg shadow p-4">
    {#if activeTimer}
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-base-content/60">Tracking now</div>
          <div class="font-medium">{activeTimer.description || activeTimer.project_name || '(no description)'}</div>
          <div class="text-xs text-base-content/60">Started: {new Date(activeTimer.started_at).toLocaleString()}</div>
        </div>
        <button class="btn btn-error btn-sm gap-2" onclick={stopTimer}>
          <Square class="h-4 w-4" /> Stop timer
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select class="select select-bordered w-full" bind:value={timerForm.project_id}>
          <option value="">— Project —</option>
          {#each projects as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
        </select>
        <input class="input input-bordered w-full md:col-span-1" placeholder="What are you working on?" bind:value={timerForm.description} />
        <button class="btn btn-primary gap-2" disabled={!timerForm.project_id} onclick={startTimer}>
          <Play class="h-4 w-4" /> Start timer
        </button>
      </div>
    {/if}
  </div>

  <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
    <table class="table table-sm">
      <thead><tr><th>Date</th><th>Project</th><th>Description</th><th>Duration</th><th>Billable</th></tr></thead>
      <tbody>
        {#if loading}
          <tr><td colspan="5" class="text-center py-6 text-base-content/60">Loading…</td></tr>
        {:else if entries.length === 0}
          <tr><td colspan="5" class="text-center py-6 text-base-content/60">No time entries.</td></tr>
        {:else}
          {#each entries as e (e.id)}
            <tr>
              <td>{e.date}</td>
              <td>{e.project_name ?? '—'}</td>
              <td>{e.description ?? '—'}</td>
              <td>{fmtDuration(Number(e.minutes ?? 0))}</td>
              <td>{e.billable ? '✓' : ''}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
