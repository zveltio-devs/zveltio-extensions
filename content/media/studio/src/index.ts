import Page from './pages/Page.svelte';

declare global {
  interface Window {
    __zveltio?: { registerRoute: (route: any) => void; engineUrl: string };
  }
}

function register(): void {
  const z = window.__zveltio;
  if (!z) return;
  z.registerRoute({
    path: 'media-library',
    component: Page,
    label: 'Media Library',
    icon: 'Images',
    category: 'content',
  });
}
register();
export default register;
