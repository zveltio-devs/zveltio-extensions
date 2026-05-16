import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'drafts',
    component: Page,
    label: 'Drafts',
    icon: 'FileEdit',
    category: 'content',
  });
}
register();
export default register;
