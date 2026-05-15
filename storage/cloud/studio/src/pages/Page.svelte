<script lang="ts">
  import { onMount } from 'svelte';
  import { Cloud, Folder, FileText, Upload, Trash2, Share2, ChevronRight, ArrowLeft, X } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';
  let path = $state('/');
  let entries = $state<any[]>([]);
  let selected = $state<any | null>(null);
  let error = $state('');
  let dragOver = $state(false);
  let uploading = $state(false);

  let showShareDialog = $state(false);
  let shareUrl = $state('');
  let shareForm = $state({ expires_in_hours: 24, password: '' });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function load() {
    try {
      const r = await api(`/ext/storage/cloud/files?path=${encodeURIComponent(path)}`);
      entries = r.data ?? r.entries ?? [];
    } catch (e: any) { error = e.message; }
  }

  function navigate(p: string) { path = p; selected = null; }
  function up() { const parts = path.split('/').filter(Boolean); parts.pop(); navigate('/' + parts.join('/')); }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    uploading = true; error = '';
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', f);
        fd.append('path', path);
        await fetch(`${engineUrl}/ext/storage/cloud/upload`, { method: 'POST', credentials: 'include', body: fd })
          .then(async (r) => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Upload failed'); });
      }
      await load();
    } catch (e: any) { error = e.message; }
    finally { uploading = false; }
  }

  async function deleteEntry(e: any) {
    if (!confirm(`Delete ${e.name}?`)) return;
    try {
      await api(`/ext/storage/cloud/files/${encodeURIComponent(e.id ?? e.path)}`, { method: 'DELETE' });
      await load();
    } catch (err: any) { error = err.message; }
  }

  async function makeShare(e: any) {
    selected = e;
    shareForm = { expires_in_hours: 24, password: '' };
    shareUrl = '';
    showShareDialog = true;
  }

  async function createShare() {
    if (!selected) return;
    try {
      const r = await api('/ext/storage/cloud/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: selected.id, ...shareForm }),
      });
      shareUrl = r.share_url ?? `${engineUrl}/share/${r.token}`;
    } catch (e: any) { error = e.message; }
  }

  $effect(() => { path; load(); });
  onMount(load);

  function fmtBytes(n: number) { if (!n) return '—'; const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (n > 1024 && i < u.length - 1) { n /= 1024; i++; } return `${n.toFixed(1)} ${u[i]}`; }
  function pathParts(p: string) { return p.split('/').filter(Boolean); }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Cloud class="h-6 w-6" /> Cloud Storage</h1>
    <label class="btn btn-primary btn-sm gap-2">
      <Upload class="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload'}
      <input type="file" multiple class="hidden" onchange={(e) => uploadFiles((e.target as HTMLInputElement).files)} />
    </label>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div class="flex items-center gap-2 text-sm">
    {#if path !== '/'}<button class="btn btn-ghost btn-xs btn-square" onclick={up}><ArrowLeft class="h-4 w-4" /></button>{/if}
    <button class="link" onclick={() => navigate('/')}>Root</button>
    {#each pathParts(path) as part, idx (idx)}
      <ChevronRight class="h-3 w-3 text-base-content/40" />
      <button class="link" onclick={() => navigate('/' + pathParts(path).slice(0, idx + 1).join('/'))}>{part}</button>
    {/each}
  </div>

  <div
    class="bg-base-100 rounded-lg shadow"
    class:ring-2={dragOver}
    class:ring-primary={dragOver}
    ondragover={(e) => { e.preventDefault(); dragOver = true; }}
    ondragleave={() => (dragOver = false)}
    ondrop={(e) => { e.preventDefault(); dragOver = false; uploadFiles(e.dataTransfer?.files ?? null); }}
  >
    {#if entries.length === 0}
      <div class="p-12 text-center text-base-content/60">
        <Folder class="h-10 w-10 mx-auto mb-2 opacity-40" />
        Empty folder. Drag files here or click Upload.
      </div>
    {:else}
      <table class="table table-sm">
        <thead><tr><th></th><th>Name</th><th class="text-right">Size</th><th>Modified</th><th></th></tr></thead>
        <tbody>
          {#each entries as e (e.id ?? e.name)}
            <tr class="hover:bg-base-200">
              <td class="w-10">{#if e.is_folder ?? e.type === 'folder'}<Folder class="h-4 w-4 text-warning" />{:else}<FileText class="h-4 w-4 text-base-content/60" />{/if}</td>
              <td>
                {#if e.is_folder ?? e.type === 'folder'}
                  <button class="link" onclick={() => navigate(`${path === '/' ? '' : path}/${e.name}`)}>{e.name}</button>
                {:else}
                  <a class="link" href="{engineUrl}/ext/storage/cloud/files/{e.id ?? encodeURIComponent(e.path)}/download" target="_blank">{e.name}</a>
                {/if}
              </td>
              <td class="text-right">{e.is_folder ? '—' : fmtBytes(Number(e.size_bytes ?? e.size ?? 0))}</td>
              <td class="text-xs text-base-content/60">{e.updated_at?.slice(0, 16).replace('T', ' ') ?? '—'}</td>
              <td>
                {#if !(e.is_folder ?? e.type === 'folder')}
                  <button class="btn btn-ghost btn-xs btn-square" title="Share" onclick={() => makeShare(e)}><Share2 class="h-3 w-3" /></button>
                {/if}
                <button class="btn btn-ghost btn-xs btn-square text-error" title="Delete" onclick={() => deleteEntry(e)}><Trash2 class="h-3 w-3" /></button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

{#if showShareDialog}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showShareDialog = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">Share {selected?.name}</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showShareDialog = false)}><X class="h-4 w-4" /></button></div>
      {#if !shareUrl}
        <div class="space-y-3">
          <div><label class="label label-text">Expires (hours)</label><input type="number" class="input input-bordered w-full" bind:value={shareForm.expires_in_hours} /></div>
          <div><label class="label label-text">Password (optional)</label><input type="password" class="input input-bordered w-full" bind:value={shareForm.password} /></div>
        </div>
        <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showShareDialog = false)}>Cancel</button><button class="btn btn-primary gap-2" onclick={createShare}><Share2 class="h-4 w-4" /> Generate link</button></div>
      {:else}
        <div class="space-y-3">
          <p class="text-sm">Anyone with this link can access the file{shareForm.password ? ' (password required)' : ''} for {shareForm.expires_in_hours}h:</p>
          <input class="input input-bordered w-full font-mono text-xs" value={shareUrl} readonly onclick={(e) => (e.target as HTMLInputElement).select()} />
        </div>
        <div class="flex justify-end mt-4"><button class="btn btn-primary" onclick={() => { navigator.clipboard?.writeText(shareUrl); showShareDialog = false; }}>Copy & close</button></div>
      {/if}
    </div>
  </div>
{/if}
