// IIFE entry — Studio loads this bundle via <script src="/ext/ai/bundle.js">.
// At load time, it registers the AI pages with Studio's extension registry
// exposed at window.__zveltio.

import { registerRoute } from '@zveltio/sdk/studio';
import AIHubPage from './pages/AIHubPage.svelte';
import AISchemaPage from './pages/AISchemaPage.svelte';

function register(): void {

  registerRoute({
    path: 'ai',
    component: AIHubPage,
    label: 'AI Hub',
    icon: 'Bot',
    category: 'intelligence',
    children: [
      {
        path: 'ai/schema',
        component: AISchemaPage,
        label: 'AI Schema Generation',
        icon: 'Wand2',
        category: 'intelligence',
      },
    ],
  });
}

// Run immediately at script load.
register();

// IIFE bundles also export a default register() so bootloaders can call it
// explicitly if they delay extension initialisation.
export default register;
