import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';
// ponytail: invoicing's own code, inlined into this bundle when it is packed —
// billed hours become an invoice exactly as invoicing issues one. A change to
// invoicing's actions needs a repack of time-tracking too; check-bundle-sources
// hashes only this extension's engine/, so it will not say so.
import { invoicingActions } from '../../../finance/invoicing/engine/actions.js';

// What time tracking does beyond plain edits, as actions
// (`POST /ext/hr/time-tracking/actions/<name>`). The engine runs each as the
// caller, inside the request transaction, through the data API
// (`host.collections`): the collections' permissions, column rules, revisions,
// flows and audit are a PATCH's own, and a throw rolls back everything the
// action wrote. Projects are plain edits, and a timesheet moves draft →
// submitted → approved/rejected by a PATCH its transition rule checks.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const P = 'time_projects';
const E = 'time_entries';
const T = 'active_timers';
const PAGE = 500;

async function load(host: Host, collection: string, id: string, what: string) {
  const row = await host.collections.read(collection, id);
  if (!row) throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}

async function timerOf(host: Host, employee_id: string) {
  const res = await host.collections.list(T, { filter: { employee_id }, limit: 1, count: 'none' });
  return ((res.records as Row[]) ?? [])[0] ?? null;
}

/** An entry carries the project's rate at the time it was logged, so a later rate change does not reprice it. */
async function insertEntry(host: Host, d: Row & { project_id: string }) {
  const project = await load(host, P, d.project_id, 'project');
  return host.collections.insert(E, { ...d, hourly_rate: project.hourly_rate });
}

const logTime: ExtensionAction = async (input, host) => insertEntry(host, input as Row & { project_id: string });

/** One running timer per employee: starting another restarts it on the new project. */
const startTimer: ExtensionAction = async (input, host) => {
  const d = input as Row & { employee_id: string; project_id: string };
  await load(host, P, d.project_id, 'project');
  const data = { task_description: '', is_billable: true, notes: null, ...d, started_at: new Date().toISOString() };
  const running = await timerOf(host, d.employee_id);
  return running ? host.collections.update(T, running.id as string, data) : host.collections.insert(T, data);
};

/** The running timer becomes a time entry for today; under a minute it is discarded. */
const stopTimer: ExtensionAction = async (input, host) => {
  const { employee_id } = input as { employee_id: string };
  const t = await timerOf(host, employee_id);
  if (!t) throw new ActionRefusal(409, 'no_timer', 'This employee has no running timer.');
  await host.collections.delete(T, t.id as string);
  const end = new Date();
  const duration_minutes = Math.round((end.getTime() - new Date(t.started_at as string).getTime()) / 60_000);
  if (duration_minutes < 1) return { discarded: true };
  return insertEntry(host, {
    employee_id,
    project_id: t.project_id as string,
    task_description: t.task_description,
    is_billable: t.is_billable,
    notes: t.notes ?? null,
    date: end.toISOString().slice(0, 10),
    start_time: t.started_at,
    end_time: end.toISOString(),
    duration_minutes,
  });
};

/**
 * The week's timesheet with its total hours, from the employee's entries
 * dated in it. Recomputing is allowed while it is a draft.
 */
const computeTimesheet: ExtensionAction = async (input, host) => {
  const { employee_id, week_start } = input as { employee_id: string; week_start: string };
  const end = new Date(`${week_start}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  const week_end = end.toISOString().slice(0, 10);
  let minutes = 0;
  for (let page = 1; ; page++) {
    const res = await host.collections.list(E, {
      filter: { employee_id, date: { gte: week_start } },
      limit: PAGE,
      page,
      sort: 'id',
      count: 'none',
    });
    const recs = (res.records as Row[]) ?? [];
    for (const e of recs) if (String(e.date).slice(0, 10) <= week_end) minutes += Number(e.duration_minutes);
    if (recs.length < PAGE) break;
  }
  const total_hours = Math.round((minutes / 60) * 100) / 100;
  const found = await host.collections.list('timesheets', { filter: { employee_id, week_start }, limit: 1, count: 'none' });
  const sheet = ((found.records as Row[]) ?? [])[0];
  if (!sheet) return host.collections.insert('timesheets', { employee_id, week_start, week_end, total_hours });
  if (sheet.status !== 'draft') throw new ActionRefusal(409, 'timesheet_not_draft', 'Only a draft timesheet is recomputed.');
  return host.collections.update('timesheets', sheet.id as string, { total_hours }, { expect: { status: ['draft'] } });
};

/**
 * Billable, unbilled entries of one project become one invoice, through
 * invoicing's own `createInvoice` (`finance/invoicing`, an optional
 * dependency: without it the action is refused). Each entry is marked billed
 * only if it still is not (`expect`), so two invoices running together for the
 * same hours fail one of them, rolling back its invoice and its number.
 */
const invoiceEntries: ExtensionAction = async (input, host) => {
  const d = input as { project_id: string; entry_ids: string[]; invoice_date?: string; due_days?: number; client_name?: string; client_tax_id?: string; notes?: string; series?: string; exchange_rate?: number };
  const project = await load(host, P, d.project_id, 'project');
  const entries: Row[] = [];
  for (const id of new Set(d.entry_ids)) {
    const e = await load(host, E, id, 'entry');
    if (e.project_id !== d.project_id || !e.is_billable || e.is_billed) {
      throw new ActionRefusal(409, 'entry_not_billable', `Entry ${id} is not billable, already billed, or of another project.`);
    }
    entries.push(e);
  }
  const client_name = d.client_name || (project.client_name as string | null);
  if (!client_name) throw new ActionRefusal(400, 'client_required', 'The project names no client; give client_name.');
  const inv = (await invoicingActions.createInvoice(
    {
      client_name,
      ...(d.client_tax_id && { client_tax_id: d.client_tax_id }),
      currency: project.currency ?? 'RON',
      ...(d.invoice_date && { issue_date: d.invoice_date }),
      ...(d.due_days !== undefined && { due_days: d.due_days }),
      ...(d.series && { series: d.series }),
      ...(d.exchange_rate && { exchange_rate: d.exchange_rate }),
      ...(d.notes && { notes: d.notes }),
      lines: entries.map((e, i) => ({
        description: String(e.task_description || 'Time entry'),
        quantity: Math.round((Number(e.duration_minutes) / 60) * 100) / 100,
        unit: 'h',
        unit_price: Number(e.hourly_rate ?? project.hourly_rate ?? 0),
        sort_order: i,
        metadata: { time_entry_id: e.id },
      })),
    },
    host,
  )) as Row;
  for (const e of entries) {
    await host.collections.update(E, String(e.id), { is_billed: true, invoice_id: inv.id }, { expect: { is_billed: [false] } });
  }
  return inv;
};

export const timeTrackingActions = { logTime, startTimer, stopTimer, computeTimesheet, invoiceEntries };
