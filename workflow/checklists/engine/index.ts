import type { ZveltioExtension } from "@zveltio/sdk/extension";
import { checklistsActions } from "./actions.js";

// Templates, template items, checklists, their items, recurrence schedules,
// scoring schemes, weights and scores are collections this extension declares
// in `schema/collections/` (manifest `collections`); the engine creates them,
// owns their rules and serves them through the data API. What is left in code
// is completion, scoring and recurrence: the actions in `actions.ts`.
const extension: ZveltioExtension = {
	name: "workflow/checklists",
	category: "workflow",
	mountStrategy: "subapp",

	actions: checklistsActions,

	async register() {},
};

export default extension;
