import { registerRoute } from '@zveltio/sdk/studio';
import EdgeFunctionsPage from './pages/EdgeFunctionsPage.svelte';

export default function register() {

  registerRoute({
    path: 'edge-functions',
    component: EdgeFunctionsPage,
    label: 'Edge Functions',
    icon: 'Zap',
    category: 'developer',
  });
}

register();
