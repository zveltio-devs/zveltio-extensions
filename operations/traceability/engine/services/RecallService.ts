import { sql } from 'kysely';
import { TraceTreeService, type DownstreamResult } from './TraceTreeService.js';

export interface RecallSimulation {
  is_simulation: true;
  origin_lot_id: string;
  affected_lots: unknown[];
  affected_customers: unknown[];
  total_lots_affected: number;
  total_customers_affected: number;
  recommended_action: string;
}

export class RecallService {
  private traceTree: TraceTreeService;

  constructor(private db: any) {
    this.traceTree = new TraceTreeService(db);
  }

  async simulateRecall(lotId: string): Promise<RecallSimulation> {
    const downstream = await this.traceTree.traceDownstream(lotId);
    return {
      is_simulation: true,
      ...downstream,
      recommended_action: this.determineAction(downstream),
    };
  }

  async initiateRecall(params: {
    lotId: string;
    reason: string;
    scope: 'internal' | 'market_withdrawal' | 'consumer_recall';
    initiatedBy: string;
  }) {
    const downstream = await this.traceTree.traceDownstream(params.lotId);
    const affectedIds = [params.lotId, ...downstream.affected_lots.map((l: any) => l.output_lot_id)];

    await sql`
      UPDATE trace_lots
      SET status = 'recalled'
      WHERE id = ANY(${affectedIds}::uuid[])
    `.execute(this.db);

    const recallResult = await sql`
      INSERT INTO trace_recalls (lot_id, scope, reason, initiated_by, initiated_at, affected_downstream_lots, status)
      VALUES (
        ${params.lotId},
        ${params.scope},
        ${params.reason},
        ${params.initiatedBy},
        now(),
        ${JSON.stringify(downstream.affected_lots)}::jsonb,
        'active'
      )
      RETURNING *
    `.execute(this.db);

    return recallResult.rows[0];
  }

  async resolveRecall(recallId: string, resolvedBy: string, resolutionNotes: string) {
    const result = await sql`
      UPDATE trace_recalls
      SET status = 'resolved', resolved_by = ${resolvedBy}, resolved_at = now(), resolution_notes = ${resolutionNotes}
      WHERE id = ${recallId} AND status = 'active'
      RETURNING *
    `.execute(this.db);
    if (!result.rows.length) throw new Error('Recall negăsit sau deja rezolvat / Recall not found or already resolved');
    return result.rows[0];
  }

  private determineAction(downstream: DownstreamResult): string {
    if (downstream.affected_customers.length > 0) return 'consumer_recall';
    if (downstream.affected_lots.some((l: any) => l.status === 'available')) return 'market_withdrawal';
    return 'internal';
  }
}
