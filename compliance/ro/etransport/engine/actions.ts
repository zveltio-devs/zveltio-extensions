import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';

// Each action moves one declaration along its life: draft → declared (a UIT
// obtained in SPV, recorded by hand) → completed, or cancelled before it is
// completed. The engine runs them as the caller, inside the request
// transaction, through the data API (`host.collections`): the collection's
// permissions, column rules, revisions, flows and audit are a PATCH's own.
// The `status` transition rule in the collection file holds the same order for
// a PATCH. The status test is repeated as the update's precondition (`expect`)
// on the row locked for the write, so of two concurrent calls the second is
// refused with 409 `precondition_failed`.

const C = 'etransport_declarations';

async function load(host: Parameters<ExtensionAction>[1], id: string) {
  const row = await host.collections.read(C, id);
  if (!row) throw new ActionRefusal(404, 'declaration_not_found', 'No such declaration.');
  return row;
}

/**
 * Record a UIT obtained in SPV. This extension does not talk to ANAF: it has
 * no e-Transport XML generator and no SPV client, so it never issues a UIT.
 * A UIT travels with the goods and is checked at the roadside, and a code that
 * did not come from ANAF is not a UIT. The format is checked for shape only;
 * only ANAF can say whether a code is real.
 */
const recordUit: ExtensionAction = async (input, host) => {
  const { id, uit, note } = input as { id: string; uit: string; note?: string };
  const row = await load(host, id);
  if (row.status !== 'draft') {
    throw new ActionRefusal(409, 'declaration_not_draft', `A ${String(row.status)} declaration already has its UIT or is closed.`);
  }
  return host.collections.update(
    C,
    id,
    {
      uit: uit.trim(),
      status: 'declared',
      anaf_response: { source: 'manual', recorded_at: new Date().toISOString(), note: note ?? null },
    },
    { expect: { status: ['draft'] } },
  );
};

const complete: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const row = await load(host, id);
  if (row.status !== 'declared' && row.status !== 'in_transit') {
    throw new ActionRefusal(409, 'declaration_not_open', `A ${String(row.status)} declaration cannot be completed.`);
  }
  return host.collections.update(C, id, { status: 'completed' }, { expect: { status: ['declared', 'in_transit'] } });
};

const cancel: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const row = await load(host, id);
  if (row.status === 'completed' || row.status === 'cancelled') {
    throw new ActionRefusal(409, 'declaration_closed', `A ${String(row.status)} declaration cannot be cancelled.`);
  }
  return host.collections.update(
    C,
    id,
    { status: 'cancelled' },
    { expect: { status: ['draft', 'declared', 'in_transit'] } },
  );
};

export const etransportActions = { recordUit, complete, cancel };
