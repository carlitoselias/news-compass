import { execute, UserError } from './service.mjs';
import { readLimited } from './articles.mjs';

const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });
export async function authorized(header, secret) {
  if (!secret || secret.length < 24) return false;
  const digest = value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const a = new Uint8Array(await digest(header ?? '')); const b = new Uint8Array(await digest(`Bearer ${secret}`));
  return a.reduce((difference, v, i) => difference | (v ^ b[i]), 0) === 0;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const permitted = origin === env.ALLOWED_ORIGIN;
    const headers = { Vary: 'Origin', 'X-Content-Type-Options': 'nosniff',
      ...(permitted ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' } : {}) };
    if (origin && !permitted) return json({ error: 'Origen no autorizado.' }, 403, headers);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const path = new URL(request.url).pathname;
    if (path === '/health' && request.method === 'GET') return json({ service: 'news-compass', version: 2, features: ['overview', 'source-replacement', 'suggest'] }, 200, headers);
    if (!await authorized(request.headers.get('Authorization'), env.DEMO_ACCESS_TOKEN)) return json({ error: 'Código de acceso incorrecto o servidor sin configurar.' }, 401, headers);
    if (path === '/status' && request.method === 'GET') return json({
      enabled: env.AI_ENABLED === 'true' && env.BUDGET_READY === 'true' && Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL),
      model: env.OPENAI_MODEL ?? '', message: env.AI_ENABLED === 'true' && env.BUDGET_READY === 'true' ? 'Comprueba el saldo y el límite en el panel de OpenAI.' : 'Llamadas de pago desactivadas.'
    }, 200, headers);
    if (request.method !== 'POST' || !['/search', '/suggest', '/generate', '/omissions'].includes(path)) return json({ error: 'Ruta no disponible.' }, 404, headers);
    if (env.AI_ENABLED !== 'true' || env.BUDGET_READY !== 'true') return json({ error: 'Las llamadas de pago están desactivadas. Puedes recuperar una ejecución guardada.' }, 403, headers);
    try {
      if (!request.headers.get('content-type')?.includes('application/json')) throw new UserError('Se requiere JSON.');
      const payload = JSON.parse(await readLimited(request, 400000));
      if (!/^[a-f0-9-]{36}$/i.test(payload.requestId ?? '')) throw new UserError('Falta un identificador de solicitud válido.');
      if (!env.DEMO_GATE) throw new UserError('Falta el control de solicitudes del servidor.', 503);
      const response = await env.DEMO_GATE.getByName('conference').fetch(new Request(`https://gate/${path.slice(1)}`, { method: 'POST', body: JSON.stringify(payload) }));
      return new Response(response.body, { status: response.status, headers: { ...Object.fromEntries(response.headers), ...headers } });
    } catch (error) { return json({ error: error instanceof UserError ? error.message : 'La solicitud no tiene un formato válido.' }, error.status ?? 400, headers); }
  }
};

// This object persists only request IDs and counters, never articles or credentials.
export class DemoGate {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async fetch(request) {
    const payload = await request.json(); const day = new Date().toISOString().slice(0, 10);
    const reservation = await this.ctx.blockConcurrencyWhile(async () => {
      const state = await this.ctx.storage.get('gate') ?? { day, count: 0, ids: [], activeUntil: 0 };
      if (state.activeUntil > Date.now()) return { error: 'Ya hay una operación en curso. Espera a que termine.', status: 409 };
      if (state.day !== day) Object.assign(state, { day, count: 0, ids: [] });
      if (state.ids.includes(payload.requestId)) return { error: 'Esta solicitud ya se procesó. No se volverá a cobrar automáticamente.', status: 409 };
      if (state.count >= 60) return { error: 'Se alcanzó el máximo de 60 operaciones del día. Consulta el respaldo.', status: 429 };
      state.count++; state.ids.push(payload.requestId); state.activeUntil = Date.now() + 720000;
      state.activeId = payload.requestId;
      await this.ctx.storage.put('gate', state); return null;
    });
    if (reservation) return json(reservation, reservation.status);
    const stream = new ReadableStream({ start: controller => {
      const send = data => { try { controller.enqueue(new TextEncoder().encode(`${JSON.stringify(data)}\n`)); } catch { /* disconnected client; do not repeat paid requests */ } };
      const work = (async () => {
        try { send({ type: 'progress', message: 'Solicitud aceptada.' });
          const result = await execute(new URL(request.url).pathname.slice(1), payload, this.env, message => send({ type: 'progress', message }));
          send({ type: 'result', ...result });
        } catch (error) { send({ type: 'error', message: error instanceof UserError ? error.message : 'No se pudo validar la evidencia de la respuesta. Revisa las fuentes y vuelve a intentar de forma explícita.' }); }
        finally {
          await this.ctx.blockConcurrencyWhile(async () => {
            const state = await this.ctx.storage.get('gate');
            if (state?.activeId === payload.requestId) { state.activeUntil = 0; await this.ctx.storage.put('gate', state); }
          });
          try { controller.close(); } catch { /* client disconnected */ }
        }
      })();
      this.ctx.waitUntil(work);
    } });
    return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}
