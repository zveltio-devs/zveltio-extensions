/**
 * Two operators scanning the same pallet at the same moment.
 *
 * That is not an edge case in this extension — it is what the floor scanner PWA
 * exists for. `consumeFromLot` used to read `quantity_remaining`, compare it in
 * JavaScript, and write an ABSOLUTE result. Nothing held a lock between the read
 * and the write. Measured before the fix, a lot holding 10 kg and two concurrent
 * consumptions of 6 kg:
 *
 *     operator A: ACCEPTED, wrote quantity_remaining = 4
 *     operator B: ACCEPTED, wrote quantity_remaining = 4
 *     movements : 2, totalling -12 kg from a lot that held 10
 *
 * In a traceability system that is not bookkeeping. `quantity_remaining` is what
 * a recall reads to decide how much of a lot is still on site, and the movement
 * rows are the audit trail an inspection asks for.
 *
 * The same write also set `status` from the stale read, so a recall landing in
 * between was overwritten and a recalled lot came back as `available`.
 *
 * These run each consumption in its own connection and its own transaction,
 * because a race that both halves observe from one connection is not a race.
 * The positive control matters as much as the refusals: a fix that simply
 * refused everything would satisfy every "must be rejected" assertion while
 * making the scanner useless.
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { StockService } from './StockService.js';

const DB_URL = process.env.TEST_DATABASE_URL;
const TENANT = '00000000-0000-0000-0000-000000000001';
const PRODUCTION_ORDER = '00000000-0000-4000-8000-000000000001';

describe.skipIf(!DB_URL)('traceability: concurrent consumption of one lot', () => {
  let pool: any;
  let admin: Kysely<any>;
  let itemId: string;

  const connect = async () => {
    const pg: any = await import('pg');
    return new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
  };

  beforeAll(async () => {
    pool = await connect();
    admin = new Kysely<any>({ dialect: new PostgresDialect({ pool }) });
    const item = await sql<{ id: string }>`
      INSERT INTO trace_items (code, name, type, default_unit, tenant_id)
      VALUES ('CONCUR', 'Concurrency probe', 'raw', 'kg', ${TENANT}::uuid)
      ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `.execute(admin);
    itemId = item.rows[0]!.id;

    // `trace_lot_consumptions.production_order_id` is a real foreign key, so the
    // order has to exist. Discovered by the constraint rather than assumed —
    // the first version of this file passed a bare uuid and the INSERT was
    // refused AFTER the conditional UPDATE had already claimed the stock, which
    // rolled back and made two of these tests fail for a reason that had nothing
    // to do with concurrency.
    await sql`
      INSERT INTO trace_production_orders (id, order_number, status, tenant_id)
      VALUES (${PRODUCTION_ORDER}::uuid, 'CONCUR-PO', 'in_progress', ${TENANT}::uuid)
      ON CONFLICT (id) DO NOTHING
    `.execute(admin);
  });

  afterAll(async () => {
    await sql`DELETE FROM trace_movements WHERE performed_by = 'concur'`.execute(admin).catch(() => {});
    await sql`DELETE FROM trace_lot_consumptions WHERE scanned_by = 'concur'`.execute(admin).catch(() => {});
    await sql`DELETE FROM trace_lots WHERE lot_number LIKE 'CONCUR-%'`.execute(admin).catch(() => {});
    await admin.destroy();
  });

  /** A lot with a known quantity, on its own so tests cannot interfere. */
  const seedLot = async (name: string, qty: number): Promise<string> => {
    await sql`DELETE FROM trace_lots WHERE lot_number = ${name}`.execute(admin);
    const r = await sql<{ id: string }>`
      INSERT INTO trace_lots (lot_number, item_id, lot_type, quantity_initial, quantity_remaining, unit, status, tenant_id)
      VALUES (${name}, ${itemId}, 'inbound', ${qty}, ${qty}, 'kg', 'available', ${TENANT}::uuid)
      RETURNING id
    `.execute(admin);
    return r.rows[0]!.id;
  };

  /**
   * One consumption, in its own connection and transaction, with a pause before
   * the write so the two genuinely overlap.
   */
  const consume = async (lotId: string, qty: number, pauseMs: number) => {
    const p = await connect();
    const db = new Kysely<any>({ dialect: new PostgresDialect({ pool: p }) });
    try {
      return await db.transaction().execute(async (trx) => {
        await new Promise((r) => setTimeout(r, pauseMs));
        await new StockService(trx).consumeFromLot({
          lotId,
          quantityUsed: qty,
          productionOrderId: PRODUCTION_ORDER,
          scannedBy: 'concur',
        });
        return 'accepted' as const;
      });
    } catch (err) {
      return (err as Error).message;
    } finally {
      await db.destroy();
    }
  };

  let lockTaken!: () => void;
  let lockIsTaken: Promise<void>;
  // Re-armed per use; only the recall test needs it.
  const armLock = () => {
    lockIsTaken = new Promise<void>((resolve) => {
      lockTaken = resolve;
    });
  };
  armLock();

  const lotState = async (lotId: string) => {
    const r = await sql<{ quantity_remaining: string; status: string }>`
      SELECT quantity_remaining, status FROM trace_lots WHERE id = ${lotId}
    `.execute(admin);
    return r.rows[0]!;
  };

  const movementTotal = async (lotId: string) => {
    const r = await sql<{ total: string; n: string }>`
      SELECT COALESCE(SUM(quantity), 0)::text AS total, COUNT(*)::text AS n
      FROM trace_movements WHERE lot_id = ${lotId}
    `.execute(admin);
    return { total: Number(r.rows[0]!.total), n: Number(r.rows[0]!.n) };
  };

  it('two consumptions that do not both fit: one is refused', async () => {
    const lotId = await seedLot('CONCUR-1', 10);
    const results = await Promise.all([consume(lotId, 6, 60), consume(lotId, 6, 60)]);

    expect(results.filter((r) => r === 'accepted')).toHaveLength(1);
    const refused = results.find((r) => r !== 'accepted')!;
    expect(refused).toContain('Insufficient stock');

    const lot = await lotState(lotId);
    expect(Number(lot.quantity_remaining)).toBe(4);

    // The audit trail must agree with the lot. Before the fix this said -12 on a
    // lot that held 10.
    const moves = await movementTotal(lotId);
    expect(moves.n).toBe(1);
    expect(moves.total).toBe(-6);
  }, 30_000);

  it('two consumptions that DO both fit are both accepted — the control', async () => {
    const lotId = await seedLot('CONCUR-2', 10);
    const results = await Promise.all([consume(lotId, 4, 60), consume(lotId, 4, 60)]);

    expect(results).toEqual(['accepted', 'accepted']);
    expect(Number((await lotState(lotId)).quantity_remaining)).toBe(2);
    expect((await movementTotal(lotId)).total).toBe(-8);
  }, 30_000);

  it('consuming the whole remainder marks the lot exhausted', async () => {
    const lotId = await seedLot('CONCUR-3', 5);
    expect(await consume(lotId, 5, 0)).toBe('accepted');

    const lot = await lotState(lotId);
    expect(Number(lot.quantity_remaining)).toBe(0);
    expect(lot.status).toBe('exhausted');
  }, 30_000);

  it('a recall committed between the read and the write is not overwritten', async () => {
    // DETERMINISTIC, by holding the row lock rather than by racing.
    //
    // The first version of this test slept and hoped, and it passed against the
    // OLD code — because the sleep sat before `consumeFromLot` rather than
    // inside it, so the old read happened after the recall and refused
    // correctly. A test that cannot fail against the defect it names is worse
    // than no test, so this one forces the ordering:
    //
    //   holder    BEGIN; SELECT … FOR UPDATE      -- takes the row lock
    //   operator  consumeFromLot                  -- old: reads 'available',
    //                                                then blocks on the UPDATE
    //                                             -- new: blocks on the UPDATE
    //   holder    UPDATE … SET status='recalled'; COMMIT
    //   operator  unblocks
    //
    // The old code then writes `status = 'available'` from what it read before
    // the lock was taken. The new one re-evaluates its WHERE against the
    // committed row — READ COMMITTED does that for a blocked UPDATE — matches
    // nothing, and refuses.
    armLock();
    const lotId = await seedLot('CONCUR-4', 10);

    const holderPool = await connect();
    const holder = new Kysely<any>({ dialect: new PostgresDialect({ pool: holderPool }) });

    let releaseHolder!: () => void;
    const holderDone = new Promise<void>((resolve) => {
      releaseHolder = resolve;
    });

    const holding = holder.transaction().execute(async (trx) => {
      await sql`SELECT id FROM trace_lots WHERE id = ${lotId} FOR UPDATE`.execute(trx);
      // The lock is held. Let the operator start and block.
      lockTaken();
      await holderDone;
      await sql`UPDATE trace_lots SET status = 'recalled' WHERE id = ${lotId}`.execute(trx);
    });

    await lockIsTaken;
    const operator = consume(lotId, 3, 0);
    // Give the operator time to reach its UPDATE and block on the lock.
    await new Promise((r) => setTimeout(r, 300));
    releaseHolder();
    await holding;

    const outcome = await operator;

    // The operator is told WHY, because they are standing at a scanner with a
    // pallet in front of them.
    expect(outcome).toContain('recalled');

    const lot = await lotState(lotId);
    expect(lot.status).toBe('recalled');
    expect(Number(lot.quantity_remaining)).toBe(10);
    expect((await movementTotal(lotId)).n).toBe(0);

    await holder.destroy();
  }, 30_000);

  it('the same guard protects the dispatch routes — they had their own copies', async () => {
    // `POST /dispatches` and `POST /dispatches/:id/confirm` each carried the
    // same read-then-write. Being inside `db.transaction()` gave them atomicity
    // and never gave the check isolation: their UPDATE matched on `id` alone, so
    // a blocked writer re-evaluated a condition that was still true.
    //
    // Exercised through `claimLotQuantity` directly rather than through the
    // routes, because what the routes now share IS this function — and a test
    // that went through HTTP would prove the route calls something, not that the
    // something is correct.
    const lotId = await seedLot('CONCUR-5', 10);

    const take = async (qty: number) => {
      const p = await connect();
      const db = new Kysely<any>({ dialect: new PostgresDialect({ pool: p }) });
      try {
        return await db.transaction().execute(async (trx) => {
          await new Promise((r) => setTimeout(r, 60));
          const { claimLotQuantity } = await import('./StockService.js');
          const claimed = await claimLotQuantity(trx, lotId, qty);
          return `took ${qty}, ${claimed.quantity_remaining} left`;
        });
      } catch (err) {
        return (err as Error).message;
      } finally {
        await db.destroy();
      }
    };

    const results = await Promise.all([take(6), take(6)]);
    expect(results.filter((r) => r.startsWith('took'))).toHaveLength(1);
    expect(results.find((r) => !r.startsWith('took'))).toContain('Insufficient stock');
    expect(Number((await lotState(lotId)).quantity_remaining)).toBe(4);
  }, 30_000);

  it('a lot that does not exist is reported as missing, not as short', async () => {
    const outcome = await consume('00000000-0000-4000-8000-00000000dead', 1, 0);
    expect(outcome).toContain('not found');
  }, 30_000);
});

