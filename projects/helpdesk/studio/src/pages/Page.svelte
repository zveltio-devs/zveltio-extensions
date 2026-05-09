<script lang="ts">
  import { onMount } from 'svelte';
  import { Headphones, Plus, X } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let tickets = $state<any[]>([]);
  let categories = $state<any[]>([]);
  let error = $state('');
  let statusFilter = $state<'all' | 'open' | 'pending' | 'resolved' | 'closed'>('open');
  let activeTicket = $state<any | null>(null);
  let messages = $state<any[]>([]);
  let newMessage = $state('');

  let showForm = $state(false);
  let saving = $state(false);
  let form = $state({ subject: '', description: '', category_id: '', priority: 'medium', requester_email: '' });

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadTickets() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const r = await api(`/api/helpdesk/tickets?${params}`);
      tickets = r.data ?? [];
    } catch (e: any) { error = e.message; }
  }
  async function loadCategories() { try { const r = await api('/api/helpdesk/categories'); categories = r.data ?? []; } catch {} }
  async function loadMessages(id: string) { try { const r = await api(`/api/helpdesk/tickets/${id}/messages`); messages = r.data ?? []; } catch (e: any) { error = e.message; } }

  async function createTicket() {
    saving = true; error = '';
    try {
      await api('/api/helpdesk/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      showForm = false;
      form = { subject: '', description: '', category_id: '', priority: 'medium', requester_email: '' };
      await loadTickets();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }

  async function reply() {
    if (!activeTicket || !newMessage.trim()) return;
    try {
      await api(`/api/helpdesk/tickets/${activeTicket.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: newMessage }) });
      newMessage = '';
      await loadMessages(activeTicket.id);
    } catch (e: any) { error = e.message; }
  }

  async function resolve(id: string) { try { await api(`/api/helpdesk/tickets/${id}/resolve`, { method: 'POST' }); await loadTickets(); if (activeTicket?.id === id) activeTicket = null; } catch (e: any) { error = e.message; } }

  $effect(() => { statusFilter; loadTickets(); });
  $effect(() => { if (activeTicket) loadMessages(activeTicket.id); });
  onMount(() => { loadTickets(); loadCategories(); });

  function priorityBadge(p: string) { return ({ low: 'badge-ghost', medium: 'badge-info', high: 'badge-warning', urgent: 'badge-error' } as any)[p] ?? 'badge-ghost'; }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><Headphones class="h-6 w-6" /> Helpdesk</h1>
    <button class="btn btn-primary btn-sm gap-2" onclick={() => (showForm = true)}><Plus class="h-4 w-4" /> New ticket</button>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  <select bind:value={statusFilter} class="select select-sm select-bordered max-w-xs">
    <option value="all">All</option><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
  </select>

  <div class="grid grid-cols-12 gap-4">
    <div class="col-span-5 bg-base-100 rounded-lg shadow overflow-y-auto max-h-[70vh]">
      <table class="table table-sm">
        <thead><tr><th>Subject</th><th>Priority</th><th>Status</th></tr></thead>
        <tbody>
          {#if tickets.length === 0}<tr><td colspan="3" class="text-center py-6 text-base-content/60">No tickets.</td></tr>
          {:else}{#each tickets as t (t.id)}
            <tr class="cursor-pointer hover:bg-base-200" class:bg-base-200={activeTicket?.id === t.id} onclick={() => (activeTicket = t)}>
              <td>{t.subject}</td>
              <td><span class="badge {priorityBadge(t.priority)} badge-sm">{t.priority}</span></td>
              <td><span class="badge badge-ghost badge-sm">{t.status}</span></td>
            </tr>
          {/each}{/if}
        </tbody>
      </table>
    </div>
    <div class="col-span-7 bg-base-100 rounded-lg shadow p-4">
      {#if !activeTicket}
        <div class="text-center py-12 text-base-content/60">Select a ticket to view conversation.</div>
      {:else}
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="font-medium">{activeTicket.subject}</div>
            <div class="text-xs text-base-content/60">From: {activeTicket.requester_email ?? activeTicket.requester_id ?? '—'}</div>
          </div>
          {#if activeTicket.status !== 'resolved' && activeTicket.status !== 'closed'}
            <button class="btn btn-success btn-sm" onclick={() => resolve(activeTicket.id)}>Mark resolved</button>
          {/if}
        </div>
        <div class="space-y-3 mb-4 max-h-[40vh] overflow-y-auto">
          <div class="bg-base-200 rounded-lg p-3 text-sm">{activeTicket.description}</div>
          {#each messages as m (m.id)}
            <div class={`rounded-lg p-3 text-sm ${m.is_internal ? 'bg-primary/10' : ''}`}>
              <div class="text-xs text-base-content/60 mb-1">{m.author_name ?? m.author_id} · {new Date(m.created_at).toLocaleString()}</div>
              <div>{m.body}</div>
            </div>
          {/each}
        </div>
        <div class="flex gap-2">
          <textarea class="textarea textarea-bordered flex-1" rows="2" placeholder="Reply..." bind:value={newMessage}></textarea>
          <button class="btn btn-primary self-end" disabled={!newMessage.trim()} onclick={reply}>Send</button>
        </div>
      {/if}
    </div>
  </div>
</div>

{#if showForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New ticket</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="space-y-3">
        <div><label class="label label-text">Subject</label><input class="input input-bordered w-full" bind:value={form.subject} /></div>
        <div><label class="label label-text">Requester email</label><input type="email" class="input input-bordered w-full" bind:value={form.requester_email} /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label label-text">Category</label><select class="select select-bordered w-full" bind:value={form.category_id}><option value="">—</option>{#each categories as c (c.id)}<option value={c.id}>{c.name}</option>{/each}</select></div>
          <div><label class="label label-text">Priority</label><select class="select select-bordered w-full" bind:value={form.priority}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
        </div>
        <div><label class="label label-text">Description</label><textarea class="textarea textarea-bordered w-full" rows="4" bind:value={form.description}></textarea></div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !form.subject || !form.description} onclick={createTicket}>{saving ? 'Saving…' : 'Create'}</button></div>
    </div>
  </div>
{/if}
