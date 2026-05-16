import { registerRoute } from '@zveltio/sdk/studio';
import EfacturaPage from './pages/EfacturaPage.svelte';

export default function register() {

  registerRoute({
    path: 'efactura',
    component: EfacturaPage,
    label: 'e-Factura RO',
    icon: 'Receipt',
    category: 'compliance',
  });
}

register();
