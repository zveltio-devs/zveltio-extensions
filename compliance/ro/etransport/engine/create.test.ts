// `create` opens a draft with its goods and their summed weight; the input's
// other fields pass through as given.
import { describe, expect, it } from 'bun:test';
import { etransportActions } from './actions.js';

describe('create', () => {
  it('inserts a draft whose total weight is the sum of its goods', async () => {
    const calls: [string, Record<string, unknown>][] = [];
    const host = {
      collections: {
        insert: async (c: string, row: Record<string, unknown>) => {
          calls.push([c, row]);
          return { id: 'x', ...row };
        },
      },
    } as never;
    const goods = [
      { description: 'Steel', weight_kg: 1200.5 },
      { description: 'Bolts', weight_kg: 0.25 },
      { description: 'Labels' },
    ];
    await etransportActions.create({ vehicle_plate: 'B-01-ABC', status: 'declared', goods }, host);
    expect(calls).toEqual([
      [
        'etransport_declarations',
        { vehicle_plate: 'B-01-ABC', goods, total_weight_kg: 1200.75, status: 'draft' },
      ],
    ]);
  });
});
