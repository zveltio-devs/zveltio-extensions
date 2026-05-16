import { registerRoute } from '@zveltio/sdk/studio';
import GeospatialPage from './pages/GeospatialPage.svelte';

export default function register() {

  registerRoute({
    path: 'geo',
    component: GeospatialPage,
    label: 'Geospatial',
    icon: 'MapPin',
    category: 'geospatial',
  });
}

register();
