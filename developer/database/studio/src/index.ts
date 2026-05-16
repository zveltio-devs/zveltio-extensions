import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'database',
    component: Page,
    label: 'Database',
    icon: 'Database',
    category: 'developer',
  });
}
register();
export default register;
