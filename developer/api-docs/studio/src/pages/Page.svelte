<script lang="ts">
  import { onMount } from 'svelte';
  import { BookOpen, Plus, X, FileCode, Key } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';
  let tab = $state<'changelog' | 'custom' | 'tokens'>('changelog');
  let changelogs = $state<any[]>([]);
  let customDocs = $state<any[]>([]);
  let tokens = $state<any[]>([]);
  let error = $state('');

  let showCustomForm = $state(false);
  let saving = $state(false);
  let customForm = $state({ slug: '', title: '', body: '# New documentation page\n\nWrite content in Markdown.', is_public: false });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }
  async function loadChangelog() { try { const r = await api('/api/api-docs/changelogs'); changelogs = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadCustom() { try { const r = await api('/api/api-docs/custom'); customDocs = r.data ?? []; } catch (e: any) { error = e.message; } }
  async function loadTokens() { try { const r = await api('/api/api-docs/access-tokens'); tokens = r.data ?? []; } catch (e: any) { error = e.message; } }

  async function createCustom() {
    saving = true; error = '';
    try {
      await api('/api/api-docs/custom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customForm) });
      showCustomForm = false;
      customForm = { slug: '', title: '', body: '# New documentation page\n\nWrite content in Markdown.', is_public: false };
      await loadCustom();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  async function generateToken() { try { await api('/api/api-docs/access-tokens', { method: 'POST' }); await loadTokens(); } catch (e: any) { error = e.message; } }
  async function revokeToken(id: string) { if (!confirm('Revoke token?')) return; try { await api(`/api/api-docs/access-tokens/${id}`, { method: 'DELETE' }); await loadTokens(); } catch (e: any) { error = e.message; } }

  $effect(() => {
    if (tab === 'changelog') loadChangelog();
    else if (tab === 'custom') loadCustom();
    else loadTokens();
  });
  onMount(loadChangelog);
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><BookOpen class="h-6 w-6" /> API Docs</h1>
    <div class="flex gap-2">
      {#if tab === 'custom'}<button class="btn btn-primary btn-sm gap-2" onclick={() => (showCustomForm = true)}><Plus class="h-4 w-4" /> New page</button>{/if}
      {#if tab === 'tokens'}<button class="btn btn-primary btn-sm gap-2" onclick={generateToken}><Plus class="h-4 w-4" /> Generate token</button>{/if}
    </div>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div role="tablist" class="tabs tabs-bordered">
    <button role="tab" class:tab-active={tab === 'changelog'} class="tab" onclick={() => (tab = 'changelog')}>Changelog</button>
    <button role="tab" class:tab-active={tab === 'custom'} class="tab gap-2" onclick={() => (tab = 'custom')}><FileCode class="h-4 w-4" /> Custom pages</button>
    <button role="tab" class:tab-active={tab === 'tokens'} class="tab gap-2" onclick={() => (tab = 'tokens')}><Key class="h-4 w-4" /> Access tokens</button>
  </div>

  {#if tab === 'changelog'}
    <div class="space-y-3">
      <a class="link link-primary text-sm" href="{engineUrl}/api/openapi.json" target="_blank">View OpenAPI spec →</a>
      {#if changelogs.length === 0}
        <div class="bg-base-100 rounded-lg p-12 text-center text-base-content/60">No changelog entries.</div>
      {:else}
        {#each changelogs as c (c.id)}
          <div class="bg-base-100 rounded-lg shadow p-4">
            <div class="flex items-baseline justify-between mb-2">
              <h3 class="font-semibold">v{c.version}</h3>
              <span class="text-xs text-base-content/60">{c.released_at?.slice(0, 10)}</span>
            </div>
            <div class="text-sm whitespace-pre-line">{c.notes}</div>
          </div>
        {/each}
      {/if}
    </div>
  {:else if tab === 'custom'}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Slug</th><th>Title</th><th>Public</th><th>Updated</th></tr></thead>
        <tbody>
          {#if customDocs.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No custom doc pages.</td></tr>
          {:else}{#each customDocs as d (d.id)}
            <tr><td class="font-mono text-xs">{d.slug}</td><td>{d.title}</td><td>{d.is_public ? '✓' : '—'}</td><td>{d.updated_at?.slice(0, 10)}</td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-sm">
        <thead><tr><th>Token</th><th>Created</th><th>Last used</th><th></th></tr></thead>
        <tbody>
          {#if tokens.length === 0}<tr><td colspan="4" class="text-center py-6 text-base-content/60">No tokens. Generate one for read-only doc access.</td></tr>
          {:else}{#each tokens as t (t.id)}
            <tr><td class="font-mono text-xs">{t.token_preview ?? `${t.token?.slice(0, 12)}…`}</td><td>{t.created_at?.slice(0, 16).replace('T', ' ')}</td><td>{t.last_used_at?.slice(0, 16).replace('T', ' ') ?? 'never'}</td><td><button class="btn btn-ghost btn-xs" onclick={() => revokeToken(t.id)}>Revoke</button></td></tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if showCustomForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showCustomForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New doc page</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showCustomForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label label-text">Slug</label><input class="input input-bordered w-full font-mono" bind:value={customForm.slug} placeholder="getting-started" /></div>
          <div class="flex items-end"><label class="label cursor-pointer gap-2"><input type="checkbox" class="checkbox checkbox-sm" bind:checked={customForm.is_public} /><span class="label-text">Public</span></label></div>
        </div>
        <div><label class="label label-text">Title</label><input class="input input-bordered w-full" bind:value={customForm.title} /></div>
        <div><label class="label label-text">Body (Markdown)</label><textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="14" bind:value={customForm.body}></textarea></div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showCustomForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !customForm.slug || !customForm.title} onclick={createCustom}>{saving ? 'Saving…' : 'Create'}</button></div>
    </div>
  </div>
{/if}
