import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';

// What the translations register does beyond the data API, as actions
// (`POST /ext/i18n/translations/actions/<name>`). Locales, keys, translations,
// the glossary and the instance's default locale are collections the engine
// serves; approving a translation is a decision, so it writes a row of its own
// collection and is gated on that collection (ADR 0015). The row copies the
// translation's last writer, so the row rule `translation_author neq user_id`
// keeps anyone from approving their own wording (ADR 0016).

type Host = Parameters<ExtensionAction>[1];

const T = 'i18n_translations';
const A = 'i18n_approvals';

/**
 * Approves the translation's value as it reads now. The row keeps that value,
 * so a later edit leaves the approval naming what was approved: a translation
 * is approved while its latest approval's value equals its own.
 */
async function approve(input: unknown, host: Host) {
  const { id } = input as { id: string };
  const t = await host.collections.read(T, id);
  if (!t) throw new ActionRefusal(404, 'translation_not_found', 'No such translation.');
  return host.collections.insert(A, {
    translation_id: id,
    value: t.value,
    translation_author: t.updated_by ?? t.created_by ?? null,
  });
}

export const translationsActions: Record<string, ExtensionAction> = { approve };
