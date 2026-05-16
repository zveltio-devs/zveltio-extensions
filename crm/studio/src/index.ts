import { registerRoute } from '@zveltio/sdk/studio';
import CRMPage from './pages/CRMPage.svelte';

export default function register() {

  registerRoute({
    path: 'crm',
    component: CRMPage,
    label: 'CRM',
    icon: 'Users2',
    category: 'crm',
  });
}

register();
