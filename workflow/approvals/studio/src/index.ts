import { registerRoute } from '@zveltio/sdk/studio';
import ApprovalsPage from './pages/ApprovalsPage.svelte';
import WorkflowsPage from './pages/WorkflowsPage.svelte';

export default function register() {

  registerRoute({
    path: 'approvals',
    component: ApprovalsPage,
    label: 'Approvals',
    icon: 'GitBranch',
    category: 'workflow',
    children: [
      {
        path: 'approvals/workflows',
        component: WorkflowsPage,
        label: 'Workflows',
        icon: 'Workflow',
        category: 'workflow',
      },
    ],
  });
}

register();
