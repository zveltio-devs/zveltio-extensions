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
    path: 'api-connector',
    component: Page,
    label: 'API Connector',
    icon: 'Plug',
    category: 'integrations',
  });
}
register();
export default register;