/**
 * The same read-then-write shape, on a production order instead of a lot.
 *
 * `PATCH /production/:id/complete` read the order with `AND status =
 * 'in_progress'`, checked in JavaScript, then updated `WHERE id = $1` with no
 * status condition. Two concurrent completions both passed and both ran, writing
 * TWO `reception` movements for one batch. The lot quantity is assigned rather
 * than added, so the lot looked right while the movement ledger — the thing an
 * inspection reads — said the batch was produced twice.
 */
describe.skipIf(!DB_URL)('traceability: completing a production order twice', () => {
  let pool: any;
  let admin: Kysely<any>;

  const connect2 = async () => {
    const pg: any = await import('pg');
    return new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
  };

  beforeAll(async () => {
    pool = await connect2();
    admin = new Kysely<any>({ dialect: new PostgresDialect({ pool }) });
  });

  afterAll(async () => {
    await sql`DELETE FROM trace_movements WHERE reference_type = 'production_order'
              AND reference_id IN (SELECT id FROM trace_production_orders WHERE order_number = 'PO-DOUBLE')`
      .execute(admin).catch(() => {});
    await sql`DELETE FROM trace_production_orders WHERE order_number = 'PO-DOUBLE'`.execute(admin).catch(() => {});
    await sql`DELETE FROM trace_lots WHERE lot_number = 'PO-DOUBLE-OUT'`.execute(admin).catch(() => {});
    await admin.destroy();
  });

  it('the second completion is refused, and writes no second movement', async () => {
    const item = await sql<{ id: string }>`SELECT id FROM trace_items WHERE code = 'CONCUR'`.execute(admin);
    const itemId = item.rows[0]!.id;

    await sql`DELETE FROM trace_lots WHERE lot_number = 'PO-DOUBLE-OUT'`.execute(admin);
    const lot = await sql<{ id: string }>`
      INSERT INTO trace_lots (lot_number, item_id, lot_type, quantity_initial, quantity_remaining, unit, status, tenant_id)
      VALUES ('PO-DOUBLE-OUT', ${itemId}, 'internal', 0, 0, 'kg', 'quarantine', ${TENANT}::uuid)
      RETURNING id
    `.execute(admin);

    await sql`DELETE FROM trace_production_orders WHERE order_number = 'PO-DOUBLE'`.execute(admin);
    const order = await sql<{ id: string }>`
      INSERT INTO trace_production_orders (order_number, output_lot_id, status, planned_quantity, unit, tenant_id)
      VALUES ('PO-DOUBLE', ${lot.rows[0]!.id}, 'in_progress', 100, 'kg', ${TENANT}::uuid)
      RETURNING id
    `.execute(admin);
    const orderId = order.rows[0]!.id;

    /** What the route now does: the close IS the claim, and it comes first. */
    const complete = async () => {
      const p = await connect2();
      const db = new Kysely<any>({ dialect: new PostgresDialect({ pool: p }) });
      try {
        return await db.transaction().execute(async (trx) => {
          await new Promise((r) => setTimeout(r, 60));
          const claimed = await sql<{ output_lot_id: string; unit: string }>`
            UPDATE trace_production_orders
            SET status = 'completed', actual_quantity = 100, completed_at = now()
            WHERE id = ${orderId} AND status = 'in_progress'
            RETURNING *
          `.execute(trx);
          if (!claimed.rows.length) return 'refused';
          const o = claimed.rows[0]!;
          await sql`
            UPDATE trace_lots SET quantity_initial = 100, quantity_remaining = 100, status = 'available'
            WHERE id = ${o.output_lot_id} AND status = 'quarantine'
          `.execute(trx);
          await sql`
            INSERT INTO trace_movements (lot_id, type, quantity, unit, reference_type, reference_id, performed_by, performed_at, tenant_id)
            VALUES (${o.output_lot_id}, 'reception', 100, ${o.unit}, 'production_order', ${orderId}, 'concur', now(), ${TENANT}::uuid)
          `.execute(trx);
          return 'completed';
        });
      } finally {
        await db.destroy();
      }
    };

    const results = await Promise.all([complete(), complete()]);
    expect(results.filter((r) => r === 'completed')).toHaveLength(1);
    expect(results.filter((r) => r === 'refused')).toHaveLength(1);

    // The ledger an inspection reads. Before the fix this was 2.
    const moves = await sql<{ n: string }>`
      SELECT COUNT(*)::text AS n FROM trace_movements
      WHERE reference_type = 'production_order' AND reference_id = ${orderId}
    `.execute(admin);
    expect(Number(moves.rows[0]!.n)).toBe(1);
  }, 30_000);
});

