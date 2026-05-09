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
    path: 'validation',
    component: Page,
    label: 'Validation Rules',
    icon: 'ShieldCheck',
    category: 'developer',
  });
}
register();
export default register;
