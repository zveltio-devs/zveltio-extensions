import InvoicesPage from './pages/InvoicesPage.svelte';

declare global {
  interface Window {
    __zveltio?: { registerRoute: (route: any) => void; engineUrl: string };
  }
}

function register(): void {
  const z = window.__zveltio;
  if (!z) return;
  z.registerRoute({
    path: 'invoicing',
    component: InvoicesPage,
    label: 'Invoicing',
    icon: 'FileText',
    category: 'finance',
  });
}

register();
export default register;
