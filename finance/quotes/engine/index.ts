import type { ZveltioExtension } from "@zveltio/sdk/extension";
import { quotesActions } from "./actions.js";

// Quotes and their lines are collections this extension declares in
// `schema/collections/` (manifest `collections`); the engine creates them, owns
// their rules and serves them through the data API. What is left in code is
// what quotes does beyond a plain edit: the actions in `actions.ts`.
const extension: ZveltioExtension = {
	name: "finance/quotes",
	category: "finance",
	mountStrategy: "subapp",

	actions: quotesActions,

	async register() {},
};

export default extension;
