import { ActionRefusal, type ExtensionAction, todayIn } from '@zveltio/sdk/extension';

// What the document register does beyond reads, as actions
// (`POST /ext/compliance/ro/documents/actions/<name>`). The engine runs each as
// the caller, inside the request transaction, through the data API
// (`host.collections`): a throw rolls back everything the action wrote, so a
// refused document gives back the register number it claimed. Documents, their
// versions, the series and the signatures are written only here
// (`writtenBy: "actions"`): a draft is edited, a signed document is frozen.
// Who may do what is the engine's rules on these collections, not this file's:
// signing writes a row of `ro_document_signatures` and is gated on that
// collection (ADR 0015), and the row names the document's author, so the row
// rule `document_author neq user_id` keeps anyone from signing their own (ADR 0016).

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const D = 'ro_documents';
const V = 'ro_document_versions';
const SERIES = 'ro_document_series';
const TRIES = 5;

const PREFIX: Record<string, string> = {
  contract: 'CTR',
  pv: 'PV',
  nir: 'NIR',
  dispozitie_plata: 'DP',
  proces_verbal: 'PVG',
  notificare: 'NOT',
  other: 'DOC',
};

async function load(host: Host, id: string) {
  const row = await host.collections.read(D, id);
  if (!row) throw new ActionRefusal(404, 'document_not_found', 'No such document.');
  return row;
}

async function first(host: Host, collection: string, filter: Row): Promise<Row | null> {
  const res = await host.collections.list(collection, { filter, limit: 1, count: 'none' });
  return ((res.records as Row[]) ?? [])[0] ?? null;
}

/**
 * The next `CTR-2026-0001` of a type, claimed from this year's series only if
 * nobody claimed it since it was read (`expect`): no two documents share a
 * number, and the count restarts each year. Two first documents of a year meet
 * on the series' unique key; the loser's request transaction is aborted by
 * then, so it is refused and its retry finds the row.
 */
const busy = () => new ActionRefusal(409, 'series_busy', 'The series is being used by other requests; try again.');

async function nextNumber(host: Host, type: string): Promise<string> {
  const year = Number(todayIn(host.timezone).slice(0, 4));
  for (let attempt = 0; attempt < TRIES; attempt++) {
    const s =
      (await first(host, SERIES, { type, year })) ??
      (await host.collections.insert(SERIES, { type, year }).catch((err) => {
        if ((err as { code?: unknown }).code === '23505') throw busy();
        throw err;
      }));
    const n = Number(s.next_number);
    try {
      await host.collections.update(SERIES, String(s.id), { next_number: n + 1 }, { expect: { next_number: [String(s.next_number)] } });
    } catch (err) {
      if ((err as { code?: unknown }).code === 'precondition_failed') continue;
      throw err;
    }
    return `${PREFIX[type]}-${year}-${String(n).padStart(4, '0')}`;
  }
  throw busy();
}

/**
 * A draft held for the rest of the request: written only while it is still a
 * draft (`expect`), which locks the row, so a concurrent signature waits for
 * this change or this change waits for it and is refused.
 */
async function holdDraft(host: Host, id: string, change: Row = {}) {
  const doc = await load(host, id);
  if (doc.status !== 'draft') throw new ActionRefusal(409, 'document_not_draft', 'Only a draft is edited; a signed document is frozen.');
  return host.collections.update(D, id, { ...change, status: 'draft' }, { expect: { status: ['draft'] } });
}

/**
 * The text as it stands kept as a version, then replaced. The draft is held
 * first, so two edits at once take turns and each keeps the text it replaced.
 */
async function snapshot(host: Host, id: string, change_note: string | null, change: Row) {
  const doc = await holdDraft(host, id);
  const version = Number(doc.version_number);
  await host.collections.insert(V, { document_id: id, version, content: doc.content ?? null, change_note });
  return host.collections.update(D, id, { ...change, version_number: version + 1 });
}

/** A draft in the register, numbered from its type's series unless it brings a number. */
const create: ExtensionAction = async (input, host) => {
  const d = input as Row & { type: string; number?: string };
  // A number of the series' own shape is the series' to give, or a later one would meet it.
  if (d.number?.startsWith(`${PREFIX[d.type]}-`)) {
    throw new ActionRefusal(422, 'number_reserved', `Numbers starting ${PREFIX[d.type]}- are given by the register; leave the number blank.`);
  }
  return host.collections.insert(D, { ...d, number: d.number || (await nextNumber(host, d.type)) });
};

/** A draft's text or details changed; the text before the change is kept as a version. */
const edit: ExtensionAction = async (input, host) => {
  const { id, change_note, ...change } = input as Row & { id: string; change_note?: string };
  return snapshot(host, id, change_note ?? null, change);
};

/** A draft's text put back to an earlier version; the text it replaces is kept first. */
const restore: ExtensionAction = async (input, host) => {
  const { id, version } = input as { id: string; version: number };
  await load(host, id);
  const old = await first(host, V, { document_id: id, version });
  if (!old) throw new ActionRefusal(404, 'version_not_found', 'No such version of this document.');
  return snapshot(host, id, `Before restoring version ${version}`, { content: old.content ?? null });
};

/**
 * A draft signed: the signature is a row of its own, naming the document's
 * author and the version signed, read after the draft is locked.
 */
const sign: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const doc = await load(host, id);
  if (doc.status !== 'draft') throw new ActionRefusal(409, 'document_not_draft', `A ${doc.status} document is not signed again.`);
  const signed = await host.collections.update(D, id, { status: 'signed', signed_at: new Date().toISOString() }, { expect: { status: ['draft'] } });
  await host.collections.insert('ro_document_signatures', {
    document_id: id,
    document_author: signed.created_by ?? null,
    signed_version: signed.version_number,
  });
  return signed;
};

/** A document filed away; an archived one stays as it is. */
const archive: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const doc = await load(host, id);
  if (doc.status === 'archived') throw new ActionRefusal(409, 'document_archived', 'The document is already archived.');
  return host.collections.update(D, id, { status: 'archived', archived_at: new Date().toISOString() }, { expect: { status: [String(doc.status)] } });
};

/** A draft removed, its versions with it; its number is not given out again. */
const remove: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  await holdDraft(host, id);
  await host.collections.delete(D, id);
  return { id };
};

export const documentsActions = { create, edit, restore, sign, archive, remove };
