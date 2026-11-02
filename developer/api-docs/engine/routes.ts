import { Hono } from 'hono';
import { PAGE } from './page.js';

export function apiDocsRoutes(): Hono {
  const router = new Hono();
  router.get('/', (c) => c.html(PAGE));
  return router;
}
