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
    path: 'assets',
    component: Page,
    label: 'Fixed Assets',
    icon: 'Building',
    category: 'operations',
  });
}
register();
export default register;
