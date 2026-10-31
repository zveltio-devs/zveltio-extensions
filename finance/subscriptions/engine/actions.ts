import {
	ActionRefusal,
	type ExtensionAction,
	todayIn,
} from "@zveltio/sdk/extension";

// What subscriptions does beyond plain edits, as actions (`POST /ext/finance/subscriptions/actions/<name>`).
// Plans, and a subscriber's name, contact and Stripe ids, are plain edits
// through `/api/data`. A subscriber's plan, status and billing period, and
// every invoice, usage line, dunning attempt and plan change, are written only
// by these actions (`writtenBy: actions`). The engine runs each action as the
// caller, inside the request transaction: a refusal rolls back everything it
// wrote. Who may do what is the engine's rules on these collections.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const P = "subscription_plans";
const S = "subscribers";
const I = "subscription_invoices";
const U = "subscription_usage";
const PAGE = 500;
const DAY = 86_400_000;
/** Days after each failed payment before the next try; a failure past the last one makes the subscriber past due. */
const DUNNING_DAYS = [1, 3, 7, 14];

const n = (v: unknown) => Number(v ?? 0);
const round2 = (x: number) => Math.round(x * 100) / 100;
const day = (v: unknown) => String(v).slice(0, 10);

/** `start` plus one billing interval; a month-end start ends on the last day of a shorter month. */
export function addInterval(start: string, interval: unknown): string {
	const months = interval === "yearly" ? 12 : interval === "quarterly" ? 3 : 1;
	const d = new Date(`${start}T00:00:00Z`);
	const target = new Date(
		Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1),
	);
	const last = new Date(
		Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
	).getUTCDate();
	target.setUTCDate(Math.min(d.getUTCDate(), last));
	return target.toISOString().slice(0, 10);
}

const addDays = (start: string, days: number) =>
	new Date(Date.parse(`${start}T00:00:00Z`) + days * DAY)
		.toISOString()
		.slice(0, 10);

/**
 * What moving from `oldPrice` to `newPrice` on `today` costs for the rest of
 * the period: the price difference times the share of the period left.
 */
export function proration(
	oldPrice: number,
	newPrice: number,
	periodStart: string,
	periodEnd: string,
	today: string,
): number {
	const total = Date.parse(periodEnd) - Date.parse(periodStart);
	if (total <= 0) return 0;
	const left = Math.min(
		total,
		Math.max(0, Date.parse(periodEnd) - Date.parse(today)),
	);
	return round2(((newPrice - oldPrice) * left) / total);
}

async function all(host: Host, collection: string, filter: Row): Promise<Row[]> {
	const out: Row[] = [];
	for (let page = 1; ; page++) {
		const res = await host.collections.list(collection, {
			filter,
			sort: "id",
			limit: PAGE,
			page,
			count: "none",
		});
		const rows = (res.records as Row[]) ?? [];
		out.push(...rows);
		if (rows.length < PAGE) return out;
	}
}

async function get(host: Host, collection: string, id: string, what: string) {
	const row = await host.collections.read(collection, id);
	if (!row)
		throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
	return row;
}

async function activePlan(host: Host, id: string): Promise<Row> {
	const plan = await get(host, P, id, "plan");
	if (plan.is_active === false)
		throw new ActionRefusal(409, "plan_inactive", "This plan takes no new subscribers.");
	return plan;
}

/**
 * A subscriber written only if its status is still the one read: a concurrent
 * action on the same subscriber fails its precondition instead of overwriting.
 */
const updateSubscriber = (host: Host, s: Row, data: Row) =>
	host.collections.update(S, String(s.id), data, {
		expect: { status: [String(s.status)] },
	});

const subscribe: ExtensionAction = async (input, host) => {
	const d = input as {
		plan_id: string;
		name: string;
		email: string;
		contact_id?: string;
		organization_id?: string;
		start_date?: string;
		metadata?: Row;
	};
	const plan = await activePlan(host, d.plan_id);
	const start = d.start_date ?? todayIn(host.timezone);
	const trialEnd = n(plan.trial_days) > 0 ? addDays(start, n(plan.trial_days)) : null;
	// The first billed period starts when the trial ends.
	const periodStart = trialEnd ?? start;
	return host.collections.insert(S, {
		plan_id: d.plan_id,
		name: d.name,
		email: d.email,
		contact_id: d.contact_id ?? null,
		organization_id: d.organization_id ?? null,
		metadata: d.metadata ?? {},
		status: trialEnd ? "trialing" : "active",
		interval: plan.interval,
		trial_end: trialEnd,
		current_period_start: periodStart,
		current_period_end: addInterval(periodStart, plan.interval),
	});
};

