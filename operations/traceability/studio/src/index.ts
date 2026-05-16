import { registerRoute } from '@zveltio/sdk/studio';
import LotList from './pages/LotList.svelte';
import Dispatches from './pages/Dispatches.svelte';
import LotDetail from './pages/LotDetail.svelte';
import NewReception from './pages/NewReception.svelte';
import ProductionOrder from './pages/ProductionOrder.svelte';
import RecallSimulator from './pages/RecallSimulator.svelte';
import Reports from './pages/Reports.svelte';

export default function register() {

  registerRoute({
    path: 'trace/lots',
    component: LotList,
    label: 'Loturi',
    icon: 'Package',
    category: 'traceability',
    parent: 'Trasabilitate',
  });

  registerRoute({
    path: 'trace/lots/:id',
    component: LotDetail,
    hidden: true,
  });

  registerRoute({
    path: 'trace/reception',
    component: NewReception,
    label: 'Recepție',
    icon: 'PackagePlus',
    category: 'traceability',
    parent: 'Trasabilitate',
  });

  registerRoute({
    path: 'trace/production',
    component: ProductionOrder,
    label: 'Producție',
    icon: 'Factory',
    category: 'traceability',
    parent: 'Trasabilitate',
  });

  registerRoute({
    path: 'trace/recalls',
    component: RecallSimulator,
    label: 'Recall / Retragere',
    icon: 'AlertTriangle',
    category: 'traceability',
    parent: 'Trasabilitate',
  });

  registerRoute({
    path: 'trace/dispatches',
    component: Dispatches,
    label: 'Expedieri',
    icon: 'Truck',
    category: 'traceability',
    parent: 'Trasabilitate',
  });

  registerRoute({
    path: 'trace/reports',
    component: Reports,
    label: 'Rapoarte ANSVSA',
    icon: 'FileText',
    category: 'traceability',
    parent: 'Trasabilitate',
  });
}

register();
