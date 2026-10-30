import type { ZveltioExtension } from "@zveltio/sdk/extension";
import { bankingActions } from "./actions.js";

// Bank accounts, transactions, imports, rules, reconciliations, balance
// history and cash-flow entries are collections this extension declares in
// `schema/collections/` (manifest `collections`); the engine creates them, owns
// their rules and serves them through the data API. What is left in code is
// what banking does beyond a plain edit: the actions in `actions.ts`.
const extension: ZveltioExtension = {
	name: "finance/banking",
	category: "finance",
	mountStrategy: "subapp",

	actions: bankingActions,

	async register() {},
};

export default extension;
