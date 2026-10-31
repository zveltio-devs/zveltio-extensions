import type { ZveltioExtension } from "@zveltio/sdk/extension";
import { subscriptionsActions } from "./actions.js";

// Plans, subscribers, invoices, usage, dunning attempts and plan changes are
// collections this extension declares in `schema/collections/` (manifest
// `collections`); the engine creates them, owns their rules and serves them
// through the data API. What is left in code is the billing lifecycle: the
// actions in `actions.ts`.
const extension: ZveltioExtension = {
	name: "finance/subscriptions",
	category: "finance",
	mountStrategy: "subapp",

	actions: subscriptionsActions,

	async register() {},
};

export default extension;
