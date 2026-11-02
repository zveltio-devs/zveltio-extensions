import { ActionRefusal, type ExtensionAction, todayIn } from '@zveltio/sdk/extension';

// What the GDPR register does beyond the data API, as actions
// (`POST /ext/compliance/gdpr/actions/<name>`). Processing activities (Art. 30)
// and breaches (Art. 33) are plain collections the engine serves. A consent and
// a data-subject request are written only here: the record of a consent is
// evidence, so it is never edited, only withdrawn; a request gets its statutory
// due date when submitted, and every status change is a decision, a row of its
// own collection gated on that collection (ADR 0015). Who gave, submitted or
// decided is the engine's `created_by`.

type Row = Record<string, unknown>;
type Host = Parameters<ExtensionAction>[1];

const CONSENTS = 'gdpr_consent_records';
const REQUESTS = 'gdpr_subject_requests';
const DECISIONS = 'gdpr_request_decisions';

/** Art. 12(3): one month from receipt; 30 days, as 1.x set it. */
const RESPONSE_DAYS = 30;

/** The statuses a request may move to from each status; the last three end it. */
const NEXT: Record<string, readonly string[]> = {
  pending: ['in_progress', 'completed', 'rejected', 'withdrawn'],
  in_progress: ['completed', 'rejected', 'withdrawn'],
  completed: [],
  rejected: [],
  withdrawn: [],
};

const busy = (err: unknown) => (err as { code?: unknown }).code === 'precondition_failed';

async function load(host: Host, collection: string, id: string, what: string): Promise<Row> {
  const row = await host.collections.read(collection, id);
  if (!row) throw new ActionRefusal(404, `${what}_not_found`, `No such ${what.replace('_', ' ')}.`);
  return row;
}

/**
 * Change a record only if `field` still holds `from`, checked on the row locked
 * for the write. A concurrent change of the same field is refused, not overwritten.
 */
async function move(host: Host, collection: string, id: string, field: string, from: unknown, data: Row) {
  try {
    return await host.collections.update(collection, id, data, {
      expect: { [field]: [from == null ? null : String(from)] },
    });
  } catch (err) {
    if (busy(err)) {
      throw new ActionRefusal(409, 'record_busy', 'The record was changed by another request; reload and try again.');
    }
    throw err;
  }
}

const giveConsent: ExtensionAction = async (input, host) => {
  const d = input as {
    purpose: string;
    granted: boolean;
    processing_activity_id?: string;
    source?: string;
    expires_at?: string;
  };
  return host.collections.insert(CONSENTS, {
    purpose: d.purpose,
    granted: d.granted,
    processing_activity_id: d.processing_activity_id ?? null,
    source: d.source ?? 'web',
    expires_at: d.expires_at ?? null,
  });
};

/** A consent is withdrawn once; the record keeps what was given and when. */
const withdrawConsent: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const consent = await load(host, CONSENTS, id, 'consent');
  if (consent.withdrawn_at != null) {
    throw new ActionRefusal(409, 'already_withdrawn', 'This consent is already withdrawn.');
  }
  return move(host, CONSENTS, id, 'withdrawn_at', null, {
    granted: false,
    withdrawn_at: new Date().toISOString(),
  });
};

const submitRequest: ExtensionAction = async (input, host) => {
  const d = input as { request_type: string; description?: string };
  const due = new Date(`${todayIn(host.timezone)}T00:00:00Z`);
  due.setUTCDate(due.getUTCDate() + RESPONSE_DAYS);
  return host.collections.insert(REQUESTS, {
    request_type: d.request_type,
    description: d.description ?? null,
    status: 'pending',
    due_date: due.toISOString().slice(0, 10),
  });
};

/** A request's status changes, and the decision is recorded as a row of its own. */
const setRequestStatus: ExtensionAction = async (input, host) => {
  const d = input as { id: string; status: string; notes?: string };
  const request = await load(host, REQUESTS, d.id, 'request');
  const from = String(request.status);
  if (!NEXT[from]?.includes(d.status)) {
    throw new ActionRefusal(409, 'invalid_transition', `A ${from} request cannot become ${d.status}.`);
  }
  const updated = await move(host, REQUESTS, d.id, 'status', from, {
    status: d.status,
    completed_at: d.status === 'completed' ? new Date().toISOString() : null,
  });
  await host.collections.insert(DECISIONS, {
    request_id: d.id,
    from_status: from,
    to_status: d.status,
    notes: d.notes ?? null,
  });
  return updated;
};

export const gdprActions: Record<string, ExtensionAction> = {
  giveConsent,
  withdrawConsent,
  submitRequest,
  setRequestStatus,
};
