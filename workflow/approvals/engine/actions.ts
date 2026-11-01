import { ActionRefusal, type ExtensionAction } from "@zveltio/sdk/extension";

// What approvals does beyond plain edits, as actions (`POST /ext/workflow/approvals/actions/<name>`).
// Workflows and their steps are plain edits through `/api/data`. A request and
// its decisions are written only by these actions (`writtenBy: actions`), so a
// request moves step by step and every move has its decision. The engine runs
// each action as the caller, inside the request transaction: a refusal rolls
// back everything it wrote. Who may request and who may decide is the engine's
// rules: requesting and cancelling run on `approval_requests`, deciding on
// `approval_decisions`. A step's approver role and user say whose turn it is;
// they are not checked here. Who requested or decided is the row's `created_by`.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const WF = "approval_workflows";
const ST = "approval_steps";
const RQ = "approval_requests";
const DC = "approval_decisions";
const HOUR = 3_600_000;

/** A data API refusal of an `expect` (it comes as the engine's problem, not as an ActionRefusal); raised before anything is written. */
const lostRace = (err: unknown) => (err as { code?: unknown })?.code === "precondition_failed";

async function get(host: Host, collection: string, id: string, what: string) {
	const row = await host.collections.read(collection, id);
	if (!row)
		throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
	return row;
}

/** The workflow's steps in order. */
async function steps(host: Host, workflowId: string): Promise<Row[]> {
	const res = await host.collections.list(ST, {
		filter: { workflow_id: workflowId },
		sort: "step_order",
		order: "asc",
		limit: 500,
		count: "none",
	});
	return (res.records as Row[]) ?? [];
}

/** When a step reached now is due: its deadline from now, or none. */
const dueAt = (step: Row, now: number) =>
	step.deadline_hours ? new Date(now + Number(step.deadline_hours) * HOUR).toISOString() : null;

/** Opens a request on a record, at the first step of an active workflow for its collection. */
const requestApproval: ExtensionAction = async (input, host) => {
	const d = input as {
		workflow_id: string;
		collection: string;
		record_id: string;
		metadata?: Row;
		priority?: string;
	};
	const wf = await get(host, WF, d.workflow_id, "workflow");
	if (wf.is_active === false)
		throw new ActionRefusal(409, "workflow_inactive", "This workflow takes no new requests.");
	if (wf.collection !== d.collection)
		throw new ActionRefusal(409, "workflow_collection_mismatch", `This workflow is for ${wf.collection}.`);
	const [first] = await steps(host, d.workflow_id);
	if (!first)
		throw new ActionRefusal(409, "workflow_has_no_steps", "This workflow has no steps to approve.");
	return host.collections.insert(RQ, {
		workflow_id: d.workflow_id,
		collection: d.collection,
		record_id: d.record_id,
		current_step_id: first.id,
		status: "pending",
		priority: d.priority ?? "normal",
		metadata: d.metadata ?? {},
		sla_due_at: dueAt(first, Date.now()),
	});
};

/**
 * Records the decision on a pending request's current step: a rejection ends
 * the request, an approval moves it to the next step or approves it after the
 * last. The request is written only if it is still pending on the step read,
 * so of two concurrent decisions on one step the second is refused.
 */
async function decideOne(host: Host, id: string, decision: string, comment?: string) {
	const rq = await get(host, RQ, id, "request");
	if (rq.status !== "pending" || !rq.current_step_id)
		throw new ActionRefusal(409, "request_not_pending", "This request is not pending.");
	const all = await steps(host, String(rq.workflow_id));
	const at = all.findIndex((s) => s.id === rq.current_step_id);
	const step = all[at];
	const now = Date.now();
	const next = decision === "approved" ? all[at + 1] : undefined;
	const data: Row = next
		? { current_step_id: next.id, sla_due_at: dueAt(next, now), sla_breached: false }
		: {
				status: decision,
				current_step_id: null,
				sla_due_at: null,
				completed_at: new Date(now).toISOString(),
				...(decision === "rejected" && { rejection_reason: comment ?? null }),
			};
	// The first write: a concurrent decision makes it fail before anything of this request is written.
	const request = await host.collections
		.update(RQ, id, data, {
			expect: { status: ["pending"], current_step_id: [String(rq.current_step_id)] },
		})
		.catch((err) => {
			if (lostRace(err)) throw new ActionRefusal(409, "request_not_pending", "This request is not pending.");
			throw err;
		});
	await host.collections.insert(DC, {
		request_id: id,
		step_id: step.id,
		step_name: step.name,
		decision,
		comment: comment ?? null,
	});
	return request;
}

const decide: ExtensionAction = async (input, host) => {
	const d = input as { id: string; decision: string; comment?: string };
	return decideOne(host, d.id, d.decision, d.comment);
};

/**
 * The same decision on several requests. Each is decided on its own: one that
 * is missing or no longer pending is reported and the others go ahead.
 */
const decideMany: ExtensionAction = async (input, host) => {
	const d = input as { ids: string[]; decision: string; comment?: string };
	const results: Row[] = [];
	for (const id of new Set(d.ids)) {
		try {
			await decideOne(host, id, d.decision, d.comment);
			results.push({ id, success: true });
		} catch (err) {
			// decideOne refuses only before its first write; anything later aborts the batch.
			if (!(err instanceof ActionRefusal)) throw err;
			results.push({ id, success: false, error: err.code });
		}
	}
	const succeeded = results.filter((r) => r.success).length;
	return { results, succeeded, failed: results.length - succeeded };
};

/** Withdraws a pending request. */
const cancel: ExtensionAction = async (input, host) => {
	const { id } = input as { id: string };
	await get(host, RQ, id, "request");
	return host.collections
		.update(
			RQ,
			id,
			{
				status: "cancelled",
				current_step_id: null,
				sla_due_at: null,
				completed_at: new Date().toISOString(),
			},
			{ expect: { status: ["pending"] } },
		)
		.catch((err) => {
			if (lostRace(err)) throw new ActionRefusal(409, "request_not_pending", "This request is not pending.");
			throw err;
		});
};

/**
 * Flags pending requests past their step's deadline, up to 500 a run (a
 * flagged one is not listed again). Meant for a flow on a timer.
 */
const markOverdue: ExtensionAction = async (_input, host) => {
	const res = await host.collections.list(RQ, {
		filter: { status: "pending", sla_breached: false, sla_due_at: { lt: new Date().toISOString() } },
		limit: 500,
		count: "none",
	});
	let flagged = 0;
	for (const rq of (res.records as Row[]) ?? []) {
		const done = await host.collections
			.update(RQ, String(rq.id), { sla_breached: true }, {
				expect: { current_step_id: [String(rq.current_step_id)] },
			})
			.then(
				() => true,
				(err) => {
					// Decided meanwhile: the new step has its own deadline.
					if (lostRace(err)) return false;
					throw err;
				},
			);
		if (done) flagged++;
	}
	return { newly_breached: flagged };
};

export const approvalsActions: Record<string, ExtensionAction> = {
	requestApproval,
	decide,
	decideMany,
	cancel,
	markOverdue,
};
