import POSPage from './pages/POSPage.svelte';

declare global {
  interface Window {
    __zveltio?: { registerRoute: (route: any) => void; engineUrl: string };
  }
}

function register(): void {
  const z = window.__zveltio;
  if (!z) return;
  z.registerRoute({
    path: 'pos',
    component: POSPage,
    label: 'POS',
    icon: 'ScanLine',
    category: 'operations',
  });
}

register();
export default register;
