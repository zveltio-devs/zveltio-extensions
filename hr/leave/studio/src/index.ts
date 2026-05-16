import { registerRoute } from '@zveltio/sdk/studio';
import LeavePage from './pages/LeavePage.svelte';

function register(): void {

  registerRoute({
    path: 'hr-leave',
    component: LeavePage,
    label: 'Leave Management',
    icon: 'CalendarDays',
    category: 'hr',
  });
}

register();
export default register;
