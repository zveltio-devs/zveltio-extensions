import { afterEach, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GATE = join(import.meta.dir, 'check-version-bumped.ts');
const repos: string[] = [];

/** A repository whose `base` branch holds sms 2.2.0 with a test, a doc and a changelog. */
function publishedRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'version-bump-gate-'));
  repos.push(root);
  const run = (...args: string[]) => Bun.spawnSync(['git', '-C', root, ...args]);
  run('init', '-q', '-b', 'base');
  run('config', 'user.email', 'gate@test');
  run('config', 'user.name', 'gate');
  mkdirSync(join(root, 'sms/engine'), { recursive: true });
  write(root, 'sms/manifest.json', JSON.stringify({ name: 'sms', version: '2.2.0' }));
  write(root, 'sms/engine/routes.test.ts', 'one\n');
  write(root, 'sms/CHANGELOG.md', '## 2.2.0\n');
  run('add', '-A');
  run('commit', '-q', '-m', 'base');
  run('checkout', '-q', '-b', 'pr');
  return root;
}

function write(root: string, path: string, body: string) {
  writeFileSync(join(root, path), body);
}

function commit(root: string) {
  Bun.spawnSync(['git', '-C', root, 'add', '-A']);
  Bun.spawnSync(['git', '-C', root, 'commit', '-q', '-m', 'pr']);
}

const gate = (root: string) => Bun.spawnSync(['bun', GATE, root], { env: { ...process.env, BASE_REF: 'base' } }).exitCode;

afterEach(() => {
  for (const r of repos.splice(0)) rmSync(r, { recursive: true, force: true });
});

// #371: a test edited under a stored version made the registry answer 409.
test('fails on an archived file changed under the published version', () => {
  const root = publishedRepo();
  write(root, 'sms/engine/routes.test.ts', 'two\n');
  commit(root);
  expect(gate(root)).toBe(1);
});

test('passes once the manifest version moves', () => {
  const root = publishedRepo();
  write(root, 'sms/engine/routes.test.ts', 'two\n');
  write(root, 'sms/manifest.json', JSON.stringify({ name: 'sms', version: '2.2.1' }));
  write(root, 'sms/CHANGELOG.md', '## 2.2.1\n\n## 2.2.0\n');
  commit(root);
  expect(gate(root)).toBe(0);
});

// The registry serves CHANGELOG.md from metadata; it is not in the archive.
test('passes on a CHANGELOG.md-only edit', () => {
  const root = publishedRepo();
  write(root, 'sms/CHANGELOG.md', '## 2.2.0\n\n- typo\n');
  commit(root);
  expect(gate(root)).toBe(0);
});

test('passes on a new extension', () => {
  const root = publishedRepo();
  mkdirSync(join(root, 'mail'));
  write(root, 'mail/manifest.json', JSON.stringify({ name: 'mail', version: '1.0.0' }));
  commit(root);
  expect(gate(root)).toBe(0);
});
