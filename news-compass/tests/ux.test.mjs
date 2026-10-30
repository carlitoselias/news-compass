import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { publicURL, validateArchive, summarySource } from '../shared/evidence.mjs';
import { corpus, article, item } from './fixtures.mjs';
const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
const script=(await readFile(new URL('../web/app.mjs',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
const tick=()=>new Promise(r=>setImmediate(r));
function fixture() {
  const c=corpus(); c.articles.push(article('s3'),article('s4'));
  c.overview={headline:'Una biblioteca gratuita abre sus puertas al barrio',sections:[{heading:'Apertura',claims:[item()]}]};
  c.comparison={agreements:[{topic:'Fecha de apertura',positions:[{text:'Ambos anuncian el viernes.',evidence:[item().evidence[0],item('s2').evidence[0]]}]}],differences:[]};
  return c;
}
function setup(store=new Map()) {
  const {document,window}=parseHTML(html);
  window.HTMLElement.prototype.scrollIntoView=function(){};
  for(const d of document.querySelectorAll('dialog')) { d.showModal=()=>{d.open=true;}; d.close=v=>{d.open=false;d.returnValue=v;d.dispatchEvent(new window.Event('close'));}; }
  const calls=[],blobs=[];
  class TestURL extends URL { static createObjectURL(b){blobs.push(b);return 'blob:test';} static revokeObjectURL(){} }
  const sessionStorage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  const context=vm.createContext({document,window,URL:TestURL,Blob,Set,Date,publicURL,validateArchive,summarySource,sessionStorage,
    DEFAULT_API_BASE:'http://127.0.0.1:4174',setTimeout:()=>{},TextDecoder,AbortSignal,crypto,
    fetch:async(...args)=>{calls.push(args); if(args[0].endsWith('/status')) return Response.json({enabled:true}); throw new Error('Fallo de prueba');}});
  vm.runInContext(script,context);
  const run=code=>vm.runInContext(code,context), $=id=>document.getElementById(id);
  const load=()=>{context.fixture=fixture();run("Object.assign(state,{corpus:fixture,selected:new Set(['s1','s2','s3','s4']),connected:true,enabled:true,access:'test-access-code-with-32-characters',dirty:true}); render();");};
  return {document,window,context,calls,blobs,store,run,$,load};
}
test('minimal entry supports short questions and opens login without losing input',()=>{
  const ui=setup();assert.equal(ui.$('workspace').hidden,true);assert.equal(ui.$('search').disabled,true);
  ui.$('news-input').value='qué pasó con Bolsonaro';ui.$('news-input').dispatchEvent(new ui.window.Event('input'));
  assert.equal(ui.$('search').disabled,false);
  ui.$('search-form').dispatchEvent(new ui.window.Event('submit',{cancelable:true}));
  assert.equal(ui.$('settings').open,true);assert.equal(ui.$('news-input').value,'qué pasó con Bolsonaro');
  assert.equal(ui.document.querySelector('#projection'),null);assert.equal(ui.document.querySelector('footer').textContent,'newscompass · 2026');
});
test('logo and new search reset only the work; cancellation preserves everything',async()=>{
  const ui=setup();ui.load();ui.$('home').click();ui.$('replace-cancel').click();await tick();
  assert.ok(ui.run('state.corpus'));assert.equal(ui.run('state.connected'),true);
  ui.$('home').click();ui.$('replace-continue').click();await tick();
  assert.equal(ui.run('state.corpus'),null);assert.equal(ui.run('state.connected'),true);assert.match(ui.run('state.access'),/^test-access/);assert.equal(ui.$('news-input').value,'');
  ui.load();ui.$('new-run').click();ui.$('replace-continue').click();await tick();assert.equal(ui.run('state.enabled'),true);
});
test('connection dialog shows only disconnect when authenticated; only disconnect removes credentials',()=>{
  const ui=setup();ui.load();ui.run('persistConnection()');ui.$('configure').click();
  assert.equal(ui.$('settings-form').hidden,true);assert.equal(ui.$('connected-panel').hidden,false);
  ui.$('disconnect').click();assert.equal(ui.run('state.connected'),false);assert.equal(ui.store.size,0);assert.ok(ui.run('state.corpus'));
});
test('tab session survives reload and is rechecked without a paid request',async()=>{
  const ui=setup();ui.load();ui.run('persistConnection()');const next=setup(ui.store);await tick();
  assert.equal(next.run('state.connected'),true);assert.equal(next.run('state.enabled'),true);assert.equal(next.calls.length,1);assert.match(next.calls[0][0],/\/status$/);
});
test('summary precedes source cards and comparisons name topic and publications',()=>{
  const ui=setup();ui.load();
  assert.match(ui.$('overview-content').textContent,/Apertura/);assert.match(ui.$('comparison-content').textContent,/Fecha de apertura/);
  assert.match(ui.$('comparison-content').textContent,/Medio de prueba s1 · Medio de prueba s2/);
  assert.doesNotMatch(ui.$('comparison-content').textContent,/Contradicciones/);
  const boxes=[...ui.document.querySelectorAll('[data-source]')];assert.equal(new Set(boxes.map(b=>b.getAttribute('aria-label'))).size,4);
});
test('editorial headline replaces search scope and older long scopes are not rendered as headlines',()=>{
  const ui=setup();ui.load();
  ui.run("state.corpus.event.name='Acceso al agua potable en Chile: disponibilidad hídrica, continuidad del suministro y abastecimiento rural. Seguimiento de julio a octubre de 2026, con antecedentes de 2023 y 2024; corte al 30 de octubre de 2026.'; render();");
  assert.equal(ui.$('overview-content').querySelector('h1').textContent,'Una biblioteca gratuita abre sus puertas al barrio');
  ui.run("delete state.corpus.overview.headline; render();");
  assert.equal(ui.$('overview-content').querySelector('h1').textContent,'Resumen de la noticia');
  assert.equal(ui.calls.length,0);
});

test('citations expand exact evidence locally without requests',()=>{
  const ui=setup();ui.load();ui.$('overview-content').querySelector('.citation').click();
  assert.equal(ui.$('overview-content').querySelector('details').open,true);assert.equal(ui.calls.length,0);
});
test('question view distinguishes derived summary and preserves old proposal after source change',()=>{
  const ui=setup();ui.load();ui.context.proposal={corpusId:'test-corpus',selectedIds:['s1','s2','s3','s4'],question:'¿Cuándo abrirá?',rationale:[item()]};
  ui.run("state.suggestion=proposal; state.draftQuestion=proposal.question; render();");
  ui.$('continue').click();assert.equal(ui.$('question-screen').hidden,false);assert.match(ui.$('analysis-scope').textContent,/4 fuentes seleccionadas/);
  const box=ui.document.querySelector('[data-source]');box.checked=false;box.dispatchEvent(new ui.window.Event('change'));
  assert.match(ui.$('suggestion-content').textContent,/selección anterior/);assert.equal(ui.run('state.suggestion.question'),'¿Cuándo abrirá?');
});
test('failed suggestion keeps results and does not retry',async()=>{
  const ui=setup();ui.load();ui.$('suggest').click();await tick();
  assert.equal(ui.calls.length,1);assert.ok(ui.run('state.corpus.overview'));assert.match(ui.$('error').textContent,/Fallo de prueba/);
  assert.equal(ui.$('suggest').disabled,false);
});
test('busy state prevents duplicate requests and warns before closing',async()=>{
  const ui=setup();ui.load();ui.run('state.busy=true;controls()');
  assert.equal(ui.$('home').disabled,true);assert.equal(ui.$('new-run').disabled,true);assert.equal(ui.$('suggest').disabled,true);
  await ui.run("api('suggest',{})");assert.equal(ui.calls.length,0);
  const event=new ui.window.Event('beforeunload',{cancelable:true});ui.window.dispatchEvent(event);assert.equal(event.defaultPrevented,true);
});
test('new archives preserve overview, proposal, edited question and selection without secrets',async()=>{
  const ui=setup();ui.load();ui.context.proposal={corpusId:'test-corpus',selectedIds:['s1'],question:'¿Cuándo abre?',rationale:[item()],coverage:{retained:[{text:'El resumen conserva la fecha de apertura.',evidence:[item().evidence[0],{sourceId:'ai-summary',quote:item().text}]}],omitted:[],reframed:[]}};
  ui.run("state.suggestion=proposal;state.draftQuestion='¿Cuándo abre y para quién?';render()");ui.$('export').click();
  const text=await ui.blobs[0].text(),data=JSON.parse(text);validateArchive(data);
  assert.equal(data.suggestion.coverage.retained.length,1);
  assert.equal(data.corpus.overview.headline,'Una biblioteca gratuita abre sus puertas al barrio');assert.equal(data.question,'¿Cuándo abre y para quién?');assert.equal(data.suggestion.question,'¿Cuándo abre?');
  assert.ok(!text.includes('test-access'));assert.equal(data.base,undefined);
  const restored=setup();restored.$('import-file').files=[{size:text.length,text:async()=>text}];
  restored.$('import-file').dispatchEvent(new restored.window.Event('change'));await tick();
  assert.match(restored.$('execution-label').textContent,/Ejecución guardada/);assert.equal(restored.$('suggest').disabled,true);
  assert.match(restored.$('suggestion-content').textContent,/Qué recogió el resumen/);
  assert.equal(restored.$('suggestion-content').querySelectorAll('.review-group').length,3);
  assert.equal(restored.$('suggested-question').value,data.question);assert.equal(restored.calls.length,0);
});
test('invalid archive cannot replace current work',async()=>{
  const ui=setup();ui.load();ui.$('import-file').files=[{size:10,text:async()=>'{}'}];
  ui.$('import-file').dispatchEvent(new ui.window.Event('change'));await tick();assert.equal(ui.run('state.corpus.id'),'test-corpus');assert.match(ui.$('error').textContent,/No se pudo abrir/);
});
test('legacy v1 archive can be viewed and exported without losing its answer or omissions',async()=>{
  const ui=setup();const old={format:'news-compass',version:1,corpus:corpus(),selectedIds:['s1'],answer:{selectedIds:['s1'],claims:[item()]},omissions:{omissions:[],context:[]}};
  const text=JSON.stringify(old);ui.$('import-file').files=[{size:text.length,text:async()=>text}];
  ui.$('import-file').dispatchEvent(new ui.window.Event('change'));await tick();assert.match(ui.$('overview-content').textContent,/Respuesta conservada/);
  ui.$('export').click();const data=JSON.parse(await ui.blobs[0].text());assert.deepEqual(data.answer,old.answer);assert.deepEqual(data.omissions,old.omissions);assert.equal(ui.$('suggest').disabled,true);
});
