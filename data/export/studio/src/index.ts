import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'export',
    component: Page,
    label: 'Data Export',
    icon: 'Download',
    category: 'data',
  });
}
register();
export default register;
