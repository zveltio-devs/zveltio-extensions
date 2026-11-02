import { buildPostman, buildSpec } from './spec.js';

/**
 * The Swagger UI page. It carries no data: the browser asks `GET /api/data`
 * for what the visitor may read and builds the spec from that answer (see
 * spec.ts), so the page itself is the same for everyone and can be public.
 * The data API needs a session or an API key; without one the page says so.
 */
export const PAGE = `<!DOCTYPE html>
<html>
<head>
  <title>API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.css" integrity="sha384-+yyzNgM3K92sROwsXxYCxaiLWxWJ0G+v/9A+qIZ2rgefKgkdcmJI+L601cqPD/Ut" crossorigin="anonymous">
  <style>
    body { margin: 0; }
    #postman { position: fixed; bottom: 16px; right: 16px; z-index: 9999; background: #069494;
      color: white; padding: 6px 14px; border: 0; border-radius: 20px; font: 12px monospace; cursor: pointer; }
  </style>
</head>
<body>
<div id="swagger-ui"></div>
<button id="postman" type="button" hidden>Postman collection</button>
<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js" integrity="sha384-qn5tagrAjZi8cSmvZ+k3zk4+eDEEUcP9myuR2J6V+/H6rne++v6ChO7EeHAEzqxQ" crossorigin="anonymous"></script>
<script>
  const buildSpec = ${buildSpec.toString()};
  const buildPostman = ${buildPostman.toString()};
  window.onload = async function () {
    const res = await fetch('/api/data', { credentials: 'include' });
    if (!res.ok) {
      document.getElementById('swagger-ui').textContent = 'Sign in to see the collections you can use.';
      return;
    }
    const spec = buildSpec((await res.json()).collections, location.origin);
    SwaggerUIBundle({ spec, dom_id: '#swagger-ui', deepLinking: true, withCredentials: true,
      presets: [SwaggerUIBundle.presets.apis], layout: 'BaseLayout' });
    const postman = document.getElementById('postman');
    postman.hidden = false;
    postman.onclick = function () {
      const blob = new Blob([JSON.stringify(buildPostman(spec), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'api-collection.json';
      a.click();
    };
  };
</script>
</body>
</html>`;
