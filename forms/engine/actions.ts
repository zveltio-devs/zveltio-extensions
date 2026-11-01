import { ActionRefusal, type ExtensionAction } from "@zveltio/sdk/extension";

// What forms does beyond plain edits, as actions (`POST /ext/forms/actions/<name>`).
// A form and its fields are plain edits through `/api/data`. A submission is
// written only by `submit` (`writtenBy: actions`), so it holds what the form
// asked for and nothing else, and is removed only by `deleteSubmission`. A
// public form is a page holding an API key the operator issues; what the key
// may read and run is the engine's rules on these collections.

type Row = Record<string, unknown>;
type Field = { id: string; label?: string; required?: boolean };

const empty = (v: unknown) => v === undefined || v === null || v === "";

/**
 * The answers to keep: only the form's own field ids, every required one
 * present. Refuses with the labels of the missing ones.
 */
export function answers(fields: unknown, data: Row): Row {
	// A form whose fields are not a list would keep no answer at all.
	if (!Array.isArray(fields))
		throw new ActionRefusal(409, "form_fields_invalid", "This form's fields are not a list; fix the form.");
	const list = fields as Field[];
	const missing = list
		.filter((f) => f.required && empty(data[f.id]))
		.map((f) => f.label ?? f.id);
	if (missing.length)
		throw new ActionRefusal(422, "missing_fields", `Missing required fields: ${missing.join(", ")}`);
	const ids = new Set(list.map((f) => f.id));
	return Object.fromEntries(Object.entries(data).filter(([k]) => ids.has(k)));
}

/** Records one submission of an active form, found by its slug. */
const submit: ExtensionAction = async (input, host) => {
	const d = input as { slug: string; data: Row };
	const res = await host.collections.list("forms", {
		filter: { slug: d.slug, active: true },
		limit: 1,
		count: "none",
	});
	const form = ((res.records as Row[]) ?? [])[0];
	if (!form) throw new ActionRefusal(404, "form_not_found", "No such form.");
	const fields = typeof form.fields === "string" ? JSON.parse(form.fields) : form.fields;
	const submission = await host.collections.insert("form_submissions", {
		form_id: form.id,
		data: answers(fields, d.data),
	});
	return { submission_id: submission.id };
};

/** Removes one submission (a correction or an erasure request). */
const deleteSubmission: ExtensionAction = async (input, host) => {
	const { id } = input as { id: string };
	if (!(await host.collections.read("form_submissions", id)))
		throw new ActionRefusal(404, "submission_not_found", "No such submission.");
	await host.collections.delete("form_submissions", id);
	return { deleted: id };
};

export const formsActions: Record<string, ExtensionAction> = {
	submit,
	deleteSubmission,
};
