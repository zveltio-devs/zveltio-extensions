#!/usr/bin/env bun
/**
 * Gate: the harness's stub list stays honest.
 *
 * ## What it is for
 *
 * `testing/ext-harness.ts` turns `ctx.internals` members it does not implement
 * into callable stubs. That is deliberate — an extension must be able to mount
 * without every host internal existing — but it has a failure mode with a
 * direction, and the direction is set by how each member signals:
 *
 *   throws to refuse     assertPublicUrl, assertNonMetadataUrl, validatePublicUrl
 *                        -> the stub resolves silently -> ALLOWED.
 *                           A test written to prove the refusal passes with the
 *                           guard deleted from the route.
 *
 *   returns a boolean    isTenantAdmin, requireInstanceAdmin
 *                        -> undefined -> falsy -> refused. Visible, because a
 *                           route that always 403s gets noticed — but it hides
 *                           the ALLOW path, which is how the `content/pages`
 *                           editor gate stayed untested in both directions.
 *
 *   returns error|null   checkQueryDepth, checkQueryWidth
 *                        -> a truthy Promise -> every query rejected. Visible.
 *
 * THE DEFECT THAT MOTIVATED THIS: `integrations/api-connector`
 * `POST /connections` calls `assertPublicUrl` on a `base_url` the caller
 * supplies and the connector later fetches. Inert under the harness, and there
 * was no test — so nothing showed at all. Two more followed the same shape: the
 * `content/pages` editor gate, and `GET /sites` answering 500 for a suspended
 * tenant slug on a path tests could not reach.
 *
 * ## Why a ratchet and not a blanket throw
 *
 * 24 members are reached across the suite, and for most of them `undefined` is a
 * fair answer — a test about a mail filter should not have to write a sentence
 * about `generatePDF`. A rule that demands one trains people to write it without
 * meaning it, which is how an exception list stops being review and becomes
 * paperwork.
 *
 * So the recorded ones stub as before and anything NEW throws at the point of
 * use, naming the member. The category is the part that lasts: after the fifth
 * entry a free-text reason no longer tells the next person which question they
 * are answering.
 *
 * ## What this script adds that the harness cannot
 *
 * The harness knows what a test reached. It does not know when a line has gone
 * STALE — a member listed as stubbed that somebody has since made real. Without
 * that check the file only grows, and in a year it is 24 sentences that all say
 * "safe to stub" with no way to tell which three were ever the point.
 *
 * Usage: bun scripts/check-harness-stubs.ts
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const LIST = join(ROOT, 'quality-gates', 'harness-stubs.json');
const HARNESS = join(ROOT, 'testing', 'ext-harness.ts');

interface Entry {
  member: string;
  category: string;
  reason: string;
}

const doc = JSON.parse(readFileSync(LIST, 'utf8')) as {
  categories: Record<string, string>;
  members: Entry[];
};

const problems: string[] = [];

/**
 * The members the harness implements for real.
 *
 * Read out of the source rather than by importing it: `ext-harness.ts` calls
 * `afterAll` at module scope, so importing it outside the test runner throws.
 *
 * The extraction is asserted, not assumed. If the block cannot be found the gate
 * FAILS rather than reporting an empty set — an empty set would make every
 * staleness check vacuously pass, which is the exact shape of green this
 * repository keeps finding.
 */
function realMembers(): Set<string> {
  const src = readFileSync(HARNESS, 'utf8');
  const start = src.indexOf('realInternals({');
  if (start === -1) {
    problems.push(
      'could not find `realInternals({` in testing/ext-harness.ts — this gate cannot ' +
        'tell a stale line from a live one, so it refuses rather than passing.',
    );
    return new Set();
  }
  // Balance braces from the opening `{` of the object literal.
  let depth = 0;
  let end = -1;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) {
    problems.push('the `realInternals({ … })` literal in testing/ext-harness.ts is unbalanced.');
    return new Set();
  }
  const body = src.slice(start, end);
  const names = new Set<string>();
  for (const m of body.matchAll(/^\s{6}([A-Za-z_$][\w$]*)\s*:/gm)) names.add(m[1]!);
  if (names.size === 0) {
    problems.push('found the `realInternals` literal but no members in it — refusing to pass.');
  }
  return names;
}

const real = realMembers();
const seen = new Set<string>();

for (const entry of doc.members) {
  const where = `harness-stubs.json → ${entry.member}`;

  if (!entry.member || typeof entry.member !== 'string') {
    problems.push(`${where}: missing a member name.`);
    continue;
  }
  if (seen.has(entry.member)) problems.push(`${where}: listed twice.`);
  seen.add(entry.member);

  if (!(entry.category in doc.categories)) {
    problems.push(
      `${where}: category "${entry.category}" is not one of ` +
        `${Object.keys(doc.categories).join(', ')}.`,
    );
  }

  if (!entry.reason || entry.reason.trim().length < 20) {
    problems.push(
      `${where}: the reason is the point of the line. Say what the stub's ` +
        'undefined does at the call site, not that it is fine.',
    );
  }

  // The staleness check.
  if (real.has(entry.member)) {
    problems.push(
      `${where}: STALE — the harness now implements this for real, so the line ` +
        'describes something that no longer happens. Remove it.',
    );
  }

  // Nothing may rest in the fail-open category.
  if (entry.category === 'fails-open-if-stubbed') {
    problems.push(
      `${where}: "fails-open-if-stubbed" is a bug to fix, not a state to record. ` +
        'A member that refuses by throwing must be given a real implementation in ' +
        'the harness — see assertPublicUrl and its family.',
    );
  }
}

if (problems.length > 0) {
  console.error('\n✗ check-harness-stubs:\n');
  for (const p of problems) console.error(`  ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  `✓ harness-stubs: ${doc.members.length} recorded stub(s), ${real.size} real member(s), none stale.`,
);
