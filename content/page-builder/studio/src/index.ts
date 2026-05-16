import { registerRoute } from '@zveltio/sdk/studio';
import PagesListPage from './pages/PagesListPage.svelte';
import PageEditorPage from './pages/PageEditorPage.svelte';

export default function register() {

  registerRoute({
    path: 'pages',
    component: PagesListPage,
    label: 'Pages',
    icon: 'FileText',
    category: 'content',
    children: [
      {
        path: 'pages/:id/edit',
        component: PageEditorPage,
        label: 'Page Editor',
        icon: 'Edit',
        category: 'content',
      },
    ],
  });
}

register();
