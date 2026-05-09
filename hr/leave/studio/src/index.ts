import LeavePage from './pages/LeavePage.svelte';

declare global {
  interface Window {
    __zveltio?: { registerRoute: (route: any) => void; engineUrl: string };
  }
}

function register(): void {
  const z = window.__zveltio;
  if (!z) return;
  z.registerRoute({
    path: 'hr-leave',
    component: LeavePage,
    label: 'Leave Management',
    icon: 'CalendarDays',
    category: 'hr',
  });
}

register();
export default register;
