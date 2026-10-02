#!/usr/bin/env bun
/**
 * review-inventory.ts — the file-by-file review ledger for this repository.
 *
 * Reads:  ../zveltio-private/extensions/review-sessions/*.json  (one file per session)
 * Writes: ../zveltio-private/extensions/REVIEW-STATE.md         (generated, never hand-edited)
 *
 * The engine repository has the same generator (scripts/review-inventory.ts
 * there). This one differs in one way: sections are not a hand-kept map. Every
 * directory holding a `manifest.json` is an extension, and each extension is
 * split by side — `engine`, `studio`, `client` — because the campaign so far
 * reviewed engine sides only, and a per-extension tick hid that.
 *
 * In scope: .ts/.svelte/.sql/.js sources, `studio/schemas/*.json` (SDUI pages
 * are code that happens to be JSON) and each `manifest.json` (it declares
 * capabilities and grants). Out of scope: packed bundles (`engine/index.js`,
 * gated by check-bundle-sources), generated files (their generator is in scope),
 * i18n message catalogs, vendored minified JS.
 * Tests are tracked separately: a session lists them under `tests`.
 *
 * Exit 1 when a ledger entry is malformed. Run: `bun run review:inventory`.
 */

import { existsSync, readFileSync } from 'node:fs';

type Finding = {
  severity: 'critical' | 'high' | 'medium' | 'low';
  where: string;
  what: string;
  status: 'fixed' | 'logged' | 'deferred';
  ref?: string;
};

type Session = {
  /** `<extension>:<side>`, e.g. `crm:engine`, or `repo:scripts`. */
  section: string;
  date: string;
  agent: string;
  files: string[];
  tests?: string[];
  ran?: string[];
  findings?: Finding[];
  notDone?: string;
  verdict: 'clean' | 'repaired' | 'logged' | 'blocked' | 'partial';
};

const PRIVATE_ROOT = '../zveltio-private/extensions';
const SESSIONS_DIR = `${PRIVATE_ROOT}/review-sessions`;
const OUTPUT_MD = `${PRIVATE_ROOT}/REVIEW-STATE.md`;

// Absent sibling is fatal: "could not look" must not read as "nothing to do".
if (!existsSync(PRIVATE_ROOT)) {
  console.error(`review-inventory: no private repository at ${PRIVATE_ROOT}`);
  process.exit(1);
}

const SOURCE = /\.(ts|svelte|sql|js)$/;
const IS_TEST = /(\.test\.ts$|\/tests?\/)/;
const EXCLUDED = /(\/engine\/index\.js$|\.generated\.ts$|\.min\.js$|\.d\.ts$|\/node_modules\/)/;
const SIDES = ['engine', 'studio', 'client'] as const;

function inScope(f: string): boolean {
  if (EXCLUDED.test(f)) return false;
  if (SOURCE.test(f)) return true;
  return f.endsWith('/manifest.json') || /\/studio\/schemas\/.*\.json$/.test(f);
}

const ls = Bun.spawnSync(['git', 'ls-files']);
if (ls.exitCode !== 0) throw new Error('git ls-files failed');
const tracked = ls.stdout.toString().split('\n').filter(Boolean);

// Longest first, so `compliance/ro/efactura` wins over a hypothetical `compliance`.
const extensions = tracked
  .filter((f) => f.endsWith('/manifest.json') && !f.includes('/studio/'))
  .map((f) => f.slice(0, -'/manifest.json'.length))
  .sort((a, b) => b.length - a.length);

function sectionFor(f: string): string {
  const ext = extensions.find((e) => f.startsWith(`${e}/`));
  if (!ext) return `repo:${f.includes('/') ? f.split('/')[0] : '(root)'}`;
  const rest = f.slice(ext.length + 1);
  const side = SIDES.find((s) => rest.startsWith(`${s}/`));
  // The manifest belongs with the engine side: it is what the engine enforces.
  return `${ext}:${side ?? 'engine'}`;
}

const lines = (f: string) => {
  try {
    const t = readFileSync(f, 'utf8');
    return t.split('\n').length - (t.endsWith('\n') ? 1 : 0);
  } catch {
    return 0;
  }
};

