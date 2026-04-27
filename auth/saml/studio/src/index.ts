import SamlConfigPage from './SamlConfigPage.svelte';

export default function register() {
  const zveltio = (window as any).__zveltio;
  if (!zveltio) return;

  zveltio.registerRoute({
    path: 'auth/saml',
    component: SamlConfigPage,
    label: 'SAML SSO',
    icon: 'Shield',
    category: 'auth',
  });
}
