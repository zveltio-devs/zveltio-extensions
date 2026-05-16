import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'assets',
    component: Page,
    label: 'Fixed Assets',
    icon: 'Building',
    category: 'operations',
  });
}
register();
export default register;
