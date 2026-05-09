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
    path: 'cloud',
    component: Page,
    label: 'Cloud Storage',
    icon: 'Cloud',
    category: 'storage',
  });
}
register();
export default register;
