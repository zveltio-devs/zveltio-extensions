import { registerRoute } from '@zveltio/sdk/studio';
import ProcurementPage from './pages/ProcurementPage.svelte';

export default function register() {

  registerRoute({
    path: 'ro-procurement',
    component: ProcurementPage,
    label: 'Achizitii RO',
    icon: 'ShoppingCart',
    category: 'compliance',
  });
}

register();
