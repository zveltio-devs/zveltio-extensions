<script lang="ts">
  import { onMount } from 'svelte';
  import { FileEdit, Send } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';
  let drafts = $state<any[]>([]);
  let error = $state('');

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }
  async function load() { try { const r = await api('/ext/content/drafts'); drafts = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function publish(id: string) { try { await api(`/ext/content/drafts/${id}/publish`, { method: 'POST' }); await load(); } catch (e: any) { error = e.message; } }
  async function discard(id: string) { if (!confirm('Discard draft?')) return; try { await api(`/ext/content/drafts/${id}`, { method: 'DELETE' }); await load(); } catch (e: any) { error = e.message; } }
  onMount(load);
</script>

<div class="p-6 space-y-4">
  <header><h1 class="text-2xl font-semibold flex items-center gap-2"><FileEdit class="h-6 w-6" /> Drafts</h1></header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}
  <p class="text-sm text-base-content/70">Pending drafts across all collections that have draft/publish enabled. Publish promotes the draft to the live record.</p>

  <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
    <table class="table table-sm">
      <thead><tr><th>Collection</th><th>Record</th><th>Author</th><th>Updated</th><th></th></tr></thead>
      <tbody>
        {#if drafts.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No pending drafts.</td></tr>
        {:else}{#each drafts as d (d.id)}
          <tr><td><span class="badge badge-ghost">{d.collection}</span></td><td class="font-mono text-xs">{d.record_id}</td><td>{d.author_name ?? d.author_id}</td><td>{d.updated_at?.slice(0, 16).replace('T', ' ')}</td><td><button class="btn btn-success btn-xs gap-1" onclick={() => publish(d.id)}><Send class="h-3 w-3" /> Publish</button> <button class="btn btn-ghost btn-xs" onclick={() => discard(d.id)}>Discard</button></td></tr>
        {/each}{/if}
      </tbody>
    </table>
  </div>
</div>
