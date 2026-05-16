import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'quotes',
    component: Page,
    label: 'Quotes',
    icon: 'FileSignature',
    category: 'finance',
  });
}
register();
export default register;
