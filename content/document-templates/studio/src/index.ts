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
    path: 'document-templates',
    component: Page,
    label: 'Document Templates',
    icon: 'FileType',
    category: 'content',
  });
}
register();
export default register;
