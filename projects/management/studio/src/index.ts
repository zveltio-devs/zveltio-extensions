import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'projects',
    component: Page,
    label: 'Projects',
    icon: 'FolderKanban',
    category: 'projects',
  });
}
register();
export default register;