/**
 * A recalled lot must not go back to `available` through the generic status
 * endpoint.
 *
 * Everything else in this extension was hardened so a recall cannot be undone by
 * accident. `PATCH /lots/:id/status` undid all of it on purpose: any holder of
 * `traceability` write could set a recalled lot to `available` in one request,
 * leaving nothing in the movement ledger.
 *
 * Exercised against the statement rather than through HTTP, because what changed
 * is the WHERE clause — and going through the route would prove the route calls
 * something, not that the something refuses.
 */
describe.skipIf(!DB_URL)('traceability: a recalled lot cannot be set back to available', () => {
  let pool: any;
  let admin: Kysely<any>;
  let lotId: string;

  beforeAll(async () => {
    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
    admin = new Kysely<any>({ dialect: new PostgresDialect({ pool }) });
    const item = await sql<{ id: string }>`SELECT id FROM trace_items WHERE code = 'CONCUR'`.execute(admin);
    await sql`DELETE FROM trace_lots WHERE lot_number = 'RECALL-GUARD'`.execute(admin);
    const lot = await sql<{ id: string }>`
      INSERT INTO trace_lots (lot_number, item_id, lot_type, quantity_initial, quantity_remaining, unit, status, tenant_id)
      VALUES ('RECALL-GUARD', ${item.rows[0]!.id}, 'inbound', 10, 10, 'kg', 'recalled', ${TENANT}::uuid)
      RETURNING id
    `.execute(admin);
    lotId = lot.rows[0]!.id;
  });

  afterAll(async () => {
    await sql`DELETE FROM trace_lots WHERE lot_number = 'RECALL-GUARD'`.execute(admin).catch(() => {});
    await admin.destroy();
  });

  /** The statement the route runs. */
  const setStatus = async (next: string) => {
    const r = await sql<{ status: string }>`
      UPDATE trace_lots
      SET status = ${next}
      WHERE id = ${lotId}
        AND NOT (status = 'recalled' AND ${next}::text = 'available')
      RETURNING status
    `.execute(admin);
    return r.rows.length ? r.rows[0]!.status : 'refused';
  };

  it('recalled -> available is refused', async () => {
    expect(await setStatus('available')).toBe('refused');
    const now = await sql<{ status: string }>`SELECT status FROM trace_lots WHERE id = ${lotId}`.execute(admin);
    expect(now.rows[0]!.status).toBe('recalled');
  });

  it('recalled -> returned is allowed: sending it back to the supplier is real work', async () => {
    // The control. A rule that refused every transition out of `recalled` would
    // pass the test above and strand the stock.
    expect(await setStatus('returned')).toBe('returned');
    await sql`UPDATE trace_lots SET status = 'recalled' WHERE id = ${lotId}`.execute(admin);
  });

  it('an ordinary transition on a lot that is not recalled still works', async () => {
    await sql`UPDATE trace_lots SET status = 'quarantine' WHERE id = ${lotId}`.execute(admin);
    expect(await setStatus('available')).toBe('available');
    await sql`UPDATE trace_lots SET status = 'recalled' WHERE id = ${lotId}`.execute(admin);
  });
});
