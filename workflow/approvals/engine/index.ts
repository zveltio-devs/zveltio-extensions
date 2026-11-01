import type { ZveltioExtension } from "@zveltio/sdk/extension";
import { approvalsActions } from "./actions.js";

// Workflows, steps, requests and decisions are collections this extension
// declares in `schema/collections/` (manifest `collections`); the engine
// creates them, owns their rules and serves them through the data API. What is
// left in code is moving a request through its steps: the actions in `actions.ts`.
const extension: ZveltioExtension = {
	name: "workflow/approvals",
	category: "workflow",
	mountStrategy: "subapp",

	actions: approvalsActions,

	async register() {},
};

export default extension;
