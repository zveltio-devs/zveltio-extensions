import { describe, expect, it } from 'bun:test';
import { analyze } from './lib/data-quality';

describe('analyze — a check that cannot run says so', () => {
  it('lists the outlier check on a field with too few values, and the AI check with no provider', async () => {
    const rows = [1, 2, 3].map((n) => ({ id: String(n), qty: n }));
    const { issues, skipped } = await analyze(rows, 'full', 'c', undefined);
    expect(issues).toEqual([]);
    expect(skipped).toEqual(['outliers on "qty": 3 values, at least 11 needed', 'normalization: no AI provider installed']);
  });

  it('finds the outlier once there are enough values', async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ id: String(i), qty: i === 11 ? 1000 : 10 + (i % 2) }));
    const { issues, skipped } = await analyze(rows, 'anomalies', 'c', undefined);
    expect(issues.map((i) => i.record_ids)).toEqual([['11']]);
    expect(skipped).toEqual([]);
  });
});
