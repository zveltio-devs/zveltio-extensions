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
    path: 'export',
    component: Page,
    label: 'Data Export',
    icon: 'Download',
    category: 'data',
  });
}
register();
export default register;
