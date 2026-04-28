<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Monitor, Tablet, Smartphone, Save, Globe, RotateCcw, RotateCw, ArrowLeft, Check, LoaderCircle } from '@lucide/svelte';
  import type { Block, DeviceMode } from '../lib/builder-types.js';
  import BlockLibrary from '../components/builder/BlockLibrary.svelte';
  import Canvas from '../components/builder/Canvas.svelte';
  import PropertiesPanel from '../components/builder/PropertiesPanel.svelte';

  const engineUrl = (window as any).__ZVELTIO_ENGINE_URL__ ?? '';
  const pageId = window.location.hash.match(/\/pages\/([^/]+)\/edit/)?.[1];

  // ── Page state ─────────────────────────────────────────────────────────────

  let page = $state<any>(null);
  let loading = $state(true);
  let saving = $state(false);
  let savedFlash = $state(false);
  let titleEditing = $state(false);

  // ── Builder state ───────────────────────────────────────────────────────────

  let blocks = $state<Block[]>([]);
  let selectedId = $state<string | null>(null);
  let device = $state<DeviceMode>('desktop');

  // ── Undo / redo ─────────────────────────────────────────────────────────────

  let history = $state<Block[][]>([]);
  let future  = $state<Block[][]>([]);

  function commit(next: Block[]) {
    history = [...history, blocks];
    future = [];
    blocks = next;
  }

  function undo() {
    if (!history.length) return;
    future = [blocks, ...future];
    blocks = history[history.length - 1];
    history = history.slice(0, -1);
  }

  function redo() {
    if (!future.length) return;
    history = [...history, blocks];
    blocks = future[0];
    future = future.slice(1);
  }

  // ── Computed selected block ─────────────────────────────────────────────────

  const selectedBlock = $derived(blocks.find(b => b.id === selectedId) ?? null);

  // ── Load ─────────────────────────────────────────────────────────────────────

  onMount(async () => {
    if (!pageId) { loading = false; return; }
    try {
      const res = await fetch(`${engineUrl}/api/pages/${pageId}`, { credentials: 'include' });
      const data = await res.json();
      page = data.page;
      blocks = Array.isArray(page?.blocks) ? page.blocks : [];
    } finally {
      loading = false;
    }
  });

  // ── Save / publish ───────────────────────────────────────────────────────────

  async function save(status?: string) {
    if (!page || saving) return;
    saving = true;
    try {
      await fetch(`${engineUrl}/api/pages/${pageId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       page.title,
          slug:        page.slug,
          description: page.description,
          blocks,
          meta:        page.meta,
          ...(status ? { status } : {}),
        }),
      });
      if (status) page.status = status;
      savedFlash = true;
      setTimeout(() => (savedFlash = false), 2000);
    } finally {
      saving = false;
    }
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────

  function onKeydown(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
    if (mod && e.key === 's') { e.preventDefault(); save(); return; }
    if (e.key === 'Escape') { selectedId = null; return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
      e.preventDefault();
      commit(blocks.filter(b => b.id !== selectedId));
      selectedId = null;
    }
  }

  onMount(() => { window.addEventListener('keydown', onKeydown); });
  onDestroy(() => { window.removeEventListener('keydown', onKeydown); });

  // ── Block operations (passed to Canvas / Library) ─────────────────────────

  function onAdd(block: Block) {
    commit([...blocks, block]);
    selectedId = block.id;
  }

  function onCanvasChange(next: Block[]) {
    commit(next);
  }

  function onPatch(fn: (b: Block) => Block) {
    commit(blocks.map(b => b.id === selectedId ? fn(b) : b));
  }
</script>

{#if loading}
  <div class="flex items-center justify-center h-screen">
    <LoaderCircle size={28} class="animate-spin text-base-content/40" />
  </div>
{:else if !page}
  <div class="flex flex-col items-center justify-center h-screen gap-3 text-base-content/40">
    <p class="text-lg">Page not found</p>
    <a href="#/pages" class="btn btn-ghost btn-sm">← Back to pages</a>
  </div>
{:else}
  <div class="flex flex-col h-screen overflow-hidden bg-base-200">

    <!-- ── Top bar ─────────────────────────────────────────────────────────── -->
    <header class="flex items-center justify-between gap-3 px-3 py-2 bg-base-100 border-b border-base-300 shrink-0 z-30">

      <!-- Left: back + title -->
      <div class="flex items-center gap-2 min-w-0">
        <a href="#/pages" class="btn btn-ghost btn-xs gap-1 shrink-0">
          <ArrowLeft size={13} /> Pages
        </a>
        <div class="h-4 w-px bg-base-300 shrink-0"></div>
        {#if titleEditing}
          <input
            class="input input-xs font-semibold max-w-[220px]"
            bind:value={page.title}
            onblur={() => (titleEditing = false)}
            onkeydown={(e) => e.key === 'Enter' && (titleEditing = false)}
            autofocus
          />
        {:else}
          <button
            class="text-sm font-semibold truncate max-w-[220px] hover:text-primary transition-colors text-left"
            onclick={() => (titleEditing = true)}
            title="Click to rename"
          >{page.title}</button>
        {/if}
        <span class="text-xs text-base-content/30 font-mono truncate hidden sm:block">/{page.slug}</span>
        <span class="badge badge-xs {page.status === 'published' ? 'badge-success' : 'badge-warning'} shrink-0">
          {page.status}
        </span>
      </div>

      <!-- Center: device mode -->
      <div class="flex items-center gap-0.5 bg-base-200 rounded-lg p-0.5 shrink-0">
        {#each ([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const) as [mode, Icon]}
          <button
            class="p-1.5 rounded-md transition-colors {device === mode ? 'bg-base-100 shadow-sm text-primary' : 'text-base-content/40 hover:text-base-content'}"
            onclick={() => (device = mode)}
            title={mode}
          ><Icon size={14} /></button>
        {/each}
      </div>

      <!-- Right: undo/redo + save + publish -->
      <div class="flex items-center gap-1 shrink-0">
        <button class="btn btn-ghost btn-xs" onclick={undo} disabled={!history.length} title="Undo (Ctrl+Z)">
          <RotateCcw size={13} />
        </button>
        <button class="btn btn-ghost btn-xs" onclick={redo} disabled={!future.length} title="Redo (Ctrl+Y)">
          <RotateCw size={13} />
        </button>
        <div class="h-4 w-px bg-base-300 mx-0.5"></div>
        {#if page.status !== 'published'}
          <button class="btn btn-ghost btn-xs gap-1" onclick={() => save('published')}>
            <Globe size={13} /> Publish
          </button>
        {/if}
        <button
          class="btn btn-primary btn-xs gap-1"
          onclick={() => save()}
          disabled={saving}
        >
          {#if saving}
            <LoaderCircle size={12} class="animate-spin" />
          {:else if savedFlash}
            <Check size={12} />
          {:else}
            <Save size={12} />
          {/if}
          {savedFlash ? 'Saved' : 'Save'}
        </button>
      </div>
    </header>

    <!-- ── 3-panel body ───────────────────────────────────────────────────── -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Left: block library -->
      <BlockLibrary onAdd={onAdd} />

      <!-- Center: canvas -->
      <Canvas
        {blocks}
        {selectedId}
        {device}
        onChange={onCanvasChange}
        onSelect={(id) => (selectedId = id)}
      />

      <!-- Right: properties -->
      {#if selectedBlock}
        <PropertiesPanel block={selectedBlock} {onPatch} />
      {:else}
        <div class="w-64 shrink-0 bg-base-100 border-l border-base-300 flex flex-col items-center justify-center gap-2 text-base-content/25 select-none">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <p class="text-xs text-center px-4 leading-relaxed">Select a block to edit its properties</p>
        </div>
      {/if}

    </div>
  </div>
{/if}
