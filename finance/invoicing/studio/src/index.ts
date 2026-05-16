import { registerRoute } from '@zveltio/sdk/studio';
import InvoicesPage from './pages/InvoicesPage.svelte';

function register(): void {

  registerRoute({
    path: 'invoicing',
    component: InvoicesPage,
    label: 'Invoicing',
    icon: 'FileText',
    category: 'finance',
  });
}

register();
export default register;
