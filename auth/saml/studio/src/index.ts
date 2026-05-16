import { registerRoute } from '@zveltio/sdk/studio';
import SamlConfigPage from './SamlConfigPage.svelte';

export default function register() {

  registerRoute({
    path: 'auth/saml',
    component: SamlConfigPage,
    label: 'SAML SSO',
    icon: 'Shield',
    category: 'auth',
  });
}

register();