const changePlan: ExtensionAction = async (input, host) => {
	const d = input as { id: string; plan_id: string; reason?: string };
	const s = await get(host, S, d.id, "subscriber");
	if (s.status !== "active" && s.status !== "trialing")
		throw new ActionRefusal(409, "subscriber_not_active", "Only an active or trialing subscriber changes plan.");
	if (s.plan_id === d.plan_id)
		throw new ActionRefusal(409, "same_plan", "The subscriber is already on this plan.");
	const [from, to] = await Promise.all([
		get(host, P, String(s.plan_id), "plan"),
		activePlan(host, d.plan_id),
	]);
	if (from.currency !== to.currency)
		throw new ActionRefusal(409, "currency_mismatch", "A plan change keeps the currency; the plans are in different currencies.");
	// The billing period keeps its length: a change of interval is a new subscription.
	if (to.interval !== s.interval)
		throw new ActionRefusal(409, "interval_mismatch", "A plan change keeps the billing interval.");
	const today = todayIn(host.timezone);
	// Invoices bill in advance, so the period in use today is the one an
	// invoice already billed; its unused share is credited at the old price and
	// charged at the new one on the next invoice. No billed period, nothing to settle.
	const billed = (await all(host, I, { subscriber_id: d.id })).find(
		(inv) => day(inv.period_start) <= today && today < day(inv.period_end),
	);
	const amount = billed
		? proration(n(billed.amount), n(to.price), day(billed.period_start), day(billed.period_end), today)
		: 0;
	const change = await host.collections.insert("plan_changes", {
		subscriber_id: d.id,
		from_plan_id: s.plan_id,
		to_plan_id: d.plan_id,
		effective_date: today,
		proration_amount: amount,
		reason: d.reason ?? null,
	});
	const subscriber = await host.collections.update(
		S,
		d.id,
		{ plan_id: d.plan_id },
		{ expect: { plan_id: [String(s.plan_id)] } },
	);
	return { subscriber, plan_change: change, proration_amount: amount };
};

const cancel: ExtensionAction = async (input, host) => {
	const d = input as { id: string; at_period_end?: boolean };
	const s = await get(host, S, d.id, "subscriber");
	if (s.status === "cancelled")
		throw new ActionRefusal(409, "already_cancelled", "The subscriber is already cancelled.");
	return updateSubscriber(
		host,
		s,
		d.at_period_end
			? { cancel_at_period_end: true }
			: {
					status: "cancelled",
					cancel_at_period_end: false,
					cancelled_at: new Date().toISOString(),
				},
	);
};

const reactivate: ExtensionAction = async (input, host) => {
	const d = input as { id: string };
	const s = await get(host, S, d.id, "subscriber");
	if (s.status !== "cancelled" && s.cancel_at_period_end !== true)
		throw new ActionRefusal(409, "not_cancelled", "Only a cancelled subscriber, or one cancelling at period end, reactivates.");
	if (s.status !== "cancelled") return updateSubscriber(host, s, { cancel_at_period_end: false });
	// A cancelled subscription restarts today: the periods it was cancelled for are not billed.
	const today = todayIn(host.timezone);
	return updateSubscriber(host, s, {
		status: "active",
		cancel_at_period_end: false,
		cancelled_at: null,
		dunning_count: 0,
		payment_failure_at: null,
		current_period_start: today,
		current_period_end: addInterval(today, s.interval),
	});
};

const recordUsage: ExtensionAction = async (input, host) => {
	const d = input as {
		id: string;
		metric_name: string;
		quantity: number;
		billing_period_start?: string;
		billing_period_end?: string;
	};
	const s = await get(host, S, d.id, "subscriber");
	if (s.status === "cancelled")
		throw new ActionRefusal(409, "subscriber_cancelled", "A cancelled subscriber records no usage.");
	const plan = await get(host, P, String(s.plan_id), "plan");
	if (plan.usage_billing !== true)
		throw new ActionRefusal(409, "usage_not_billed", "The subscriber's plan does not bill usage.");
	return host.collections.insert(U, {
		subscriber_id: d.id,
		metric_name: d.metric_name,
		quantity: d.quantity,
		unit_price: n(plan.usage_unit_price),
		billing_period_start: d.billing_period_start ?? null,
		billing_period_end: d.billing_period_end ?? null,
	});
};

/**
 * Bills the subscriber's current period (the plan price plus every unbilled
 * usage line and plan-change proration) and moves the subscriber to the next
 * period. A subscriber cancelling at period end is cancelled instead, once
 * the period it paid for is over. A period is billed
 * once: the subscriber's period moves only if nobody moved it since it was
 * read, and an invoice per subscriber and period start is unique.
 */
