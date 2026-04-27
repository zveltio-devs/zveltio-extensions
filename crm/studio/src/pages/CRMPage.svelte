<script lang="ts">
  import ContactsPage from '../../pages/contacts/+page.svelte';
  import OrganizationsPage from '../../pages/organizations/+page.svelte';
  import TransactionsPage from '../../pages/transactions/+page.svelte';
  import { Users2, Building2, TrendingUp } from '@lucide/svelte';

  let tab = $state<'contacts' | 'organizations' | 'transactions'>('contacts');
</script>

<div class="flex flex-col h-full">
  <div class="flex border-b border-base-content/10 px-6">
    <button
      onclick={() => (tab = 'contacts')}
      class="flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors {tab === 'contacts' ? 'border-primary text-primary' : 'border-transparent text-base-content/60 hover:text-base-content'}"
    >
      <Users2 class="h-4 w-4" /> Contacts
    </button>
    <button
      onclick={() => (tab = 'organizations')}
      class="flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors {tab === 'organizations' ? 'border-primary text-primary' : 'border-transparent text-base-content/60 hover:text-base-content'}"
    >
      <Building2 class="h-4 w-4" /> Organizations
    </button>
    <button
      onclick={() => (tab = 'transactions')}
      class="flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors {tab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-base-content/60 hover:text-base-content'}"
    >
      <TrendingUp class="h-4 w-4" /> Transactions
    </button>
  </div>

  <div class="flex-1 overflow-auto">
    {#if tab === 'contacts'}
      <ContactsPage />
    {:else if tab === 'organizations'}
      <OrganizationsPage />
    {:else}
      <TransactionsPage />
    {/if}
  </div>
</div>
