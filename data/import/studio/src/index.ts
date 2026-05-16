import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'import',
    component: Page,
    label: 'Data Import',
    icon: 'Upload',
    category: 'data',
  });
}
register();
export default register;
