import SmsPage from './pages/SmsPage.svelte';

export default function register() {
  const zveltio = (window as any).__zveltio;
  if (!zveltio) return;

  zveltio.registerRoute({
    path: 'sms',
    component: SmsPage,
    label: 'SMS',
    icon: 'MessageSquare',
    category: 'communications',
  });
}
