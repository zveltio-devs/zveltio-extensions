import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'validation',
    component: Page,
    label: 'Validation Rules',
    icon: 'ShieldCheck',
    category: 'developer',
  });
}
register();
export default register;
