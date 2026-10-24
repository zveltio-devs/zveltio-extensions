// A widget that reports on the tenant needs the engine object `admin`, never
// a bare name: a bare Casbin object is a collection (ADR 0002). A collection
// named `audit`, `users` or `collections` hands every member `read` on that
// name through the default member grants, and that must not reveal a widget.
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('analytics/dashboard — tenant widgets need admin', () => {
  const widgets = async (opts: Parameters<typeof mountForTest>[1]) => {
    const { app } = await mountForTest(import.meta.dir, opts);
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      widgets: string[];
      available: string[];
      data: Record<string, unknown>;
    };
    // What the caller may see: shown, or offered to add.
    const visible = [...body.widgets, ...body.available].sort();
    return { visible, data: Object.keys(body.data).sort() };
  };

  it('a member with read on collections named like the old gates sees no tenant widget', async () => {
    const grants = ['audit', 'users', 'collections'].map((resource) => ({ resource, action: 'read' }));
    const { visible, data } = await widgets({ admin: false, grants });
    expect(visible).toEqual(['trust', 'welcome']);
    // Data is computed for the shown widgets only, never for one not visible.
    expect(data.filter((id) => !visible.includes(id))).toEqual([]);
  });

  it('an admin sees every widget', async () => {
    const { visible } = await widgets({ admin: true });
    expect(visible).toEqual(['activity', 'data', 'health', 'people', 'trust', 'welcome']);
  });
});
