// The collection file's transition rules, evaluated by the engine's own
// evaluator: the declaration's order holds for a PATCH as for the actions.
import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ENGINE = join(import.meta.dir, '../../../../../zveltio/packages/engine/src');
const file = JSON.parse(
  readFileSync(join(import.meta.dir, '../schema/collections/etransport_declarations.json'), 'utf8'),
);
const rule = (field: string): string =>
  file.validation.find((v: { field: string }) => v.field === field).config.expression;

describe('etransport_declarations transition rules', () => {
  it('status follows draft → declared → completed, cancellable until closed', async () => {
    const { evaluateTransitionRule } = await import(join(ENGINE, 'lib/validation-engine.js'));
    const ok = (prev: string | null, next: string | null) =>
      evaluateTransitionRule(rule('status'), next, prev, 'enum').status === 'passed';
    expect(ok(null, 'draft')).toBe(true);
    expect(ok(null, null)).toBe(true);
    expect(ok(null, 'declared')).toBe(false);
    expect(ok('draft', 'declared')).toBe(true);
    expect(ok('draft', 'cancelled')).toBe(true);
    expect(ok('draft', 'completed')).toBe(false);
    expect(ok('declared', 'in_transit')).toBe(true);
    expect(ok('declared', 'completed')).toBe(true);
    expect(ok('in_transit', 'cancelled')).toBe(true);
    expect(ok('declared', 'draft')).toBe(false);
    expect(ok('completed', 'cancelled')).toBe(false);
    expect(ok('cancelled', 'draft')).toBe(false);
    expect(ok('completed', 'completed')).toBe(true);
  });

  it('a recorded UIT does not change', async () => {
    const { evaluateTransitionRule } = await import(join(ENGINE, 'lib/validation-engine.js'));
    const ok = (prev: string | null, next: string | null) =>
      evaluateTransitionRule(rule('uit'), next, prev, 'text').status === 'passed';
    expect(ok(null, 'RO123')).toBe(true);
    expect(ok('', 'RO123')).toBe(true);
    expect(ok('RO123', 'RO123')).toBe(true);
    expect(ok('RO123', 'RO999')).toBe(false);
    expect(ok('RO123', null)).toBe(false);
  });
});
