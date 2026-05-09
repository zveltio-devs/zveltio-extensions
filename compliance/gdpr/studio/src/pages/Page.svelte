<script lang="ts">
  import { onMount } from 'svelte';
  import { Shield, FileWarning, Users, Database } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';
  let tab = $state<'requests' | 'breaches' | 'consents' | 'records'>('requests');
  let requests = $state<any[]>([]);
  let breaches = $state<any[]>([]);
  let consents = $state<any[]>([]);
  let records = $state<any[]>([]);
  let error = $state('');

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  $effect(() => {
    if (tab === 'requests') api('/api/gdpr/access-requests').then((r) => requests = r.data ?? []).catch((e) => error = e.message);
    else if (tab === 'breaches') api('/api/gdpr/breach-incidents').then((r) => breaches = r.data ?? []).catch((e) => error = e.message);
    else if (tab === 'consents') api('/api/gdpr/consents').then((r) => consents = r.data ?? []).catch((e) => error = e.message);
    else if (tab === 'records') api('/api/gdpr/processing-records').then((r) => records = r.data ?? []).catch((e) => error = e.message);
  });

  async function fulfill(id: string) { try { await api(`/api/gdpr/access-requests/${id}/fulfill`, { method: 'POST' }); requests = (await api('/api/gdpr/access-requests')).data ?? []; } catch (e: any) { error = e.message; } }
  async function reject(id: string) { try { await api(`/api/gdpr/access-requests/${id}/reject`, { method: 'POST' }); requests = (await api('/api/gdpr/access-requests')).data ?? []; } catch (e: any) { error = e.message; } }
</script>

<div class="p-6 space-y-4">
  <header><h1 class="text-2xl font-semibold flex items-center gap-2"><Shield class="h-6 w-6" /> GDPR Compliance</h1></header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div role="tablist" class="tabs tabs-bordered">
    <button role="tab" class:tab-active={tab === 'requests'} class="tab gap-2" onclick={() => (tab = 'requests')}><Users class="h-4 w-4" /> Access requests</button>
    <button role="tab" class:tab-active={tab === 'breaches'} class="tab gap-2" onclick={() => (tab = 'breaches')}><FileWarning class="h-4 w-4" /> Breaches</button>
    <button role="tab" class:tab-active={tab === 'consents'} class="tab" onclick={() => (tab = 'consents')}>Consents</button>
    <button role="tab" class:tab-active={tab === 'records'} class="tab gap-2" onclick={() => (tab = 'records')}><Database class="h-4 w-4" /> Processing records</button>
  </div>

  {#if tab === 'requests'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Type</th><th>Subject</th><th>Requested</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {#if requests.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No requests.</td></tr>
          {:else}{#each requests as r (r.id)}
            <tr><td><span class="badge badge-sm">{r.request_type}</span></td><td>{r.subject_email ?? r.subject_id}</td><td>{r.created_at?.slice(0, 10)}</td><td><span class="badge badge-sm">{r.status}</span></td><td>{#if r.status === 'pending'}<button class="btn btn-ghost btn-xs" onclick={() => fulfill(r.id)}>Fulfill</button> <button class="btn btn-ghost btn-xs" onclick={() => reject(r.id)}>Reject</button>{/if}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else if tab === 'breaches'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Date</th><th>Description</th><th>Severity</th><th>Affected</th><th>Notified DPA</th></tr></thead>
        <tbody>
          {#if breaches.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No breach incidents recorded.</td></tr>
          {:else}{#each breaches as b (b.id)}
            <tr><td>{b.detected_at?.slice(0, 10)}</td><td class="max-w-xs truncate">{b.description}</td><td><span class="badge badge-error badge-sm">{b.severity}</span></td><td>{b.affected_count ?? '?'}</td><td>{b.notified_dpa_at ? '✓' : '—'}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else if tab === 'consents'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Subject</th><th>Purpose</th><th>Granted</th><th>Withdrawn</th></tr></thead>
        <tbody>
          {#if consents.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No consents recorded.</td></tr>
          {:else}{#each consents as c (c.id)}
            <tr><td>{c.subject_id}</td><td>{c.purpose}</td><td>{c.granted_at?.slice(0, 10)}</td><td>{c.withdrawn_at?.slice(0, 10) ?? '—'}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Activity</th><th>Lawful basis</th><th>Categories</th><th>Retention</th></tr></thead>
        <tbody>
          {#if records.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No records of processing yet.</td></tr>
          {:else}{#each records as r (r.id)}
            <tr><td>{r.activity_name}</td><td>{r.lawful_basis}</td><td class="text-xs">{(r.data_categories ?? []).join(', ')}</td><td>{r.retention_period ?? '—'}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>
