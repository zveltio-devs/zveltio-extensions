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
    path: 'translations',
    component: Page,
    label: 'Translations',
    icon: 'Languages',
    category: 'i18n',
  });
}
register();
export default register;
