import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, verifySigned, signed } from '../worker/service.mjs';
import { validateTopics } from '../worker/search.mjs';
import { summarySource, validateArchive, validateCoverage } from '../shared/evidence.mjs';
import { article, item, corpus, responseEnvelope } from './fixtures.mjs';
const env={AI_ENABLED:'true',BUDGET_READY:'true',OPENAI_API_KEY:'test-only-key',OPENAI_MODEL:'test-model'};
const html='<html><head><title>Biblioteca de prueba</title></head><body><article><p>'+article().text.repeat(4)+'</p></article></body></html>';
function response(value,articles=[]) {
  const r=responseEnvelope(value);
  if(articles.length) r.output.unshift({type:'web_search_call',action:{sources:articles.map(a=>({url:a.url}))}});
  return Response.json(r);
}
const overview=articles=>({headline:'Una biblioteca gratuita abre sus puertas al barrio',sections:[{heading:'Apertura',claims:[item(articles[0].id)]}],agreements:[],differences:[]});
test('search uses only tool URLs, accepts short questions and signs summary in the corpus',async()=>{
  const candidates=[1,2,3,4].map(n=>article('s'+n));let calls=0;
  const result=await execute('search',{input:'¿Qué pasó?'},env,()=>{},async(url,options)=>{
    calls++;
    if(url==='https://api.openai.com/v1/responses') {
      const body=JSON.parse(options.body);
      if(body.tools) return response({event:corpus().event,articles:[...candidates,article('fake')]},candidates);
      assert.equal(body.tools,undefined);return response(overview(JSON.parse(body.input).articles));
    }
    assert.ok(candidates.some(a=>a.url===url));return new Response(html,{headers:{'content-type':'text/html'}});
  });
  assert.equal(result.corpus.articles.length,4);assert.equal(calls,6);assert.equal(result.corpus.receipts.length,2);
  assert.equal(result.corpus.overview.headline,'Una biblioteca gratuita abre sus puertas al barrio');
  assert.notEqual(result.corpus.overview.headline,result.corpus.event.name);
  assert.ok(summarySource(result.corpus).text.startsWith(result.corpus.overview.headline));
  assert.ok(result.corpus.overview.sections[0].claims.length);await verifySigned(result.corpus,env.OPENAI_API_KEY);
});
test('inaccessible, description-only and boilerplate sources are replaced with accessible reserves',async()=>{
  const candidates=Array.from({length:9},(_,i)=>article('x'+i));let rounds=0;
  const result=await execute('search',{input:'Noticia sobre biblioteca'},env,()=>{},async(url,options)=>{
    if(url==='https://api.openai.com/v1/responses') {
      const body=JSON.parse(options.body);
      if(body.tools) { rounds++;return response({event:corpus().event,articles:candidates},candidates); }
      return response(overview(JSON.parse(body.input).articles));
    }
    if(url===candidates[0].url) return new Response('',{status:403});
    if(url===candidates[1].url) return new Response('<meta property="og:description" content="'+article().text+'">',{headers:{'content-type':'text/html'}});
    if(url===candidates[2].url) return new Response('<article><p>'+('Alerta de Spoiler Advertencia de imágenes explícitas {{ post.resumen_de_ia }} '.repeat(10))+'</p></article>',{headers:{'content-type':'text/html'}});
    return new Response(html,{headers:{'content-type':'text/html'}});
  });
  assert.equal(rounds,1);assert.equal(result.corpus.articles.length,6);assert.equal(result.corpus.discarded.length,3);
  assert.ok(result.corpus.articles.every(a=>a.textOrigin==='body'));
});
test('replacement search has two rounds maximum and reports honest shortfall',async()=>{
  let rounds=0;const first=[article('a'),article('b')],second=[article('c')];
  const result=await execute('search',{input:'Noticia de prueba'},env,()=>{},async(url,options)=>{
    if(url==='https://api.openai.com/v1/responses') {
      const body=JSON.parse(options.body);
      if(body.tools) { rounds++;const articles=rounds===1?first:second;return response({event:corpus().event,articles},articles); }
      return response(overview(JSON.parse(body.input).articles));
    }
    return new Response(html,{headers:{'content-type':'text/html'}});
  });
  assert.equal(rounds,2);assert.equal(result.corpus.articles.length,3);assert.match(result.corpus.searchNotice,/Solo encontramos 3/);
});
test('no readable sources returns an error after bounded discovery, never a fake summary',async()=>{
  let rounds=0;
  await assert.rejects(()=>execute('search',{input:'Noticia de prueba'},env,()=>{},async(url,options)=>{
    if(url==='https://api.openai.com/v1/responses') { rounds++;const candidates=[article('a'+rounds)];return response({event:corpus().event,articles:candidates},candidates); }
    return new Response('',{status:403});
  }),/No encontramos/);
  assert.equal(rounds,2);
});
test('comparison requires distinct sources and literal support for each position',()=>{
  assert.throws(()=>validateTopics([{topic:'Fecha',positions:[item()]}],[article()],false));
  assert.throws(()=>validateTopics([{topic:'Fecha',positions:[item(),{text:'Otro',evidence:[{sourceId:'s2',quote:'Una cita que nunca existió aquí.'}]}]}],[article(),article('s2')],true));
  assert.equal(validateTopics([{topic:'Fecha',positions:[item(),item('s2')]}],[article(),article('s2')],true).length,1);
});
test('inverse question gets selected articles plus a labelled derived summary, with no web tool',async()=>{
  const c=corpus();c.overview={sections:[{heading:'Apertura',claims:[item('s2')]}]};
  const signedCorpus=await signed(c,env.OPENAI_API_KEY);let sent;
  const result=await execute('suggest',{corpus:signedCorpus,selectedIds:['s1']},env,()=>{},async(url,options)=>{
    sent=JSON.parse(options.body);
    return response({question:'¿Cuándo abrirá la biblioteca?',rationale:[item(),{text:'El resumen menciona la apertura.',evidence:[{sourceId:'ai-summary',quote:item().text}]}],coverage:{retained:[{text:'El resumen conserva la fecha de apertura.',evidence:[item().evidence[0],{sourceId:'ai-summary',quote:item().text}]}],omitted:[],reframed:[]}});
  });
  const input=JSON.parse(sent.input);assert.equal(sent.tools,undefined);assert.deepEqual(input.articles.map(a=>a.id),['s1']);
  assert.equal(input.derivedSummary.id,'ai-summary');assert.deepEqual(input.derivedSummary.provenance[0].sourceIds,['s2']);
  assert.equal(result.suggestion.coverage.retained.length,1);
  await verifySigned(result.suggestion,env.OPENAI_API_KEY);
  validateArchive({format:'news-compass',version:2,corpus:c,suggestion:result.suggestion});
});
test('inverse question rejects direct citations to deselected media and edited corpus',async()=>{
  const c=corpus();c.overview={sections:[{heading:'Apertura',claims:[item()]}]};const sc=await signed(c,env.OPENAI_API_KEY);
  await assert.rejects(()=>execute('suggest',{corpus:sc,selectedIds:['s1']},env,()=>{},async()=>response({question:'¿Cuándo abre?',rationale:[item('s2')]})));
  sc.overview.sections[0].claims[0].text='Alteración';await assert.rejects(()=>execute('suggest',{corpus:sc,selectedIds:['s1']},env));
});
