import { registerRoute } from '@zveltio/sdk/studio';
import SAFTPage from './pages/SAFTPage.svelte';

export default function register() {

  registerRoute({
    path: 'saft',
    component: SAFTPage,
    label: 'SAF-T RO',
    icon: 'FileSpreadsheet',
    category: 'compliance',
  });
}

register();
