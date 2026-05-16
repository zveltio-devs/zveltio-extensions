import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'byod',
    component: Page,
    label: 'BYOD',
    icon: 'DatabaseZap',
    category: 'developer',
  });
}
register();
export default register;
