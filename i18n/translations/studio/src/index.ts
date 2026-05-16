import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'translations',
    component: Page,
    label: 'Translations',
    icon: 'Languages',
    category: 'i18n',
  });
}
register();
export default register;
