import { registerRoute } from '@zveltio/sdk/studio';
import SmsPage from './pages/SmsPage.svelte';

export default function register() {

  registerRoute({
    path: 'sms',
    component: SmsPage,
    label: 'SMS',
    icon: 'MessageSquare',
    category: 'communications',
  });
}

register();
