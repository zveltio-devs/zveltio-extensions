// The forms actions over an in-memory data API. The engine's own data API and
// its checks are tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from "bun:test";
import { ActionRefusal } from "@zveltio/sdk/extension";
import { answers, formsActions as a } from "./actions";

type Row = Record<string, unknown>;

function fakeHost(forms: Row[]) {
	const subs: Row[] = [];
	const host = {
		timezone: "UTC",
		enqueue: async () => "",
		collections: {
			read: async (_c: string, id: string) => subs.find((s) => s.id === id) ?? null,
			list: async (_c: string, q: { filter: Row }) => ({
				records: forms.filter((f) => Object.entries(q.filter).every(([k, v]) => f[k] === v)),
			}),
			insert: async (_c: string, data: Row) => {
				const row = { id: `s${subs.length + 1}`, ...data };
				subs.push(row);
				return row;
			},
			update: async () => ({}),
			delete: async (_c: string, id: string) => {
				subs.splice(subs.findIndex((s) => s.id === id), 1);
			},
		},
	};
	return { host: host as never, subs };
}

const FIELDS = [
	{ id: "email", label: "Email", required: true },
	{ id: "note", label: "Note" },
];

const refusal = async (p: Promise<unknown>, code: string) => {
	const err = await p.then(
		() => null,
		(e) => e,
	);
	expect(err).toBeInstanceOf(ActionRefusal);
	expect((err as { code: string }).code).toBe(code);
};

describe("submit", () => {
	it("keeps only the form's fields, and only an active form takes submissions", async () => {
		const { host, subs } = fakeHost([
			{ id: "f1", slug: "contact", active: true, fields: JSON.stringify(FIELDS) },
			{ id: "f2", slug: "old", active: false, fields: FIELDS },
		]);
		await a.submit({ slug: "contact", data: { email: "a@b.c", is_admin: true } }, host);
		expect(subs).toEqual([{ id: "s1", form_id: "f1", data: { email: "a@b.c" } }]);
		await refusal(a.submit({ slug: "old", data: { email: "a@b.c" } }, host), "form_not_found");
	});

	it("refuses a missing required answer by its label", async () => {
		expect(() => answers(FIELDS, { email: "", note: "x" })).toThrow("Missing required fields: Email");
		expect(() => answers("not a list", { x: 1 })).toThrow("not a list");
	});
});

describe("deleteSubmission", () => {
	it("removes one submission and refuses an unknown one", async () => {
		const { host, subs } = fakeHost([{ id: "f1", slug: "c", active: true, fields: [] }]);
		await a.submit({ slug: "c", data: {} }, host);
		await a.deleteSubmission({ id: "s1" }, host);
		expect(subs).toHaveLength(0);
		await refusal(a.deleteSubmission({ id: "s1" }, host), "submission_not_found");
	});
});
