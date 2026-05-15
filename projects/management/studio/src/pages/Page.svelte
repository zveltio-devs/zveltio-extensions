<script lang="ts">
  import { onMount } from 'svelte';
  import { FolderKanban, Plus, X, List, KanbanSquare } from '@lucide/svelte';

  const engineUrl = (window as any).__zveltio?.engineUrl ?? '';

  let view = $state<'list' | 'board'>('board');
  let projects = $state<any[]>([]);
  let activeProject = $state<any | null>(null);
  let tasks = $state<any[]>([]);
  let error = $state('');

  let showProjectForm = $state(false);
  let showTaskForm = $state(false);
  let saving = $state(false);

  let projectForm = $state({ name: '', description: '', start_date: '', end_date: '' });
  let taskForm = $state({ title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '', due_date: '' });

  const STATUSES = [
    { id: 'todo', label: 'To do' },
    { id: 'in_progress', label: 'In progress' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Done' },
  ];

  async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${engineUrl}${path}`, { credentials: 'include', ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json as T;
  }

  async function loadProjects() {
    try { const r = await api('/ext/projects/management'); projects = r.data ?? []; if (!activeProject && projects[0]) activeProject = projects[0]; }
    catch (e: any) { error = e.message; }
  }
  async function loadTasks() {
    if (!activeProject) { tasks = []; return; }
    try { const r = await api(`/ext/projects/management/${activeProject.id}/tasks`); tasks = r.data ?? []; }
    catch (e: any) { error = e.message; }
  }
  async function createProject() {
    saving = true; error = '';
    try {
      await api('/ext/projects/management', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(projectForm) });
      showProjectForm = false;
      projectForm = { name: '', description: '', start_date: '', end_date: '' };
      await loadProjects();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }
  async function createTask() {
    if (!activeProject) return;
    saving = true; error = '';
    try {
      await api(`/ext/projects/management/${activeProject.id}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskForm) });
      showTaskForm = false;
      taskForm = { title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '', due_date: '' };
      await loadTasks();
    } catch (e: any) { error = e.message; } finally { saving = false; }
  }
  async function moveTask(taskId: string, status: string) {
    try {
      await api(`/ext/projects/management/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      await loadTasks();
    } catch (e: any) { error = e.message; }
  }

  onMount(loadProjects);
  $effect(() => { activeProject; loadTasks(); });

  function tasksByStatus(s: string) { return tasks.filter((t) => t.status === s); }
</script>

<div class="p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold flex items-center gap-2"><FolderKanban class="h-6 w-6" /> Projects</h1>
    <div class="flex gap-2">
      <div class="join">
        <button class="btn btn-sm join-item" class:btn-active={view === 'board'} onclick={() => (view = 'board')}><KanbanSquare class="h-4 w-4" /></button>
        <button class="btn btn-sm join-item" class:btn-active={view === 'list'} onclick={() => (view = 'list')}><List class="h-4 w-4" /></button>
      </div>
      <button class="btn btn-primary btn-sm gap-2" onclick={() => (showProjectForm = true)}><Plus class="h-4 w-4" /> New project</button>
    </div>
  </header>
  {#if error}<div class="alert alert-error">{error}</div>{/if}

  {#if projects.length === 0}
    <div class="bg-base-100 rounded-lg p-12 text-center text-base-content/60">No projects yet — create one to start.</div>
  {:else}
    <div class="flex gap-4 items-center">
      <select class="select select-sm select-bordered" value={activeProject?.id ?? ''} onchange={(e) => { activeProject = projects.find((p) => p.id === (e.target as HTMLSelectElement).value) ?? null; }}>
        {#each projects as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
      </select>
      {#if activeProject}<button class="btn btn-sm gap-2" onclick={() => (showTaskForm = true)}><Plus class="h-3.5 w-3.5" /> New task</button>{/if}
    </div>

    {#if view === 'board'}
      <div class="grid grid-cols-4 gap-4">
        {#each STATUSES as s (s.id)}
          <div class="bg-base-200 rounded-lg p-3">
            <div class="font-medium text-sm mb-3 flex items-center justify-between">
              <span>{s.label}</span>
              <span class="badge badge-sm badge-ghost">{tasksByStatus(s.id).length}</span>
            </div>
            <div class="space-y-2 min-h-32">
              {#each tasksByStatus(s.id) as t (t.id)}
                <div class="bg-base-100 p-3 rounded shadow-sm cursor-move">
                  <div class="font-medium text-sm">{t.title}</div>
                  {#if t.description}<div class="text-xs text-base-content/60 mt-1 line-clamp-2">{t.description}</div>{/if}
                  <div class="flex gap-1 mt-2">
                    {#each STATUSES.filter((x) => x.id !== s.id) as target (target.id)}
                      <button class="btn btn-ghost btn-xs" onclick={() => moveTask(t.id, target.id)}>→ {target.label}</button>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
        <table class="table table-sm">
          <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Due date</th><th>Assignee</th></tr></thead>
          <tbody>
            {#if tasks.length === 0}<tr><td colspan="5" class="text-center py-6 text-base-content/60">No tasks.</td></tr>
            {:else}{#each tasks as t (t.id)}
              <tr><td>{t.title}</td><td><span class="badge badge-sm">{t.status}</span></td><td><span class="badge badge-ghost badge-sm">{t.priority}</span></td><td>{t.due_date ?? '—'}</td><td>{t.assignee_name ?? '—'}</td></tr>
            {/each}{/if}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>

{#if showProjectForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showProjectForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New project</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showProjectForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="space-y-3">
        <div><label class="label label-text">Name</label><input class="input input-bordered w-full" bind:value={projectForm.name} /></div>
        <div><label class="label label-text">Description</label><textarea class="textarea textarea-bordered w-full" bind:value={projectForm.description}></textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label label-text">Start</label><input type="date" class="input input-bordered w-full" bind:value={projectForm.start_date} /></div>
          <div><label class="label label-text">End</label><input type="date" class="input input-bordered w-full" bind:value={projectForm.end_date} /></div>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showProjectForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !projectForm.name} onclick={createProject}>{saving ? 'Saving…' : 'Create'}</button></div>
    </div>
  </div>
{/if}

{#if showTaskForm}
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onclick={(e) => e.target === e.currentTarget && (showTaskForm = false)}>
    <div class="bg-base-100 rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4"><h2 class="text-xl font-semibold">New task</h2><button class="btn btn-ghost btn-sm btn-square" onclick={() => (showTaskForm = false)}><X class="h-4 w-4" /></button></div>
      <div class="space-y-3">
        <div><label class="label label-text">Title</label><input class="input input-bordered w-full" bind:value={taskForm.title} /></div>
        <div><label class="label label-text">Description</label><textarea class="textarea textarea-bordered w-full" bind:value={taskForm.description}></textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label label-text">Status</label><select class="select select-bordered w-full" bind:value={taskForm.status}>{#each STATUSES as s (s.id)}<option value={s.id}>{s.label}</option>{/each}</select></div>
          <div><label class="label label-text">Priority</label><select class="select select-bordered w-full" bind:value={taskForm.priority}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
        </div>
        <div><label class="label label-text">Due date</label><input type="date" class="input input-bordered w-full" bind:value={taskForm.due_date} /></div>
      </div>
      <div class="flex justify-end gap-2 mt-4"><button class="btn btn-ghost" onclick={() => (showTaskForm = false)}>Cancel</button><button class="btn btn-primary" disabled={saving || !taskForm.title} onclick={createTask}>{saving ? 'Saving…' : 'Create'}</button></div>
    </div>
  </div>
{/if}
