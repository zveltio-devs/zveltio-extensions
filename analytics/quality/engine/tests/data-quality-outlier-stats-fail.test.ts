/**
 * data-quality.ts — outlier detector skips a field when stats query throws.
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { DDLManager, scanWith, serviceRegistry } from './harness.js';

let runQualityScan: ReturnType<typeof scanWith>;
import { CannedDb } from './fixtures/canned-db.js';

const SCAN_ID = '00000000-0000-4000-8000-00000000c0de';

function setup(collection: string, fields: unknown[]): CannedDb {
  const db = new CannedDb();
  db.when(/insert into "zv_quality_scans"/, [{ id: SCAN_ID, collection, status: 'running' }]);
  db.when(/select \* from "zvd_collections" where "name" = /, [
    { name: collection, fields: JSON.stringify(fields) },
  ]);
  runQualityScan = scanWith(db);
  return db;
}

function asDb(db: CannedDb): unknown {
  return db.kysely;
}

async function awaitScanEnd(db: CannedDb) {
  return db.waitFor(/update "zv_quality_scans" set/);
}

beforeEach(() => DDLManager.invalidateCache());

afterEach(() => {});

describe('outlier detection — stats query failure', () => {
  it('continues when AVG query throws for a numeric field', async () => {
    const fields = [
      { name: 'amount', type: 'number' },
      { name: 'score', type: 'number' },
    ];
    const db = setup('orders', fields);
    db.fail(/AVG\("amount"/, new Error('numeric field amount unavailable'));
    db.when(/AVG\("score"/, [{ avg: '10', stddev: '2', min: '5', max: '20' }]);
    db.when(/ABS\("score"/, [{ id: 's1', value: '99' }]);

    await runQualityScan(
      asDb(db),
      'orders',
      'anomalies',
      'user-1',
      undefined,
      '00000000-0000-0000-0000-0000000000aa',
    );
    await awaitScanEnd(db);

    const inserts = db.executed(/insert into "zv_quality_issues"/);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]!.parameters.join('|')).toContain('score');
    expect(db.executed(/ABS\("amount"/)).toHaveLength(0);
  });
});
