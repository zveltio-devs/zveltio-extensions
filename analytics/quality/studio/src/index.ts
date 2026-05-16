import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'data-quality',
    component: Page,
    label: 'Data Quality',
    icon: 'ScanSearch',
    category: 'analytics',
  });
}
register();
export default register;
