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
 * The rule: every route whose path names a decision — approve, reject, void,
 * refund, close, sign, submit, cancel, pay — must have a `checkPermission` in
 * its own handler body, not merely somewhere in the file.
 *
 * The first version of this checked the file as a whole, and it was not enough.
 * Guarding seven extensions in one pass with a regex silently skipped
 * `/subscribers/:id/cancel`, because its `zValidator` schema spans several lines
 * and the pattern only matched single-line handler heads. The extension then had
 * a `checkPermission` and passed a file-level check with a route still open.
 *
 * So the gate reads each handler: from the route registration to the balanced
 * closing brace, and asks whether the question is put THERE.
 *
 * A guard may also live in ANOTHER module, reached over `ctx.services` — that is
 * how `hr/leave` and `hr/time-tracking` ask `hr.employment` who somebody is and
 * whether they manage them. A static reader cannot follow a call resolved at
 * runtime across an extension boundary, and pretending it can is how a gate
 * turns into theatre. Those handlers declare it instead, with a marker naming
 * where the check lives:
 *
 *     // permission: delegated to hr.employment.mayActFor
 *
 * That is weaker than seeing the call — it is a claim, not a proof. It is also
 * greppable, reviewable, and forces the delegation to be written down rather
 * than inferred from a variable called `svc`.
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
const BASELINE = new Set<string>([
  // Empty, and it should stay that way. Every decision route in the catalogue
  // asks who is asking. A name appearing here again means somebody shipped one
  // that does not.
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

/**
 * The source of one route handler: from the arrow that opens it to the brace
 * that closes it.
 *
 * Not simply the next `{` after the registration. Half these routes are written
 * `app.post('/x', zValidator('json', z.object({ … })), async (c) => { … })`, and
 * the first brace belongs to the SCHEMA. Reading that as the handler made the
 * gate report guarded routes as unguarded — it was inspecting a zod object and
 * finding no permission check in it, which is true and irrelevant.
 *
 * Balanced braces from the arrow, rather than a pattern, because handler shapes
 * vary — nested callbacks, template literals full of SQL — and a pattern that
 * covers today's shapes is how the last route got missed.
 */
function handlerBody(src: string, from: number): string {
  const arrow = src.indexOf('=> {', from);
  return arrow === -1 ? '' : balanced(src, arrow + 3);
}

/** Balanced braces starting at the first `{` at or after `from`. */
function balanced(src: string, from: number): string {
  const open = src.indexOf('{', from);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  return src.slice(open);
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

  const name = dir.slice(ROOT.length + 1).replace(/\\/g, '/');
  const unguarded: string[] = [];

  for (const file of files) {
    const src = readFileSync(file, 'utf8');

    // A handler rarely calls `checkPermission` itself — the readable shape is a
    // named helper (`mayApprove`, `mayActOnReport`) that says what the rule IS.
    // So resolve one level: any function in this file whose own body asks the
    // question counts as asking it.
    const guards = new Set<string>(['checkPermission']);
    for (const g of src.matchAll(/(?:async\s+)?function\s+(\w+)\s*\(/g)) {
      const body = balanced(src, g.index! + g[0].length - 1);
      if (/checkPermission\s*\(/.test(body)) guards.add(g[1]);
    }
    const asks = new RegExp(`\\b(${[...guards].join('|')})\\s*\\(`);
    // A declared delegation counts, and must name what it delegates to.
    const delegates = /\/\/\s*permission:\s*delegated to\s+\S+/;

    const re = new RegExp(DECISION, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      const body = handlerBody(src, m.index);
      if (!asks.test(body) && !delegates.test(body)) unguarded.push(m[2]);
    }
  }

  if (unguarded.length === 0) {
    if (BASELINE.has(name)) fixedButBaselined.push(name);
    continue;
  }
  if (!BASELINE.has(name)) offenders.push({ ext: name, routes: [...new Set(unguarded)] });
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
