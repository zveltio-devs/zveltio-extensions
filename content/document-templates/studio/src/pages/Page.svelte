<script lang="ts">
  import { onMount } from 'svelte';
  import { FileType, Plus, X } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';
  let templates = $state<any[]>([]);
  let error = $state('');
  let showForm = $state(false);
  let saving = $state(false);
  let editing = $state<any | null>(null);
  let form = $state({ name: '', description: '', format: 'html', body: '<h1>{{title}}</h1>\n<p>Hello {{client_name}}</p>' });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }
  async function load() { try { const r = await api('/ext/content/document-templates'); templates = r.data ?? []; } catch (e: any) { error = e.message; } }
  function openCreate() { editing = null; form = { name: '', description: '', format: 'html', body: '<h1>{{title}}</h1>\n<p>Hello {{client_name}}</p>' }; showForm = true; }
  function openEdit(t: any) { editing = t; form = { name: t.name, description: t.description ?? '', format: t.format, body: t.body }; showForm = true; }
  async function save() {
    saving = true; error = '';
    try {
      if (editing) await api(`/ext/content/document-templates/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      else await api('/ext/content/document-templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      showForm = false;
      await load();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }
  onMount(load);
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><FileType class="h-6 w-6" /> Document Templates</h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={openCreate}><Plus class="h-4 w-4" /> New template</button>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
    <table class="table table-sm">
      <thead><tr><th>Name</th><th>Format</th><th>Description</th><th></th></tr></thead>
      <tbody>
        {#if templates.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No templates.</td></tr>
        {:else}{#each templates as t (t.id)}
          <tr><td>{t.name}</td><td><span class="badge badge-ghost badge-sm">{t.format}</span></td><td class="max-w-xs truncate">{t.description ?? '—'}</td><td><button class="btn btn-ghost btn-xs" onclick={() => openEdit(t)}>Edit</button></td></tr>
        {/each}{/if}
      </tbody>
    </table>
  </div>
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">{editing ? 'Edit' : 'New'} template</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label label-text">Name</label><input class="input input-bordered w-full" bind:value={form.name} /></div>
          <div><label class="label label-text">Format</label><select class="select select-bordered w-full" bind:value={form.format}><option value="html">HTML (PDF)</option><option value="docx">DOCX</option><option value="markdown">Markdown</option></select></div>
        </div>
        <div><label class="label label-text">Description</label><input class="input input-bordered w-full" bind:value={form.description} /></div>
        <div>
          <label class="label label-text">Body — use <code class="text-xs">{`{{var_name}}`}</code> for substitution</label>
          <textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="14" bind:value={form.body}></textarea>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !form.name} onclick={save}>{saving ? 'Saving…' : 'Save'}</button></div>
    </div>
  </div>
{/if}
