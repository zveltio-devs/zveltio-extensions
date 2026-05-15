<script lang="ts">
  import { onMount } from 'svelte';
  import { ShieldCheck, Plus, X, Sparkles } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let rules = $state<any[]>([]);
  let collections = $state<any[]>([]);
  let selectedCollection = $state('');
  let error = $state('');

  let showForm = $state(false);
  let saving = $state(false);
  let aiGenerating = $state(false);
  let form = $state({
    collection: '',
    field_name: '',
    field_type: 'text',
    rule_type: 'required',
    description: '',
    config: '{}',
    severity: 'error' as 'error' | 'warning',
  });

  // AI generation
  let aiPrompt = $state('');

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadRules() {
    try {
      const params = new URLSearchParams();
      if (selectedCollection) params.set('collection', selectedCollection);
      const r = await api(`/ext/developer/validation/rules?${params}`);
      rules = r.data ?? [];
    } catch (e: any) { error = e.message; }
  }
  async function loadCollections() {
    try { const r = await api('/api/collections'); collections = r.collections ?? r.data ?? []; }
    catch { collections = []; }
  }

  async function createRule() {
    saving = true; error = '';
    try {
      let cfg: any = {};
      try { cfg = JSON.parse(form.config); } catch { throw new Error('Invalid JSON in config'); }
      await api('/ext/developer/validation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, config: cfg }),
      });
      showForm = false;
      form = { collection: '', field_name: '', field_type: 'text', rule_type: 'required', description: '', config: '{}', severity: 'error' };
      aiPrompt = '';
      await loadRules();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  async function aiGenerate() {
    if (!aiPrompt.trim() || !form.field_name) return;
    aiGenerating = true; error = '';
    try {
      const r = await api('/ext/developer/validation/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_name: form.field_name, field_type: form.field_type, description: aiPrompt }),
      });
      const ai = r.data ?? r;
      form.rule_type = ai.rule_type ?? form.rule_type;
      form.description = ai.description ?? aiPrompt;
      form.config = JSON.stringify(ai.config ?? {}, null, 2);
    } catch (e: any) { error = e.message; }
    finally { aiGenerating = false; }
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete rule?')) return;
    try { await api(`/ext/developer/validation/rules/${id}`, { method: 'DELETE' }); await loadRules(); }
    catch (e: any) { error = e.message; }
  }

  $effect(() => { selectedCollection; loadRules(); });
  onMount(() => { loadCollections(); loadRules(); });

  function severityBadge(s: string) { return s === 'error' ? 'badge-error' : 'badge-warning'; }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><ShieldCheck class="h-6 w-6" /> Data Validation Rules</h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}><Plus class="h-4 w-4" /> New rule</button>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="flex gap-3">
    <select class="select select-sm select-bordered" bind:value={selectedCollection}>
      <option value="">All collections</option>
      {#each collections as c (c.name)}<option value={c.name}>{c.display_name ?? c.name}</option>{/each}
    </select>
  </div>

  <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
    <table class="table table-sm">
      <thead><tr><th>Collection</th><th>Field</th><th>Rule type</th><th>Description</th><th>Severity</th><th></th></tr></thead>
      <tbody>
        {#if rules.length === 0}<tr><td colspan="6" class="text-center py-6 text-base-content/60">No validation rules.</td></tr>
        {:else}{#each rules as r (r.id)}
          <tr><td><span class="badge badge-ghost badge-sm">{r.collection}</span></td><td class="font-mono text-xs">{r.field_name ?? '—'}</td><td>{r.rule_type}</td><td class="max-w-xs truncate">{r.description ?? '—'}</td><td><span class="badge {severityBadge(r.severity)} badge-sm">{r.severity}</span></td><td><button class="btn btn-ghost btn-xs" onclick={() => deleteRule(r.id)}>Delete</button></td></tr>
        {/each}{/if}
      </tbody>
    </table>
  </div>
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">New validation rule</h2>
        <button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label label-text">Collection</label>
          <select class="select select-bordered w-full" bind:value={form.collection}>
            <option value="">—</option>
            {#each collections as c (c.name)}<option value={c.name}>{c.name}</option>{/each}
          </select>
        </div>
        <div><label class="label label-text">Field</label><input class="input input-bordered w-full font-mono" bind:value={form.field_name} /></div>
        <div>
          <label class="label label-text">Field type</label>
          <select class="select select-bordered w-full" bind:value={form.field_type}>
            <option value="text">text</option><option value="integer">integer</option><option value="number">number</option><option value="email">email</option><option value="date">date</option><option value="uuid">uuid</option><option value="boolean">boolean</option>
          </select>
        </div>
        <div>
          <label class="label label-text">Rule type</label>
          <select class="select select-bordered w-full" bind:value={form.rule_type}>
            <option value="required">required</option><option value="min">min</option><option value="max">max</option><option value="pattern">pattern (regex)</option><option value="enum">enum</option><option value="custom">custom</option>
          </select>
        </div>
        <div>
          <label class="label label-text">Severity</label>
          <select class="select select-bordered w-full" bind:value={form.severity}><option value="error">error (block)</option><option value="warning">warning (allow)</option></select>
        </div>
      </div>

      <div class="bg-base-200 rounded-lg p-3 mt-4">
        <div class="flex items-center gap-2 mb-2">
          <Sparkles class="h-4 w-4 text-primary" />
          <span class="font-medium text-sm">AI-assisted</span>
        </div>
        <div class="flex gap-2">
          <input class="input input-sm input-bordered flex-1" placeholder="e.g. 'Romanian CNP - 13 digits'" bind:value={aiPrompt} />
          <button class="btn btn-primary btn-sm" disabled={aiGenerating || !aiPrompt.trim() || !form.field_name} onclick={aiGenerate}>
            {aiGenerating ? '…' : 'Generate'}
          </button>
        </div>
        <p class="text-xs text-base-content/60 mt-1">Requires the AI extension to be active.</p>
      </div>

      <div class="mt-3"><label class="label label-text">Description</label><input class="input input-bordered w-full" bind:value={form.description} /></div>
      <div><label class="label label-text">Config (JSON)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="6" bind:value={form.config}></textarea></div>

      <div class="flex justify-end gap-2 mt-4">
        <button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button>
        <button class="btn btn-primary" disabled={saving || !form.collection || !form.field_name} onclick={createRule}>{saving ? 'Saving…' : 'Create rule'}</button>
      </div>
    </div>
  </div>
{/if}
