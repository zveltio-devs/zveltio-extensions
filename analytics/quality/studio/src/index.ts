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
    path: 'data-quality',
    component: Page,
    label: 'Data Quality',
    icon: 'ScanSearch',
    category: 'analytics',
  });
}
register();
export default register;
