import { registerRoute } from '@zveltio/sdk/studio';
import EmployeesPage from './pages/EmployeesPage.svelte';

function register(): void {

  registerRoute({
    path: 'hr-employees',
    component: EmployeesPage,
    label: 'Employees',
    icon: 'Users',
    category: 'hr',
  });
}

register();
export default register;
