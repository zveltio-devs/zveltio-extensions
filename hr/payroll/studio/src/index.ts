import { registerRoute } from '@zveltio/sdk/studio';
import PayrollPage from './pages/PayrollPage.svelte';

function register(): void {

  registerRoute({
    path: 'hr-payroll',
    component: PayrollPage,
    label: 'Payroll',
    icon: 'Wallet',
    category: 'hr',
  });
}

register();
export default register;
