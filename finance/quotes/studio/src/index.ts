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
    path: 'quotes',
    component: Page,
    label: 'Quotes',
    icon: 'FileSignature',
    category: 'finance',
  });
}
register();
export default register;
