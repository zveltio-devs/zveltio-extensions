import EcommercePage from './pages/EcommercePage.svelte';

declare global {
  interface Window {
    __zveltio?: { registerRoute: (route: any) => void; engineUrl: string };
  }
}

function register(): void {
  const z = window.__zveltio;
  if (!z) return;
  z.registerRoute({
    path: 'ecommerce',
    component: EcommercePage,
    label: 'eCommerce',
    icon: 'ShoppingCart',
    category: 'ecommerce',
  });
}

register();
export default register;
