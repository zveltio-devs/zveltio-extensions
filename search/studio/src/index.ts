import { registerRoute } from '@zveltio/sdk/studio';
import SearchPage from './pages/SearchPage.svelte';

export default function register() {

  registerRoute({
    path: 'search',
    component: SearchPage,
    label: 'Search',
    icon: 'Search',
    category: 'developer',
  });
}

register();
