// The publish actions over an in-memory data API. What the data API checks (the
// rules on `apidoc_changelogs`, `writtenBy`, `expect`) is tested in the engine;
// this proves what each action writes and the precondition it sends.
import { describe, expect, it } from 'bun:test';
import { apiDocsActions as a } from './actions';

function fakeHost() {
  const calls: unknown[][] = [];
  const host = {
    timezone: 'Europe/Bucharest',
    enqueue: async () => '',
    collections: {
      update: async (...args: unknown[]) => {
        calls.push(args);
        return {};
      },
    },
  };
  return { host: host as never, calls };
}

describe('publish', () => {
  it('stamps today in the tenant zone, only on an unpublished entry', async () => {
    const { host, calls } = fakeHost();
    await a.publish({ id: 'c1' }, host);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date());
    expect(calls).toEqual([
      ['apidoc_changelogs', 'c1', { is_published: true, published_at: today }, { expect: { is_published: [false] } }],
    ]);
  });
});

describe('unpublish', () => {
  it('clears the flag, only on a published entry', async () => {
    const { host, calls } = fakeHost();
    await a.unpublish({ id: 'c1' }, host);
    expect(calls).toEqual([
      ['apidoc_changelogs', 'c1', { is_published: false }, { expect: { is_published: [true] } }],
    ]);
  });
});
