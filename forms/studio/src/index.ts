import FormsPage from './pages/FormsPage.svelte';
import FormBuilderPage from './pages/FormBuilderPage.svelte';
import FormResponsesPage from './pages/FormResponsesPage.svelte';

export default function register() {
  const zveltio = (window as any).__zveltio;
  if (!zveltio) return;

  zveltio.registerRoute({
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
