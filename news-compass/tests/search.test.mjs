import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, verifySigned } from '../worker/service.mjs';
import { article, item, corpus, responseEnvelope } from './fixtures.mjs';

test('search pipeline reads only tool URLs and validates evidence without network', async () => {
  const env = { AI_ENABLED: 'true', BUDGET_READY: 'true', OPENAI_API_KEY: 'test-only-key', OPENAI_MODEL: 'test-model' };
  const candidates = [1,2,3,4].map(n => article('s' + n));
  const calls = []; const progress = [];
  const fetcher = async (url, options) => {
    calls.push(url);
    if (url === 'https://api.openai.com/v1/responses') {
      const body = JSON.parse(options.body);
      if (body.tools) {
        const response = responseEnvelope({ event: corpus().event, articles: [...candidates, article('fake')] });
        response.output.unshift({ type: 'web_search_call', action: { sources: candidates.map(a => ({ url: a.url })) } });
        return Response.json(response);
      }
      const inputs = JSON.parse(body.input).articles;
      assert.equal(inputs.length, 4);
      return Response.json(responseEnvelope({
        articles: inputs.map(a => ({ id: a.id, facts: [item(a.id)], voices: [], context: [], focus: [], agency: [] })),
        agreements: [], differences: [], contradictions: []
      }));
    }
    assert.ok(candidates.some(a => a.url === url));
    return new Response('<html><head><title>Prueba de biblioteca</title></head><body><article><h1>Biblioteca</h1><p>' + article().text.repeat(4) + '</p></article></body></html>', { headers: { 'content-type': 'text/html' } });
  };
  const result = await execute('search', { input: 'Noticia ficticia para prueba técnica de búsqueda' }, env, p => progress.push(p), fetcher);
  assert.equal(result.corpus.articles.length, 4);
  assert.equal(result.corpus.receipts.length, 2);
  assert.equal(calls.length, 6);
  assert.equal(progress.length, 3);
  await verifySigned(result.corpus, env.OPENAI_API_KEY);
  assert.ok(result.corpus.articles.every(a => a.analysis.facts.length === 1));
});
