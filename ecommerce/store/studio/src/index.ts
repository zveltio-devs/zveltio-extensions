import { registerRoute } from '@zveltio/sdk/studio';
import EcommercePage from './pages/EcommercePage.svelte';

function register(): void {

  registerRoute({
    path: 'ecommerce',
    component: EcommercePage,
    label: 'eCommerce',
    icon: 'ShoppingCart',
    category: 'ecommerce',
  });
}

register();
export default register;
