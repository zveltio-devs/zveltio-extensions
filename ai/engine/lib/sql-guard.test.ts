/**
 * `validateGeneratedSQL` is the only thing between a language model's output and
 * the database. These tests are written so that they FAIL against the code as it
 * was before this change — checked by reverting `tableReferences` to its
 * single-identifier form and re-running, which turns every case in
 * "table allowlist — the comma-separated FROM list" red.
 *
 * The tables named in those cases are the real ones: `user`, `session` and
 * `account` are Better-Auth's, they carry password hashes and live bearer
 * tokens, they have no prefix and no RLS, and the allowlist is the only thing
 * that keeps a generated query away from them.
 */

import { describe, expect, test } from 'bun:test';
import { validateGeneratedSQL } from './sql-guard.js';

const cols = [{ name: 'products' }, { name: 'orders' }];
const check = (sql: string) => validateGeneratedSQL(sql, cols);

describe('validateGeneratedSQL — statement shape', () => {
  test('only SELECT is admitted', () => {
    expect(check('DELETE FROM zvd_products').safe).toBe(false);
    expect(check('SELECT * FROM zvd_products').safe).toBe(true);
  });

  test('a second statement is refused', () => {
    expect(check('SELECT * FROM zvd_products; DROP TABLE zvd_products').safe).toBe(false);
  });

  test('a semicolon inside a string literal is not a second statement', () => {
    expect(check("SELECT * FROM zvd_products WHERE name = 'a;b'").safe).toBe(true);
  });
});

describe('table allowlist — the comma-separated FROM list', () => {
  // Each of these was ALLOWED before this change, with refs=[zvd_products].
  test('a comma join to the Better-Auth user table is refused', () => {
    const r = check('SELECT u.email FROM zvd_products p, "user" u LIMIT 10');
    expect(r.safe).toBe(false);
    expect(r.reason).toContain('user');
  });

  test('a comma join to session is refused', () => {
    expect(check('SELECT s.token FROM zvd_products p, session s').safe).toBe(false);
  });

  test('three-way comma list — every item is checked, not just the first', () => {
    const r = check('SELECT * FROM zvd_products, account, verification');
    expect(r.safe).toBe(false);
  });

  test('an unpermitted table in the middle of the list is caught', () => {
    expect(check('SELECT * FROM zvd_products, "user", zvd_orders').safe).toBe(false);
  });

  test('the forms that were already refused stay refused', () => {
    expect(check('SELECT * FROM "user"').safe).toBe(false);
    expect(check('SELECT * FROM zvd_products p CROSS JOIN "user" u').safe).toBe(false);
    expect(check('SELECT * FROM zvd_products WHERE id IN (SELECT id FROM "user")').safe).toBe(false);
    expect(check('SELECT (SELECT token FROM session LIMIT 1) FROM zvd_products').safe).toBe(false);
  });
});

describe('table allowlist — legitimate queries still run', () => {
  test('a comma join between two permitted collections is allowed', () => {
    expect(check('SELECT * FROM zvd_products p, zvd_orders o WHERE p.id = o.product_id').safe).toBe(true);
  });

  test('an explicit JOIN between two permitted collections is allowed', () => {
    expect(check('SELECT * FROM zvd_products p JOIN zvd_orders o ON o.product_id = p.id').safe).toBe(true);
  });

  test('aliases, quoting and public. qualification do not confuse the scanner', () => {
    expect(check('SELECT * FROM public.zvd_products AS p, "zvd_orders" o').safe).toBe(true);
  });

  test('a subquery over a permitted collection is allowed', () => {
    expect(check('SELECT * FROM zvd_products WHERE id IN (SELECT product_id FROM zvd_orders)').safe).toBe(true);
  });

  test('aggregation with GROUP BY / ORDER BY / LIMIT is allowed', () => {
    expect(
      check('SELECT p.id, COUNT(*) AS n FROM zvd_products p, zvd_orders o WHERE p.id = o.product_id GROUP BY p.id ORDER BY n DESC LIMIT 10').safe,
    ).toBe(true);
  });
});

describe('table allowlist — a shape the scanner cannot read is refused, not skipped', () => {
  test('an item with no leading identifier is refused rather than ignored', () => {
    const r = check('SELECT * FROM zvd_products, 42');
    expect(r.safe).toBe(false);
    expect(r.reason).toContain('Could not read');
  });
});

describe('other schemas and system catalogs', () => {
  test('a non-public schema is refused', () => {
    expect(check('SELECT * FROM pgcatalog.zvd_products').safe).toBe(false);
  });

  test('information_schema is refused', () => {
    expect(check('SELECT * FROM information_schema.tables').safe).toBe(false);
  });
});
