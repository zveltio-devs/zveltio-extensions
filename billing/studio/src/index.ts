import BillingPage from './pages/BillingPage.svelte';
import UsagePage from './pages/UsagePage.svelte';

export default function register() {
  const zveltio = (window as any).__zveltio;
  if (!zveltio) return;

  zveltio.registerRoute({
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
