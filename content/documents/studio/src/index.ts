import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'documents',
    component: Page,
    label: 'Documents',
    icon: 'FileText',
    category: 'content',
  });
}
register();
export default register;
