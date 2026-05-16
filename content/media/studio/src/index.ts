import { registerRoute } from '@zveltio/sdk/studio';
import Page from './pages/Page.svelte';

function register(): void {

  registerRoute({
    path: 'media-library',
    component: Page,
    label: 'Media Library',
    icon: 'Images',
    category: 'content',
  });
}
register();
export default register;
