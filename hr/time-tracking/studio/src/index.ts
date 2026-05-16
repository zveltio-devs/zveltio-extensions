import { registerRoute } from '@zveltio/sdk/studio';
import TimeTrackingPage from './pages/TimeTrackingPage.svelte';

function register(): void {

  registerRoute({
    path: 'hr-time-tracking',
    component: TimeTrackingPage,
    label: 'Time Tracking',
    icon: 'Clock',
    category: 'hr',
  });
}

register();
export default register;
