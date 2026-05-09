import TimeTrackingPage from './pages/TimeTrackingPage.svelte';

declare global {
  interface Window {
    __zveltio?: { registerRoute: (route: any) => void; engineUrl: string };
  }
}

function register(): void {
  const z = window.__zveltio;
  if (!z) return;
  z.registerRoute({
    path: 'hr-time-tracking',
    component: TimeTrackingPage,
    label: 'Time Tracking',
    icon: 'Clock',
    category: 'hr',
  });
}

register();
export default register;
