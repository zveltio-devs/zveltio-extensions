import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'api-docs',
    component: Page,
    label: 'API Docs',
    icon: 'BookOpen',
    category: 'developer',
  });
}
register();
export default register;