const issueInvoice: ExtensionAction = async (input, host) => {
	const d = input as { id: string };
	const s = await get(host, S, d.id, "subscriber");
	if (s.status !== "active" && s.status !== "trialing" && s.status !== "past_due")
		throw new ActionRefusal(409, "subscriber_not_billable", "A cancelled subscriber is not billed.");
	const today = todayIn(host.timezone);
	const periodStart = day(s.current_period_start);
	if (periodStart > today)
		throw new ActionRefusal(409, "period_not_started", `The next period starts on ${periodStart}.`);
	if (s.cancel_at_period_end === true) {
		const subscriber = await updateSubscriber(host, s, {
			status: "cancelled",
			cancel_at_period_end: false,
			cancelled_at: new Date().toISOString(),
		});
		return { invoice: null, subscriber };
	}
	const plan = await get(host, P, String(s.plan_id), "plan");
	await host.collections.update(
		S,
		d.id,
		{
			// The trial is over once its first paid period is billed.
			...(s.status === "trialing" && { status: "active" }),
			current_period_start: day(s.current_period_end),
			current_period_end: addInterval(day(s.current_period_end), s.interval),
		},
		// As read: the engine compares the value in the form the caller received it.
		{ expect: { current_period_start: [String(s.current_period_start)], status: [String(s.status)] } },
	);
	const usage = await all(host, U, { subscriber_id: d.id, invoice_id: null });
	const usageAmount = round2(
		usage.reduce((sum, u) => sum + n(u.quantity) * n(u.unit_price), 0),
	);
	const changes = await all(host, "plan_changes", { subscriber_id: d.id, invoice_id: null });
	const prorationAmount = round2(changes.reduce((sum, c) => sum + n(c.proration_amount), 0));
	const price = round2(n(plan.price));
	const invoice = await host.collections.insert(I, {
		subscriber_id: d.id,
		plan_id: s.plan_id,
		amount: price,
		usage_amount: usageAmount,
		proration_amount: prorationAmount,
		total_amount: round2(price + usageAmount + prorationAmount),
		currency: plan.currency,
		period_start: periodStart,
		period_end: day(s.current_period_end),
		due_date: addDays(today, 14),
	});
	for (const u of usage)
		await host.collections.update(U, String(u.id), { invoice_id: invoice.id });
	for (const c of changes)
		await host.collections.update("plan_changes", String(c.id), { invoice_id: invoice.id });
	return invoice;
};

async function openInvoice(host: Host, id: string): Promise<Row> {
	const inv = await get(host, I, id, "invoice");
	if (inv.status !== "open")
		throw new ActionRefusal(409, "invoice_not_open", "Only an open invoice is paid or fails payment.");
	return inv;
}

/** Settles an open invoice; once none is left open, the subscriber's dunning ends and a past-due subscriber is active again. */
const markInvoicePaid: ExtensionAction = async (input, host) => {
	const d = input as { id: string };
	const inv = await openInvoice(host, d.id);
	const paid = await host.collections.update(
		I,
		d.id,
		{ status: "paid", paid_at: new Date().toISOString() },
		{ expect: { status: ["open"] } },
	);
	const open = await all(host, I, { subscriber_id: inv.subscriber_id, status: "open" });
	if (open.length > 0) return paid;
	const s = await get(host, S, String(inv.subscriber_id), "subscriber");
	await updateSubscriber(host, s, {
		dunning_count: 0,
		payment_failure_at: null,
		...(s.status === "past_due" && { status: "active" }),
	});
	return paid;
};

/**
 * Records a failed payment of an open invoice and schedules the next try
 * (`DUNNING_DAYS`); a failure after the last scheduled try makes the
 * subscriber past due. An attempt number per invoice is unique, so two
 * failures recorded at once cannot count as one.
 */
const recordPaymentFailure: ExtensionAction = async (input, host) => {
	const d = input as { id: string; notes?: string };
	const inv = await openInvoice(host, d.id);
	const attempts = await all(host, "dunning_attempts", { invoice_id: d.id });
	const attempt = attempts.length + 1;
	const wait = DUNNING_DAYS[attempt - 1];
	const next = wait ? new Date(Date.now() + wait * DAY).toISOString() : null;
	await host.collections.insert("dunning_attempts", {
		subscriber_id: inv.subscriber_id,
		invoice_id: d.id,
		attempt_number: attempt,
		next_attempt_at: next,
		notes: d.notes ?? null,
	});
	const s = await get(host, S, String(inv.subscriber_id), "subscriber");
	await updateSubscriber(host, s, {
		// The furthest any open invoice has gone; a newer invoice's first failure does not reset it.
		dunning_count: Math.max(attempt, n(s.dunning_count)),
		payment_failure_at: new Date().toISOString(),
		...(!next && s.status !== "cancelled" && { status: "past_due" }),
	});
	return { attempt, next_attempt_at: next };
};

export const subscriptionsActions: Record<string, ExtensionAction> = {
	subscribe,
	changePlan,
	cancel,
	reactivate,
	recordUsage,
	issueInvoice,
	markInvoicePaid,
	recordPaymentFailure,
};
