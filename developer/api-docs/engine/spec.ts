/**
 * The OpenAPI document, built in the visitor's browser from `GET /api/data`.
 *
 * `GET /api/data` answers with the collections the CALLER may read, and only
 * the fields they may read — the engine's gates, not this extension's. 1.x
 * built the spec on the server from every collection's definition, so any
 * signed-in member read the name and fields of collections the data API hides
 * from them, and the extension needed its own public/private switch to decide
 * who saw that. Built from the caller's own answer, the spec cannot name more
 * than the data API already shows them, and a visitor without a session or an
 * API key sees nothing.
 *
 * Both functions are serialised into the page with `Function.prototype
 * .toString()`, so they must stay self-contained: no imports, no reference to
 * anything outside their own body.
 */

export interface ReadableField {
  name: string;
  type: string;
  description?: string | null;
  required?: boolean;
  readonly?: boolean;
}

export interface ReadableCollection {
  name: string;
  display_name?: string | null;
  fields: ReadableField[];
}

// biome-ignore lint/suspicious/noExplicitAny: an OpenAPI document is free-form JSON.
type Json = Record<string, any>;

export function buildSpec(collections: ReadableCollection[], baseUrl: string): Json {
  const FORMATS: Record<string, [string, string?]> = {
    email: ['string', 'email'],
    url: ['string', 'uri'],
    decimal: ['number'],
    number: ['number'],
    float: ['number'],
    integer: ['integer'],
    boolean: ['boolean'],
    date: ['string', 'date'],
    datetime: ['string', 'date-time'],
    uuid: ['string', 'uuid'],
    reference: ['string', 'uuid'],
    file: ['string', 'uuid'],
  };
  const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };
  const ref = (t: string) => ({ $ref: `#/components/schemas/${t}` });
  const body = (t: string) => ({ required: true, content: { 'application/json': { schema: ref(t) } } });
  const paths: Json = {};
  const schemas: Json = {};
  const tags: Json[] = [];

  for (const col of collections) {
    const tag = col.display_name || col.name;
    const typeName = col.name.charAt(0).toUpperCase() + col.name.slice(1);
    const properties: Json = {
      id: { type: 'string', format: 'uuid', readOnly: true },
      created_at: { type: 'string', format: 'date-time', readOnly: true },
      updated_at: { type: 'string', format: 'date-time', readOnly: true },
    };
    const required: string[] = [];
    for (const f of col.fields) {
      const [type, format] = FORMATS[f.type] ?? ['string'];
      // `json` holds any JSON value, so it carries no type; `tags` is a text[].
      const shape =
        f.type === 'json'
          ? {}
          : f.type === 'tags'
            ? { type: 'array', items: { type: 'string' } }
            : { type, ...(format ? { format } : {}) };
      properties[f.name] = {
        ...shape,
        ...(f.description ? { description: f.description } : {}),
        ...(f.readonly ? { readOnly: true } : {}),
      };
      if (f.required) required.push(f.name);
    }
    schemas[typeName] = { type: 'object', properties, ...(required.length ? { required } : {}) };
    tags.push({ name: tag });

    paths[`/api/data/${col.name}`] = {
      get: {
        summary: `List ${tag}`,
        tags: [tag],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'sort', in: 'query', schema: { type: 'string' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          '200': {
            description: 'Records',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { records: { type: 'array', items: ref(typeName) } } },
              },
            },
          },
        },
      },
      post: {
        summary: `Create ${tag}`,
        tags: [tag],
        requestBody: body(typeName),
        responses: { '201': { description: 'Created' }, '403': { description: 'Not permitted' } },
      },
    };
    paths[`/api/data/${col.name}/{id}`] = {
      get: {
        summary: `Get ${tag}`,
        tags: [tag],
        parameters: [idParam],
        responses: { '200': { description: 'Record' }, '404': { description: 'Not found' } },
      },
      patch: {
        summary: `Update ${tag}`,
        tags: [tag],
        parameters: [idParam],
        requestBody: body(typeName),
        responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } },
      },
      delete: {
        summary: `Delete ${tag}`,
        tags: [tag],
        parameters: [idParam],
        responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } },
      },
    };
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'Zveltio data API',
      version: '1.0.0',
      description: 'The collections you can read, as the data API serves them to you.',
    },
    servers: [{ url: baseUrl }],
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    tags,
    paths,
    components: {
      schemas,
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'better-auth.session_token' },
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
    },
  };
}

/** A Postman v2.1 collection with one request per operation of `spec`. */
export function buildPostman(spec: Json): Json {
  return {
    info: {
      name: spec.info.title,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: Object.entries(spec.paths as Json).map(([path, methods]) => ({
      name: path,
      item: Object.entries(methods as Json).map(([method, op]) => ({
        name: op.summary,
        request: {
          method: method.toUpperCase(),
          url: { raw: `{{baseUrl}}${path.replace(/\{(\w+)\}/g, ':$1')}` },
          header: [{ key: 'Content-Type', value: 'application/json' }],
        },
      })),
    })),
    variable: [{ key: 'baseUrl', value: spec.servers[0]?.url ?? '' }],
  };
}
