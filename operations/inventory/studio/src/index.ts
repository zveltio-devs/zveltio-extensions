import InventoryPage from './pages/InventoryPage.svelte';

declare global {
  interface Window {
    __zveltio?: { registerRoute: (route: any) => void; engineUrl: string };
  }
}

function register(): void {
  const z = window.__zveltio;
  if (!z) return;
  z.registerRoute({
    path: 'inventory',
    component: InventoryPage,
    label: 'Inventory',
    icon: 'Boxes',
    category: 'operations',
  });
}

register();
export default register;
