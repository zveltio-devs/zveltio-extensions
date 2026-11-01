import type { ZveltioExtension } from "@zveltio/sdk/extension";
import { formsActions } from "./actions.js";

// Forms, their responses, answers and recurrence schedules are collections
// this extension declares in `schema/collections/` (manifest `collections`);
// the engine creates them, owns their rules and serves them through the data
// API. What is left in code is writing a response and its answers: the
// actions in `actions.ts`.
const extension: ZveltioExtension = {
	name: "forms",
	category: "forms",
	mountStrategy: "subapp",

	actions: formsActions,

	async register() {},
};

export default extension;
