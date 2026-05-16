import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'cloud',
    component: Page,
    label: 'Cloud Storage',
    icon: 'Cloud',
    category: 'storage',
  });
}
register();
export default register;
