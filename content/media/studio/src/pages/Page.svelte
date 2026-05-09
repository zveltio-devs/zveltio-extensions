<script lang="ts">
  import { onMount } from 'svelte';
  import { Images, Upload, Trash2, X } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';
  let assets = $state<any[]>([]);
  let error = $state('');
  let dragOver = $state(false);
  let uploading = $state(false);

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function load() { try { const r = await api('/api/media'); assets = r.data ?? r.items ?? []; } catch (e: any) { error = e.message; } }
  async function deleteAsset(id: string) { if (!confirm('Delete asset?')) return; try { await api(`/api/media/${id}`, { method: 'DELETE' }); await load(); } catch (e: any) { error = e.message; } }

  async function uploadFiles(files: FileList | null) {
    if (!files || !files.length) return;
    uploading = true; error = '';
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', f);
        await fetch(`${engineUrl}/api/storage/upload`, { method: 'POST', credentials: 'include', body: fd }).then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Upload failed');
        });
      }
      await load();
    } catch (e: any) { error = e.message; }
    finally { uploading = false; }
  }

  function isImage(asset: any) { return (asset.mime_type ?? asset.contentType ?? '').startsWith('image/'); }
  function fmtBytes(n: number) { if (!n) return '—'; const u = ['B','KB','MB','GB']; let i = 0; while (n > 1024 && i < u.length - 1) { n /= 1024; i++; } return `${n.toFixed(1)} ${u[i]}`; }

  onMount(load);
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Images class="h-6 w-6" /> Media Library</h1>
    <label class="btn btn-primary btn-sm gap-2">
      <Upload class="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload'}
      <input type="file" multiple class="hidden" onchange={(e) => uploadFiles((e.target as HTMLInputElement).files)} />
    </label>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <div
    class="border-2 border-dashed rounded-lg p-8 text-center transition"
    class:border-primary={dragOver}
    class:bg-primary={dragOver}
    class:bg-opacity-5={dragOver}
    ondragover={(e) => { e.preventDefault(); dragOver = true; }}
    ondragleave={() => (dragOver = false)}
    ondrop={(e) => { e.preventDefault(); dragOver = false; uploadFiles(e.dataTransfer?.files ?? null); }}
  >
    <Upload class="h-8 w-8 mx-auto mb-2 text-base-content/40" />
    <p class="text-sm text-base-content/60">Drag files here, or click "Upload" above.</p>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
    {#each assets as a (a.id)}
      <div class="bg-base-100 rounded-lg shadow overflow-hidden group relative">
        <div class="aspect-square bg-base-200 flex items-center justify-center overflow-hidden">
          {#if isImage(a)}
            <img src={a.url ?? `${engineUrl}/api/media/${a.id}/raw`} alt={a.filename ?? a.name} class="w-full h-full object-cover" />
          {:else}
            <Images class="h-10 w-10 text-base-content/40" />
          {/if}
        </div>
        <div class="p-2">
          <div class="text-xs truncate">{a.filename ?? a.name}</div>
          <div class="text-[10px] text-base-content/60">{fmtBytes(Number(a.size_bytes ?? a.size ?? 0))}</div>
        </div>
        <button class="btn btn-error btn-xs btn-circle absolute top-2 right-2 opacity-0 group-hover:opacity-100" title="Delete" onclick={() => deleteAsset(a.id)}>
          <Trash2 class="h-3 w-3" />
        </button>
      </div>
    {/each}
    {#if assets.length === 0}
      <div class="col-span-full text-center py-12 text-base-content/60">No media uploaded yet.</div>
    {/if}
  </div>
</div>
