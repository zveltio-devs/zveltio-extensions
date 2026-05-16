import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'accounting',
    component: Page,
    label: 'Accounting',
    icon: 'Calculator',
    category: 'finance',
  });
}
register();
export default register;
