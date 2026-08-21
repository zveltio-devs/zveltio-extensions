/**
 * Dashboard briefing — who owes money — owned by CRM, not the engine.
 *
 * Uses `status` (CRM schema). Soft-fails to zeroes when the table is missing
 * or reshaped so a bare dashboard never 500s.
 */
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

export interface OverdueBucket {
  currency: string;
  count: number;
  total: number;
}

export interface Receivables {
  overdue: OverdueBucket[];
  oldestOverdueDays: number | null;
  dueSoon: OverdueBucket[];
}

const SETTLED = ['completed', 'cancelled', 'refunded'];

export async function receivables(db: ExtensionContext['db']): Promise<Receivables> {
  const empty: Receivables = { overdue: [], oldestOverdueDays: null, dueSoon: [] };
  try {
    const settled = SETTLED.map((s) => sql`${s}`);
    const overdue = await sql<{ currency: string; count: number; total: number }>`
      SELECT currency,
             count(*)::int          AS count,
             COALESCE(sum(total_amount), 0)::float8 AS total
        FROM zvd_transactions
       WHERE type = 'invoice'
         AND due_date IS NOT NULL
         AND due_date < CURRENT_DATE
         AND status NOT IN (${sql.join(settled)})
       GROUP BY currency
       ORDER BY total DESC
    `.execute(db);

    const oldest = await sql<{ days: number | null }>`
      SELECT (CURRENT_DATE - min(due_date))::int AS days
        FROM zvd_transactions
       WHERE type = 'invoice'
         AND due_date IS NOT NULL
         AND due_date < CURRENT_DATE
         AND status NOT IN (${sql.join(settled)})
    `.execute(db);

    const soon = await sql<{ currency: string; count: number; total: number }>`
      SELECT currency,
             count(*)::int          AS count,
             COALESCE(sum(total_amount), 0)::float8 AS total
        FROM zvd_transactions
       WHERE type = 'invoice'
         AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
         AND status NOT IN (${sql.join(settled)})
       GROUP BY currency
       ORDER BY total DESC
    `.execute(db);

    return {
      overdue: overdue.rows,
      oldestOverdueDays: oldest.rows[0]?.days ?? null,
      dueSoon: soon.rows,
    };
  } catch {
    return empty;
  }
}
