<script lang="ts">
  import { onMount } from 'svelte';
  import { FileText, Plus, X, Download, Eye } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let documents = $state<any[]>([]);
  let templates = $state<any[]>([]);
  let error = $state('');
  let q = $state('');

  let showForm = $state(false);
  let saving = $state(false);
  let form = $state({ template_id: '', name: '', variables: '{}' });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadDocs() {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const r = await api(`/api/documents?${params}`);
      documents = r.data ?? [];
    } catch (e: any) { error = e.message; }
  }
  async function loadTemplates() { try { const r = await api('/api/document-templates'); templates = r.data ?? []; } catch {} }

  async function generate() {
    saving = true; error = '';
    try {
      let vars = {};
      try { vars = JSON.parse(form.variables); } catch { throw new Error('Invalid JSON in variables'); }
      await api('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, variables: vars }) });
      showForm = false;
      form = { template_id: '', name: '', variables: '{}' };
      await loadDocs();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  onMount(() => { loadDocs(); loadTemplates(); });

  function downloadUrl(id: string) { return `${engineUrl}/api/documents/${id}/download`; }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><FileText class="h-6 w-6" /> Documents</h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}><Plus class="h-4 w-4" /> Generate document</button>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="join">
    <input class="input input-sm input-bordered join-item" placeholder="Search..." bind:value={q} onkeydown={(e) => e.key === 'Enter' && loadDocs()} />
    <button class="btn btn-sm join-item" onclick={loadDocs}>Search</button>
  </div>

  <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
    <table class="table table-sm">
      <thead><tr><th>Name</th><th>Template</th><th>Generated</th><th>Format</th><th></th></tr></thead>
      <tbody>
        {#if documents.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No documents yet. Use "Generate" with a template.</td></tr>
        {:else}{#each documents as d (d.id)}
          <tr>
            <td>{d.name}</td>
            <td>{d.template_name ?? '—'}</td>
            <td>{d.created_at?.slice(0, 16).replace('T', ' ')}</td>
            <td><span class="badge badge-ghost badge-sm">{d.format ?? 'pdf'}</span></td>
            <td><a class="btn btn-ghost btn-xs gap-1" href={downloadUrl(d.id)} target="_blank"><Download class="h-3 w-3" /></a></td>
          </tr>
        {/each}{/if}
      </tbody>
    </table>
  </div>
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">Generate document</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="space-y-3">
        <div>
          <label class="label label-text">Template</label>
          <select class="select select-bordered w-full" bind:value={form.template_id}>
            <option value="">— Select template —</option>
            {#each templates as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
          </select>
        </div>
        <div><label class="label label-text">Document name</label><input class="input input-bordered w-full" bind:value={form.name} /></div>
        <div><label class="label label-text">Variables (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="6" bind:value={form.variables} placeholder={'{"client_name":"Acme","amount":1000}'}></textarea></div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !form.template_id || !form.name} onclick={generate}>{saving ? 'Generating…' : 'Generate'}</button></div>
    </div>
  </div>
{/if}
