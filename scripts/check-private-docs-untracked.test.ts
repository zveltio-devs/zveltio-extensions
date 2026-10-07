import { afterEach, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GATE = join(import.meta.dir, 'check-private-docs-untracked.ts');
const repos: string[] = [];

/** A repository ignoring docs/private/, with `path` force-added to the index. */
function plantedRepo(path: string): string {
  const root = mkdtempSync(join(tmpdir(), 'private-docs-gate-'));
  repos.push(root);
  Bun.spawnSync(['git', 'init', '-q', root]);
  writeFileSync(join(root, '.gitignore'), 'docs/private/\n');
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), 'private prose\n');
  Bun.spawnSync(['git', '-C', root, 'add', '-f', path]);
  return root;
}

const gate = (root: string) => Bun.spawnSync(['bun', GATE, root]).exitCode;

afterEach(() => {
  for (const r of repos.splice(0)) rmSync(r, { recursive: true, force: true });
});

test('fails on a file tracked under docs/private/', () => {
  expect(gate(plantedRepo('docs/private/notes.md'))).toBe(1);
});

// The trailing-slash pathspec matched only a directory's contents, so a FILE
// at exactly docs/private passed the gate with private prose in the index.
test('fails on a file tracked at exactly docs/private', () => {
  expect(gate(plantedRepo('docs/private'))).toBe(1);
});

test('fails, not passes, on a path that is not a repository', () => {
  expect(gate(join(tmpdir(), 'private-docs-gate-absent'))).toBe(1);
});
