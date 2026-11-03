import { type ExtensionAction, todayIn } from '@zveltio/sdk/extension';

// Publishing a changelog entry stamps the day it went public, as 1.x did on
// `POST /changelogs/:id/publish`. Both fields are written only by these actions
// (`writtenBy`, ADR 0013), so a published entry always carries its date. Who may
// publish is the engine's rule on `apidoc_changelogs` (`execute`).

type Host = Parameters<ExtensionAction>[1];

const C = 'apidoc_changelogs';

async function publish(input: unknown, host: Host) {
  const { id } = input as { id: string };
  return host.collections.update(
    C,
    id,
    { is_published: true, published_at: todayIn(host.timezone) },
    { expect: { is_published: [false] } },
  );
}

/** Takes the entry off the public list; its date stays until it is published again. */
async function unpublish(input: unknown, host: Host) {
  const { id } = input as { id: string };
  return host.collections.update(C, id, { is_published: false }, { expect: { is_published: [true] } });
}

export const apiDocsActions: Record<string, ExtensionAction> = { publish, unpublish };
