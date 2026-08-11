#!/usr/bin/env bun
/**
 * Gate: a route that DECIDES something must ask who is asking.
 *
 * `permissionGate(ctx, '<resource>')` on `*` says "you may use this module". It
 * does not say "you may approve this", and four extensions in a row treated the
 * two as the same thing:
 *
 *   - `hr/leave` — anyone holding `leave` could file a request against a
 *     colleague's balance and approve it themselves. Leave is money: unused days
 *     are paid out on termination.
 *   - `hr/time-tracking` — the same, and an approved timesheet is what
 *     `POST /entries/invoice` bills from.
 *   - `finance/expenses` — file it, approve it, reimburse it. One permission, no
 *     accomplice, and `reimburse` records money leaving the company.
 *   - `hr/payroll` — approving and paying an entire payroll run.
 *
 * None of these was found by reading. Each was found by pressing the button as a
 * second user, and the fourth was found by running this check over the whole
 * catalogue after the third.
 *
 * The rule: if an extension mounts `permissionGate` and exposes a route whose
 * path names a decision — approve, reject, void, refund, close, sign, submit,
 * cancel, pay — then somewhere in its engine code there must be a
 * `checkPermission` call. This cannot verify that the check is in the RIGHT
 * place; it verifies that the question is asked at all, which is the failure
 * that keeps recurring.
 *
 * BASELINE: extensions listed below are known to be missing it and are not yet
 * fixed. Removing a name is the only direction this list may move. Adding one
 * requires a very good reason, in review.
 *
 * Usage: bun scripts/check-decision-routes.ts
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');

/**
 * Not yet guarded. Each still runs a decision route behind nothing but the
 * module permission.
 */
const BASELINE = new Set([
  'compliance/ro/documents', // /:id/sign
  'compliance/ro/efactura', // /:id/submit
  'compliance/ro/etransport', // /:id/cancel
  'compliance/ro/procurement', // /orders/:id/approve
  'compliance/ro/saft', // /:id/submit
  'finance/quotes', // /:id/approve-internal, /:id/reject
  'finance/subscriptions', // /invoices/:id/pay, /subscribers/:id/cancel
  'hr/employees', // /performance/cycles/:id/close
]);

const DECISION =
  /\.(post|put|patch)\(\s*'([^']*\b(approve|reject|reimburse|refund|void|close|sign|submit|cancel|pay)\b[^']*)'/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

function extensionDirs(): string[] {
  const found: string[] = [];
  const scan = (dir: string, depth: number) => {
    if (depth > 3) return;
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === 'scripts' || name.startsWith('.')) continue;
      const full = join(dir, name);
      if (!statSync(full).isDirectory()) continue;
      try {
        statSync(join(full, 'manifest.json'));
        found.push(full);
      } catch {
        scan(full, depth + 1);
      }
    }
  };
  scan(ROOT, 1);
  return found;
}

const offenders: Array<{ ext: string; routes: string[] }> = [];
const fixedButBaselined: string[] = [];

for (const dir of extensionDirs()) {
  const engine = join(dir, 'engine');
  let files: string[];
  try {
    files = walk(engine);
  } catch {
    continue;
  }
  const body = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  if (!body.includes('permissionGate')) continue;

  const routes = [...body.matchAll(new RegExp(DECISION, 'gi'))].map((m) => m[2]);
  if (routes.length === 0) continue;

  const name = dir.slice(ROOT.length + 1).replace(/\\/g, '/');
  const asks = /checkPermission\s*\(/.test(body);

  if (!asks && !BASELINE.has(name)) offenders.push({ ext: name, routes: [...new Set(routes)] });
  if (asks && BASELINE.has(name)) fixedButBaselined.push(name);
}

if (fixedButBaselined.length > 0) {
  console.log(
    `[decision-routes] these now ask and can leave BASELINE: ${fixedButBaselined.join(', ')}`,
  );
}

if (offenders.length > 0) {
  console.error('[decision-routes] FAIL — routes that decide, behind no question:\n');
  for (const o of offenders) {
    console.error(`  ${o.ext}`);
    for (const r of o.routes.slice(0, 6)) console.error(`      ${r}`);
  }
  console.error(
    '\nA module permission says you may USE the module. It does not say you may ' +
      'approve, refund or void. Add a named action — `<resource>:approve` and ' +
      'friends — checked with ctx.checkPermission, and refuse the case where the ' +
      'person deciding is the person affected.',
  );
  process.exit(1);
}

console.log(
  `[decision-routes] OK — every extension with a decision route asks who is asking ` +
    `(${BASELINE.size} still on the baseline).`,
);
