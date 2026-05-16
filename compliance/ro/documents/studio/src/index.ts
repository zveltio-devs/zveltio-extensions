import { registerRoute } from '@zveltio/sdk/studio';
import DocumentsPage from './pages/DocumentsPage.svelte';

export default function register() {

  registerRoute({
    path: 'ro-documents',
    component: DocumentsPage,
    label: 'Documente RO',
    icon: 'FolderOpen',
    category: 'compliance',
  });
}

register();
