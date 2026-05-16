import { registerRoute } from '@zveltio/sdk/studio';
import ETransportPage from './pages/ETransportPage.svelte';

export default function register() {

  registerRoute({
    path: 'etransport',
    component: ETransportPage,
    label: 'e-Transport RO',
    icon: 'Truck',
    category: 'compliance',
  });
}

register();
