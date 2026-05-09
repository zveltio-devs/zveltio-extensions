import LdapConfigPage from './LdapConfigPage.svelte';

export default function register() {
  const zveltio = (window as any).__zveltio;
  if (!zveltio) return;

  zveltio.registerRoute({
    path: 'auth/ldap',
    component: LdapConfigPage,
    label: 'LDAP / AD',
    icon: 'Server',
    category: 'auth',
  });
}

register();
