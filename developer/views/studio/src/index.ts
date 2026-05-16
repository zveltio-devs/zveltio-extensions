import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'views',
    component: Page,
    label: 'Custom Views',
    icon: 'LayoutGrid',
    category: 'developer',
  });
}
register();
export default register;
