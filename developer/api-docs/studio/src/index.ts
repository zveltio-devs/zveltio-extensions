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
    path: 'api-docs',
    component: Page,
    label: 'API Docs',
    icon: 'BookOpen',
    category: 'developer',
  });
}
register();
export default register;
