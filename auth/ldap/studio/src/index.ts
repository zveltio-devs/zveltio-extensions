import { registerRoute } from '@zveltio/sdk/studio';
import LdapConfigPage from './LdapConfigPage.svelte';

export default function register() {

  registerRoute({
    path: 'auth/ldap',
    component: LdapConfigPage,
    label: 'LDAP / AD',
    icon: 'Server',
    category: 'auth',
  });
}

register();
