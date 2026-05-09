import SearchPage from './pages/SearchPage.svelte';

export default function register() {
  const zveltio = (window as any).__zveltio;
  if (!zveltio) return;

  zveltio.registerRoute({
    path: 'search',
    component: SearchPage,
    label: 'Search',
    icon: 'Search',
    category: 'developer',
  });
}

register();
