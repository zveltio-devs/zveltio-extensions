import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';

/**
 * Settle a draft or pending transaction: `completed`, paid on `paid_date`
 * (today in UTC when omitted). A business rule, not a field edit — so it is an
 * action (`POST /ext/crm/actions/markPaid`) and not a PATCH the form could send
 * with any status: settling one already completed, cancelled or refunded is
 * refused with 409, and one the caller cannot see answers 404.
 *
 * The status test is repeated as the update's precondition (`expect`), on the
 * row locked for the write: of two concurrent calls on one open transaction,
 * the second waits and is refused with 409 `precondition_failed`.
 *
 * The engine runs it as the caller, inside the request transaction, through
 * the data API (`host.collections`): the `transactions` collection permission,
 * column rules, revisions, flows and audit are the PATCH's own.
 */
const markPaid: ExtensionAction = async (input, host) => {
  const { id, paid_date } = input as { id: string; paid_date?: string };
  const tx = await host.collections.read('transactions', id);
  if (!tx) throw new ActionRefusal(404, 'transaction_not_found', 'No such transaction.');
  if (tx.status !== 'draft' && tx.status !== 'pending') {
    throw new ActionRefusal(
      409,
      'transaction_not_open',
      `A ${String(tx.status)} transaction cannot be marked paid.`,
    );
  }
  return host.collections.update(
    'transactions',
    id,
    { status: 'completed', paid_date: paid_date ?? new Date().toISOString().slice(0, 10) },
    { expect: { status: ['draft', 'pending'] } },
  );
};

export const crmActions = { markPaid };
