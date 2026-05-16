import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'helpdesk',
    component: Page,
    label: 'Helpdesk',
    icon: 'Headphones',
    category: 'projects',
  });
}
register();
export default register;
