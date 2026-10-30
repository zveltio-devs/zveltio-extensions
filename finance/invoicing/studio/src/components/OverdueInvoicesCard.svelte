<script lang="ts">
/**
 * Invoicing overdue summary — dashboard.widgets slot (Model 2.5).
 */
import { resolve } from '$app/paths';
import { FileWarning } from '@lucide/svelte';
import { m } from '#lib/i18n.svelte.js';
import { api } from '#lib/api.js';

type Stats = { overdue_count: number; outstanding: number };

let stats = $state<Stats | null>(null);

/**
 * What is still owed on sent, overdue and partly paid invoices, read as the
 * viewer. ponytail: summed here over the first 500 open invoices; an aggregate
 * read when an instance carries more.
 */
async function loadStats(): Promise<void> {
  try {
    const filter = encodeURIComponent(JSON.stringify({ status: { in: ['sent', 'overdue', 'partially_paid'] } }));
    const r = await api.get<{ records?: { status: string; total: unknown; amount_paid: unknown }[] }>(
      `/api/data/invoices?filter=${filter}&limit=500`,
    );
    const open = r.records ?? [];
    stats = {
      overdue_count: open.filter((i) => i.status === 'overdue').length,
      outstanding: open.reduce((s, i) => s + Number(i.total ?? 0) - Number(i.amount_paid ?? 0), 0),
    };
  } catch {
    stats = null;
  }
}

$effect(() => {
  void loadStats();
});

const overdueCount = $derived(Number(stats?.overdue_count ?? 0));
const outstanding = $derived(Number(stats?.outstanding ?? 0));
</script>

{#if overdueCount > 0 || outstanding > 0}
  <a
    href={resolve('finance/invoicing')}
    class="card bg-base-100 border border-error/30 hover:border-error/60 transition-colors"
  >
    <div class="card-body flex-row items-center gap-4 py-4">
      <FileWarning class="w-8 h-8 text-error shrink-0" />
      <div class="min-w-0">
        <div class="text-sm opacity-70">{m['invoicing.widget.title']?.() ?? 'Outstanding invoices'}</div>
        <div class="text-2xl font-semibold truncate">
          {new Intl.NumberFormat().format(Math.round(outstanding))}
        </div>
        {#if overdueCount > 0}
          <div class="text-sm opacity-70">
            {m['invoicing.widget.overdueCount']?.({ count: overdueCount }) ??
              `${overdueCount} overdue`}
          </div>
        {/if}
      </div>
    </div>
  </a>
{/if}
