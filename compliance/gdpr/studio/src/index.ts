import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'gdpr',
    component: Page,
    label: 'GDPR',
    icon: 'Shield',
    category: 'compliance',
  });
}
register();
export default register;
