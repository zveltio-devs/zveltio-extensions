import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'banking',
    component: Page,
    label: 'Banking',
    icon: 'Landmark',
    category: 'finance',
  });
}
register();
export default register;
