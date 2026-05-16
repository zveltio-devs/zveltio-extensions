import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'expenses',
    component: Page,
    label: 'Expenses',
    icon: 'Receipt',
    category: 'finance',
  });
}
register();
export default register;
