import { registerRoute } from '@zveltio/sdk/studio';
import ChecklistsPage from './pages/ChecklistsPage.svelte';
import TemplatesPage from './pages/TemplatesPage.svelte';

export default function register() {

  registerRoute({
    path: 'checklists',
    component: ChecklistsPage,
    label: 'Checklists',
    icon: 'CheckSquare',
    category: 'workflow',
    children: [
      {
        path: 'checklists/templates',
        component: TemplatesPage,
        label: 'Templates',
        icon: 'LayoutTemplate',
        category: 'workflow',
      },
    ],
  });
}

register();
