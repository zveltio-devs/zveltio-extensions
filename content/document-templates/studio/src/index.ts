import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'document-templates',
    component: Page,
    label: 'Document Templates',
    icon: 'FileType',
    category: 'content',
  });
}
register();
export default register;
