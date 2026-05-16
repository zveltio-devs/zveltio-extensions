import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'api-connector',
    component: Page,
    label: 'API Connector',
    icon: 'Plug',
    category: 'integrations',
  });
}
register();
export default register;
