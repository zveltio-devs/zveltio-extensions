import { describe, expect, it } from 'bun:test';
import { PAGE } from './page.js';
import { buildPostman, buildSpec } from './spec.js';

const readable = [
  {
    name: 'invoices',
    display_name: 'Invoices',
    fields: [
      { name: 'number', type: 'text', required: true },
      { name: 'total', type: 'decimal', readonly: true },
      { name: 'labels', type: 'tags' },
      { name: 'meta', type: 'json' },
    ],
  },
];

describe('developer/api-docs spec', () => {
  it('documents exactly the collections and fields it is given', () => {
    const spec = buildSpec(readable, 'https://x.test');
    expect(Object.keys(spec.paths).sort()).toEqual(['/api/data/invoices', '/api/data/invoices/{id}']);
    const props = spec.components.schemas.Invoices.properties;
    expect(Object.keys(props).sort()).toEqual(['created_at', 'id', 'labels', 'meta', 'number', 'total', 'updated_at']);
    expect(props.total).toEqual({ type: 'number', readOnly: true });
    expect(props.labels).toEqual({ type: 'array', items: { type: 'string' } });
    expect(props.meta).toEqual({});
    expect(spec.components.schemas.Invoices.required).toEqual(['number']);
    expect(buildSpec([], 'https://x.test').paths).toEqual({});
  });

  it('serialises into a page that still runs', async () => {
    const script = PAGE.split('<script>')[1]!.split('window.onload')[0]!;
    // The page's own copies, not the imports: proves toString() kept them self-contained.
    const page = new Function(`${script} return { buildSpec, buildPostman };`)();
    const spec = page.buildSpec(readable, 'https://x.test');
    expect(spec).toEqual(buildSpec(readable, 'https://x.test'));
    expect(page.buildPostman(spec).item[1].item[0].request.url.raw).toBe('{{baseUrl}}/api/data/invoices/:id');
    expect(buildPostman(spec)).toEqual(page.buildPostman(spec));
  });
});
