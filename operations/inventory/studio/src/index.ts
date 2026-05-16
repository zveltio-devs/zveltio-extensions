import { registerRoute } from '@zveltio/sdk/studio';
import InventoryPage from './pages/InventoryPage.svelte';

function register(): void {

  registerRoute({
    path: 'inventory',
    component: InventoryPage,
    label: 'Inventory',
    icon: 'Boxes',
    category: 'operations',
  });
}

register();
export default register;
