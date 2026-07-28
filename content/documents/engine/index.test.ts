// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { extensionContract } from '../../../testing/ext-harness';

// content/documents' GET /templates reads zv_document_templates, which is owned
// + fully shaped (category, pdf_options, …) by the content/document-templates
// extension. The engine core also declares a *narrower* zv_document_templates,
// so with only core + this extension's migrations the table lacks those columns
// and the route 500s. Apply the owner's migrations first, mirroring a real
// install (see the manifest `dependencies`).
await extensionContract(import.meta.dir, { dependsOn: ['content/document-templates'] });
