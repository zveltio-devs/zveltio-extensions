import { registerRoute } from '@zveltio/sdk/studio';
import POSPage from './pages/POSPage.svelte';

function register(): void {

  registerRoute({
    path: 'pos',
    component: POSPage,
    label: 'POS',
    icon: 'ScanLine',
    category: 'operations',
  });
}

register();
export default register;
