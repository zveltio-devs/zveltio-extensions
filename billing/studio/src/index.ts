import { registerRoute } from '@zveltio/sdk/studio';
import BillingPage from './pages/BillingPage.svelte';
import UsagePage from './pages/UsagePage.svelte';

export default function register() {

  registerRoute({
    path: 'billing',
    component: BillingPage,
    label: 'Billing',
    icon: 'CreditCard',
    category: 'operations',
    children: [
      {
        path: 'billing/usage',
        component: UsagePage,
        label: 'Usage',
        icon: 'BarChart2',
        category: 'operations',
      },
    ],
  });
}

register();
