import CRMPage from './pages/CRMPage.svelte';

export default function register() {
  const zveltio = (window as any).__zveltio;
  if (!zveltio) return;

  zveltio.registerRoute({
    path: 'crm',
    component: CRMPage,
    label: 'CRM',
    icon: 'Users2',
    category: 'crm',
  });
}

register();
