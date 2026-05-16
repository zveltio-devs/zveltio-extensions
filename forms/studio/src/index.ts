import { registerRoute } from '@zveltio/sdk/studio';
import FormsPage from './pages/FormsPage.svelte';
import FormBuilderPage from './pages/FormBuilderPage.svelte';
import FormResponsesPage from './pages/FormResponsesPage.svelte';

export default function register() {

  registerRoute({
    path: 'forms',
    component: FormsPage,
    label: 'Forms',
    icon: 'ClipboardList',
    category: 'content',
    children: [
      {
        path: 'forms/:id/builder',
        component: FormBuilderPage,
        label: 'Form Builder',
        icon: 'Wand2',
        category: 'content',
      },
      {
        path: 'forms/:id/responses',
        component: FormResponsesPage,
        label: 'Responses',
        icon: 'BarChart2',
        category: 'content',
      },
    ],
  });
}

register();
