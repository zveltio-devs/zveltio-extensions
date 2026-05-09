import PayrollPage from './pages/PayrollPage.svelte';

declare global {
  interface Window {
    __zveltio?: { registerRoute: (route: any) => void; engineUrl: string };
  }
}

function register(): void {
  const z = window.__zveltio;
  if (!z) return;
  z.registerRoute({
    path: 'hr-payroll',
    component: PayrollPage,
    label: 'Payroll',
    icon: 'Wallet',
    category: 'hr',
  });
}

register();
export default register;
