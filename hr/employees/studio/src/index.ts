import EmployeesPage from './pages/EmployeesPage.svelte';

declare global {
  interface Window {
    __zveltio?: { registerRoute: (route: any) => void; engineUrl: string };
  }
}

function register(): void {
  const z = window.__zveltio;
  if (!z) return;
  z.registerRoute({
    path: 'hr-employees',
    component: EmployeesPage,
    label: 'Employees',
    icon: 'Users',
    category: 'hr',
  });
}

register();
export default register;
