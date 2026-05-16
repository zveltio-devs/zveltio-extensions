import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'graphql',
    component: Page,
    label: 'GraphQL',
    icon: 'Network',
    category: 'developer',
  });
}
register();
export default register;
