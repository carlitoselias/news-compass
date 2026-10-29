import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import worker from '../worker/index.mjs';
const root = resolve(import.meta.dirname, '..'); const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };
const env = { AI_ENABLED: 'false', BUDGET_READY: 'false', ALLOWED_ORIGIN: 'http://127.0.0.1:' + port, DEMO_ACCESS_TOKEN: 'local-preview-access-code', OPENAI_MODEL: 'sin llamadas locales' };
http.createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://127.0.0.1:' + port).pathname);
    if (['/status', '/health', '/search', '/generate', '/omissions'].includes(path)) {
      const result = await worker.fetch(new Request('http://127.0.0.1:' + port + path, { method: request.method, headers: request.headers }), env);
      response.writeHead(result.status, Object.fromEntries(result.headers)); response.end(await result.text()); return;
    }
    const directory = path.startsWith('/shared/') ? resolve(root, 'shared') : resolve(root, 'web');
    const relative = path.startsWith('/shared/') ? path.slice(8) : path === '/' ? 'index.html' : path.slice(1);
    const file = resolve(directory, relative);
    if (!file.startsWith(directory + sep)) { response.writeHead(403); response.end(); return; }
    const content = await readFile(file); response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(content);
  } catch { response.writeHead(404); response.end('No encontrado'); }
}).listen(port, '127.0.0.1', () => console.log('Local: http://127.0.0.1:' + port + '\nVista previa sin llamadas de pago.'));
