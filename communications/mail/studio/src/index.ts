import MailPage from './pages/MailPage.svelte';
import MailSettingsPage from './pages/MailSettingsPage.svelte';

export default function register() {
  const zveltio = (window as any).__zveltio;
  if (!zveltio) return;

  zveltio.registerRoute({
    path: 'mail',
    component: MailPage,
    label: 'Mail',
    icon: 'Mail',
    category: 'communications',
    children: [
      {
        path: 'mail/settings',
        component: MailSettingsPage,
        label: 'Mail Settings',
        icon: 'Settings',
        category: 'communications',
      },
    ],
  });
}

register();