const code = new Map<string, string[]>();
const tests = new Map<string, string[]>();
for (const f of tracked.filter(inScope)) {
  const m = IS_TEST.test(f) ? tests : code;
  const s = sectionFor(f);
  m.set(s, [...(m.get(s) ?? []), f]);
}

const sessions: Session[] = [];
for (const name of existsSync(SESSIONS_DIR)
  ? Array.from(new Bun.Glob('*.json').scanSync(SESSIONS_DIR)).sort()
  : []) {
  const s = (await Bun.file(`${SESSIONS_DIR}/${name}`).json()) as Session;
  if (!s?.section || !Array.isArray(s.files)) {
    console.error(`review-inventory: ${name} needs "section" and a "files" array`);
    process.exit(1);
  }
  for (const fd of s.findings ?? []) {
    const missing = ['severity', 'where', 'what', 'status'].filter(
      (k) => typeof (fd as Record<string, unknown>)?.[k] !== 'string',
    );
    if (missing.length) {
      console.error(`review-inventory: ${name} has a finding missing ${missing.join(', ')}`);
      process.exit(1);
    }
  }
  sessions.push(s);
}

const read = new Set(sessions.flatMap((s) => s.files));
const testsRead = new Set(sessions.flatMap((s) => s.tests ?? []));
const loc = (fs: string[]) => fs.reduce((n, f) => n + lines(f), 0);

type Row = { id: string; total: number; done: number; loc: number; locLeft: number };
const rows: Row[] = [...code.entries()].map(([id, fs]) => {
  const left = fs.filter((f) => !read.has(f));
  return { id, total: fs.length, done: fs.length - left.length, loc: loc(fs), locLeft: loc(left) };
});
// Next = the open section with the most unread lines: size is where the
// unexamined surface is (the order the campaign has used since September).
const open = rows.filter((r) => r.done < r.total).sort((a, b) => b.locLeft - a.locLeft);

const all = rows.reduce((a, r) => ({ total: a.total + r.total, done: a.done + r.done }), {
  total: 0,
  done: 0,
});
const allTests = [...tests.values()].flat();
const bySide = (side: string) => rows.filter((r) => r.id.endsWith(`:${side}`));

const md: string[] = [
  '# Extensions review — state',
  '',
  '> Generated by `scripts/review-inventory.ts` in zveltio-extensions. **Do not edit.**',
  '> Record a session as one JSON file in `review-sessions/`, then re-run.',
  '',
  '## Next up',
  '',
  open[0]
    ? `→ **${open[0].id}** — ${open[0].total - open[0].done} of ${open[0].total} files, ` +
      `${open[0].locLeft} lines unread. After it: ${open
        .slice(1, 6)
        .map((r) => r.id)
        .join(', ')}`
    : 'Nothing open.',
  '',
  '## Progress',
  '',
  `- Files: **${all.done} / ${all.total}** (${Math.round((all.done / all.total) * 100)}%)`,
  ...[...SIDES, 'repo'].map((side) => {
    const rs = side === 'repo' ? rows.filter((r) => r.id.startsWith('repo:')) : bySide(side);
    const t = rs.reduce((n, r) => n + r.total, 0);
    const d = rs.reduce((n, r) => n + r.done, 0);
    return `  - ${side}: ${d} / ${t} files in ${rs.length} sections, ${rs.filter((r) => r.done === r.total).length} closed`;
  }),
  `- Test files opened: **${allTests.filter((t) => testsRead.has(t)).length} / ${allTests.length}**`,
  '',
  '## Sections',
  '',
  '| section | files | lines | unread lines |',
  '| --- | --: | --: | --: |',
  ...rows
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => `| ${r.done === r.total ? '✅' : ''} \`${r.id}\` | ${r.done}/${r.total} | ${r.loc} | ${r.locLeft} |`),
  '',
  '## Findings',
  '',
  ...sessions.flatMap((s) =>
    (s.findings ?? []).map(
      (f) => `- **${f.severity}** \`${f.where}\` — ${f.what} _(${f.status}${f.ref ? `, ${f.ref}` : ''})_ — ${s.section}`,
    ),
  ),
  '',
];

await Bun.write(OUTPUT_MD, md.join('\n'));
console.log(md.slice(5, 16).join('\n'));
