import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'subscriptions',
    component: Page,
    label: 'Subscriptions',
    icon: 'Repeat',
    category: 'finance',
  });
}
register();
export default register;
