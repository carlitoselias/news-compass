import { DEFAULT_API_BASE } from './config.mjs';
import { validateArchive, publicURL, summarySource } from './shared/evidence.mjs';

const $ = id => document.getElementById(id);
const SESSION_KEY = 'news-compass-connection';
const state = { corpus:null, selected:new Set(), suggestion:null, draftQuestion:'', answer:null, omissions:null,
  saved:false, busy:false, dirty:false, view:'coverage', base:DEFAULT_API_BASE, access:'', connected:false, enabled:false };
function el(tag, text, cls) { const n=document.createElement(tag); if(text!==undefined) n.textContent=text; if(cls) n.className=cls; return n; }
function link(text,url) { const n=el('a',text); n.href=publicURL(url); n.target='_blank'; n.rel='noopener noreferrer'; return n; }
function error(message) { $('error').textContent=message; $('error').hidden=!message; if(message) { $('error').tabIndex=-1; $('error').focus(); } }
function progress(message) { $('feedback').textContent=message; $('feedback').hidden=!message; $('feedback').classList.toggle('busy',state.busy); }
function persistConnection() {
  try {
    if(state.connected) sessionStorage.setItem(SESSION_KEY,JSON.stringify({base:state.base,access:state.access}));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* In restricted browsers the current page still keeps its connection in memory. */ }
}
function currentSuggestion() {
  return state.suggestion && state.suggestion.selectedIds.length===state.selected.size && state.suggestion.selectedIds.every(id=>state.selected.has(id));
}
function controls() {
  $('entry-panel').hidden=Boolean(state.corpus);
  $('workspace').hidden=!state.corpus;
  $('new-run').hidden=!state.corpus;
  $('home').disabled=state.busy;
  $('new-run').disabled=state.busy;
  $('configure').disabled=state.busy;
  $('configure').classList.toggle('connected',state.connected);
  const label=state.connected?'Conexión: '+(state.enabled?'IA conectada':'IA no disponible'):'Conectar';
  $('configure').setAttribute('aria-label',label); $('configure').title=label;
  // Submitting without a connection opens login and preserves the entry.
  $('search').disabled=state.busy || $('news-input').value.trim().length<5;
  $('news-input').disabled=state.busy; $('import').disabled=state.busy;
  $('export').disabled=state.busy || !state.corpus;
  $('suggest').disabled=state.busy || !state.enabled || !state.selected.size || state.saved || !state.corpus?.overview;
  $('suggest').textContent='Analizar la cobertura ↗';
  $('suggest-help').textContent=state.saved?'Ejecución guardada · solo lectura.':!state.corpus?.overview?'Este archivo antiguo no contiene un resumen inicial.':!state.selected.size?'Selecciona al menos una fuente en «La noticia».':!state.enabled?'Conecta la IA para analizar la cobertura.':'';
  for(const box of document.querySelectorAll('[data-source]')) box.disabled=state.busy||state.saved;
  if($('suggested-question')) $('suggested-question').disabled=state.busy||state.saved;
  $('workspace').setAttribute('aria-busy',String(state.busy));
  $('settings-form').hidden=state.connected; $('connected-panel').hidden=!state.connected;
  $('settings-title').textContent=state.connected?'Conexión':'Conectar la demo';
  $('connected-status').textContent=state.enabled?'IA conectada. Puedes iniciar nuevas búsquedas.':'Sesión conectada. La IA no está disponible en este momento.';
}
function showView(view, focus=false) {
  state.view=view;
  $('coverage').hidden=view!=='coverage'; $('question-screen').hidden=view!=='question';
  for(const [id,name] of [['show-coverage','coverage'],['show-question','question']]) {
    $(id).classList.toggle('active',view===name);
    if(view===name) $(id).setAttribute('aria-current','page'); else $(id).removeAttribute('aria-current');
  }
  if(focus) { const node=$(view==='coverage'?'coverage':'question-screen'); node.focus(); node.scrollIntoView({block:'start'}); }
}
function source(id) { return id==='ai-summary'?summarySource(state.corpus):state.corpus.articles.find(a=>a.id===id); }
function evidenceBlock(e) {
  const a=source(e.sourceId), b=el('blockquote',undefined,'quote');
  b.append(el('div','“'+e.quote+'”'));
  if(a?.url) b.append(link(a.medium+' · Ver publicación ↗',a.url));
  else b.append(el('span','Resumen inicial de IA · contenido derivado'));
  return b;
}
function observation(item) {
  const n=el('div',undefined,'observation'), p=el('p',item.text,'claim-text'), details=el('details',undefined,'evidence');
  details.append(el('summary','Ver fragmentos'));
  const seen=new Set();
  for(const e of item.evidence) {
    const block=evidenceBlock(e); details.append(block);
    if(seen.has(e.sourceId)) continue; seen.add(e.sourceId);
    const a=source(e.sourceId), citation=el('button',a?.medium||e.sourceId,'citation');
    citation.setAttribute('aria-label','Ver cita de '+(a?.medium||e.sourceId));
    citation.addEventListener('click',()=>{ details.open=true; block.tabIndex=-1; block.focus(); block.scrollIntoView({block:'nearest'}); });
    p.append(document.createTextNode(' '),citation);
  }
  n.append(p,details); return n;
}
function renderOverview() {
  const root=$('overview-content'); root.replaceChildren();
  if(!state.corpus) return;
  const c=state.corpus, sheet=el('article',undefined,'overview');
  // Older runs have no editorial headline. Never turn a long search scope into one.
  const headline=c.overview?.headline || (c.event.name.length<=110 ? c.event.name : 'Resumen de la noticia');
  sheet.append(el('p','RESUMEN DE IA','eyebrow'),el('h1',headline));
  if(c.searchNotice) sheet.append(el('p',c.searchNotice,'notice'));
  if(c.overview?.sections) {
    for(const section of c.overview.sections) {
      sheet.append(el('h2',section.heading));
      for(const claim of section.claims) sheet.append(observation(claim));
    }
  } else if(state.answer) {
    sheet.append(el('p','Respuesta conservada de una ejecución anterior.','small-note'));
    for(const claim of state.answer.claims) sheet.append(observation(claim));
  } else sheet.append(el('p','Este archivo conserva las fuentes, pero no incluye un resumen inicial.','notice'));
  sheet.append(el('p','Elige las fuentes que quieras incluir en el análisis.','small-note'));
  root.append(sheet);
}
function publicationDate(value) {
  const match = typeof value === 'string' && value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!match) return 'Fecha no disponible';
  const [,year,month,day,hour] = match;
  const calendar = new Date(Date.UTC(Number(year),Number(month)-1,Number(day)));
  if (calendar.getUTCFullYear()!==Number(year) || calendar.getUTCMonth()!==Number(month)-1 || calendar.getUTCDate()!==Number(day)) return 'Fecha no disponible';
  const hasTime = hour !== undefined;
  const zoned = hasTime && /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
  const date = hasTime ? new Date(value.trim().replace(' ','T') + (zoned ? '' : 'Z')) : calendar;
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
  const parts = new Intl.DateTimeFormat('es-CL', {
    timeZone: zoned ? 'America/Santiago' : 'UTC', day:'numeric', month:'long', year:'numeric',
    ...(hasTime ? {hour:'2-digit',minute:'2-digit',hourCycle:'h23'} : {})
  }).formatToParts(date);
  const part = type => parts.find(p=>p.type===type)?.value;
  return part('day')+' de '+part('month')+' '+part('year')+(hasTime ? ' · '+part('hour')+':'+part('minute') : '');
}
function renderSources() {
  const root=$('sources-content'); root.replaceChildren(); if(!state.corpus) return;
  const readable=state.corpus.articles.filter(a=>a.access!=='unavailable' && a.text.length>=80);
  const heading=el('div',undefined,'section-heading');
  heading.append(el('h2','Las fuentes'),el('span',readable.length+' publicaciones · '+state.selected.size+' seleccionadas','small-note')); root.append(heading);
  const grid=el('div',undefined,'sources-grid');
  for(const a of readable) {
    const card=el('article',undefined,'source-card'+(state.selected.has(a.id)?' selected':''));
    const top=el('div',undefined,'source-top'); top.append(el('span',a.medium||new URL(a.url).hostname,'source-name'));
    const label=el('label',undefined,'select-source'), box=el('input'); box.type='checkbox'; box.dataset.source=a.id; box.checked=state.selected.has(a.id);
    box.setAttribute('aria-label','Seleccionar '+a.id.toUpperCase()+' · '+a.medium+' · '+a.title);
    box.addEventListener('change',()=>{ box.checked?state.selected.add(a.id):state.selected.delete(a.id); state.dirty=true; renderSources(); renderQuestion(); controls(); document.querySelector('[data-source="'+a.id+'"]').focus(); });
    label.append(box,document.createTextNode('Para el análisis')); top.append(label);
    const title=el('h3'); title.append(link(a.title,a.url));
    card.append(top,title,el('p',publicationDate(a.date),'metadata'));
    if(a.access==='partial') card.append(el('p','Lectura parcial · '+a.accessNote,'metadata'));
    const details=el('details'); details.append(el('summary','Leer texto de la fuente'),el('div',a.text,'read-text'));
    card.append(details); grid.append(card);
  }
  root.append(grid);
}
function renderComparison() {
  const root=$('comparison-content'); root.replaceChildren(); if(!state.corpus) return;
  const section=el('section',undefined,'comparison');
  section.append(el('p','LAS COBERTURAS, FRENTE A FRENTE','eyebrow'));
  const grid=el('div',undefined,'comparison-sections');
  for(const [key,title] of [['agreements','Coincidencias'],['differences','Diferencias']]) {
    const column=el('section',undefined,'comparison-group'); column.append(el('h2',key==='agreements'?'Dónde coinciden':'Dónde difieren'));
    const topics=state.corpus.comparison[key]||[];
    if(!topics.length) column.append(el('p','No se identificaron '+title.toLowerCase()+' con evidencia suficiente.','small-note'));
    for(const t of topics) {
      const card=el('article',undefined,'topic');
      card.append(el('h3',t.topic||t.text));
      for(const position of t.positions||[t]) {
        const names=[...new Set(position.evidence.map(e=>source(e.sourceId)?.medium||e.sourceId))];
        card.append(el('strong',names.join(' · '),'position-label'),observation(position));
      }
      column.append(card);
    }
    grid.append(column);
  }
  section.append(grid); root.append(section);
}
function renderQuestion() {
  if(!state.corpus) return;
  $('analysis-scope').textContent='El análisis contrasta el resumen inicial con '+state.selected.size+' fuente'+(state.selected.size===1?' seleccionada.':'s seleccionadas.');
  const result=$('suggestion-content'); result.replaceChildren();
  if(!state.suggestion) return;
  if(!currentSuggestion()) result.append(el('p','Este análisis corresponde a la selección anterior. Vuelve a analizar para incorporar tus cambios.','stale-note'));
  const sheet=el('article',undefined,'suggested-question');
  sheet.append(el('p','PARA SEGUIR EXPLORANDO','eyebrow'));
  const label=el('label','Edita la pregunta propuesta','sr-only'); label.htmlFor='suggested-question';
  const input=el('textarea'); input.id='suggested-question'; input.rows=3; input.maxLength=1200; input.value=state.draftQuestion||state.suggestion.question; input.disabled=state.saved||state.busy;
  input.addEventListener('input',()=>{ state.draftQuestion=input.value; state.dirty=true; });
  sheet.append(label,input,el('p','Cómo se relacionan las fuentes','small-note'));
  for(const item of state.suggestion.rationale) sheet.append(observation(item));
  result.append(sheet);
  if (state.suggestion.coverage) {
    const review = el('div',undefined,'coverage-review');
    for (const [key,title,empty] of [
      ['retained','Qué recogió el resumen','No se identificaron coincidencias respaldadas en los textos revisados.'],
      ['omitted','Qué dejó fuera','No se identificaron omisiones respaldadas en los textos revisados.'],
      ['reframed','Qué matizó de otra forma','No se identificaron cambios de matiz respaldados en los textos revisados.']
    ]) {
      const group=el('section',undefined,'review-group');
      group.append(el('h2',title));
      const items=state.suggestion.coverage[key];
      if(!items.length) group.append(el('p',empty,'small-note'));
      for(const item of items) group.append(observation(item));
      review.append(group);
    }
    review.append(el('p','Esta lectura de IA se limita a los textos seleccionados. Una omisión no implica por sí sola sesgo o error.','small-note'));
    result.append(review);
  } else {
    result.append(el('p','Este resultado anterior no incluye el análisis del resumen.','small-note'));
  }
}
function render() {
  renderOverview(); renderSources(); renderComparison(); renderQuestion(); controls(); showView(state.view);
  $('execution-label').textContent=state.corpus?(state.saved?'Ejecución guardada · ':'')+publicationDate(state.corpus.createdAt):'';
  $('execution-label').classList.toggle('saved-banner',state.saved);
}
async function api(action,body) {
  if(state.busy||!state.enabled) return null;
  state.busy=true; controls(); error(''); progress('Conectando…');
  try {
    const response=await fetch(state.base+'/'+action,{method:'POST',headers:{Authorization:'Bearer '+state.access,'Content-Type':'application/json'},
      body:JSON.stringify({...body,requestId:crypto.randomUUID()}),signal:AbortSignal.timeout(720000)});
    if(!response.ok) { const data=await response.json().catch(()=>({})); throw new Error(data.error||'El servidor no pudo completar la operación.'); }
    const reader=response.body.getReader(), decoder=new TextDecoder(); let pending='', result;
    const consume=line=>{ if(!line.trim()) return; const event=JSON.parse(line);
      if(event.type==='progress') progress(event.message);
      if(event.type==='error') throw new Error(event.message);
      if(event.type==='result') result=event;
    };
    try {
      for(;;) {
        const {done,value}=await reader.read(); if(done) break;
        pending+=decoder.decode(value,{stream:true}); if(pending.length>1500000) throw new Error('La respuesta supera el tamaño permitido.');
        const lines=pending.split('\n'); pending=lines.pop(); for(const line of lines) consume(line);
      }
      consume(pending+decoder.decode());
    } finally { await reader.cancel().catch(()=>{}); }
    if(!result) throw new Error('La conexión terminó sin resultado. No se reintentó.');
    progress(''); return result;
  } catch(e) { error(e.name==='TimeoutError'||e instanceof TypeError?'La conexión se interrumpió. No se reintentó; la operación puede haber consumido crédito.':e.message); progress(''); return null; }
  finally { state.busy=false; controls(); }
}
function openConnection() { $('server-url').value=state.base; $('settings-message').textContent=''; controls(); $('settings').showModal(); }
$('search-form').addEventListener('submit',async e=>{
  e.preventDefault(); if(state.busy) return;
  const input=$('news-input').value.trim(); if(input.length<5) return error('Escribe al menos cinco caracteres.');
  if(!state.connected) { openConnection(); return; }
  if(!state.enabled) return error('La IA está desactivada o no está disponible en el servidor.');
  if(!(await confirmReplace())) return;
  const data=await api('search',{input}); if(!data) return;
  state.corpus=data.corpus; state.selected=new Set(data.corpus.articles.filter(a=>a.access!=='unavailable'&&a.text.length>=80).map(a=>a.id));
  Object.assign(state,{suggestion:null,draftQuestion:'',answer:null,omissions:null,saved:false,dirty:true,view:'coverage'});
  render(); showView('coverage',true);
});
$('news-input').addEventListener('input',controls);
$('news-input').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); if(!$('search').disabled) $('search-form').requestSubmit(); } });
$('suggest').addEventListener('click',async()=>{
  if($('suggest').disabled) return;
  const data=await api('suggest',{corpus:state.corpus,selectedIds:[...state.selected]}); if(!data) return;
  state.suggestion=data.suggestion; state.draftQuestion=data.suggestion.question; state.dirty=true; renderQuestion(); controls(); $('suggestion-content').focus();
});
function confirmReplace() {
  if(!state.corpus) return Promise.resolve(true);
  return new Promise(resolve=>{
    const d=$('replace-dialog'); d.returnValue='cancel'; $('replace-status').textContent='';
    d.addEventListener('close',()=>resolve(d.returnValue==='continue'),{once:true}); d.showModal();
  });
}
async function newSearch() {
  if(state.busy || !(await confirmReplace())) return;
  Object.assign(state,{corpus:null,selected:new Set(),suggestion:null,draftQuestion:'',answer:null,omissions:null,saved:false,dirty:false,view:'coverage'});
  $('news-input').value=''; error(''); progress(''); render(); $('news-input').focus();
}
$('home').addEventListener('click',newSearch); $('new-run').addEventListener('click',newSearch);
$('replace-cancel').addEventListener('click',()=>$('replace-dialog').close('cancel'));
$('replace-continue').addEventListener('click',()=>$('replace-dialog').close('continue'));
$('replace-download').addEventListener('click',()=>{ download(); $('replace-status').textContent='Descarga solicitada. Comprueba el archivo antes de continuar.'; });
$('show-coverage').addEventListener('click',()=>showView('coverage',true));
$('show-question').addEventListener('click',()=>showView('question',true));
$('continue').addEventListener('click',()=>showView('question',true));
$('back').addEventListener('click',()=>showView('coverage',true));
function download() {
  if(!state.corpus||state.busy) return;
  const data={format:'news-compass',version:2,savedAt:new Date().toISOString(),corpus:state.corpus,selectedIds:[...state.selected],
    suggestion:state.suggestion,question:state.draftQuestion,answer:state.answer,omissions:state.omissions};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}), url=URL.createObjectURL(blob), a=el('a');
  a.href=url; a.download='news-compass-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  state.dirty=false; progress('Descarga solicitada. Comprueba el archivo en tus descargas.');
}
$('export').addEventListener('click',download);
$('import').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async e=>{
  const input=e.currentTarget;
  try {
    const file=input.files[0]; if(!file) return;
    if(file.size>1500000) throw new Error('El archivo supera 1,5 MB.');
    const data=validateArchive(JSON.parse(await file.text()));
    if(!(await confirmReplace())) return;
    Object.assign(state,{corpus:data.corpus,selected:new Set(data.selectedIds??data.answer?.selectedIds??[]),
      suggestion:data.suggestion??null,draftQuestion:data.question??data.suggestion?.question??'',answer:data.answer??null,omissions:data.omissions??null,
      saved:true,dirty:false,view:'coverage'});
    error(''); progress(''); render(); showView('coverage',true);
  } catch(e) { error('No se pudo abrir el archivo: '+e.message); }
  finally { input.value=''; }
});
function validBase(value) {
  const u=new URL(value);
  if(u.protocol!=='https:' && !(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))) throw new Error('El servidor debe usar HTTPS.');
  if(u.username||u.password||u.search||u.hash||(u.pathname!=='/'&&u.pathname!=='')) throw new Error('Usa la dirección base del servidor.');
  return u.origin;
}
async function checkConnection(base,access) {
  const response=await fetch(base+'/status',{headers:{Authorization:'Bearer '+access},signal:AbortSignal.timeout(12000)});
  const data=await response.json();
  if(!response.ok) throw new Error(data.error||'No se pudo comprobar la conexión.');
  return data;
}
$('configure').addEventListener('click',openConnection);
$('close-settings').addEventListener('click',()=>$('settings').close());
$('settings-form').addEventListener('submit',async e=>{
  e.preventDefault(); if(state.connected||$('connect').disabled) return;
  $('connect').disabled=true; $('settings-message').textContent='Comprobando conexión…';
  try {
    const base=validBase($('server-url').value),access=$('access-code').value;
    const data=await checkConnection(base,access);
    Object.assign(state,{base,access,connected:true,enabled:data.enabled===true}); persistConnection();
    $('access-code').value=''; $('settings').close(); controls();
    if(!state.enabled) error('Sesión conectada, pero la IA está desactivada en el servidor.'); else error('');
  } catch(e) { $('settings-message').textContent=e.message; }
  finally { $('connect').disabled=false; }
});
$('disconnect').addEventListener('click',()=>{
  Object.assign(state,{connected:false,enabled:false,access:''}); persistConnection(); $('access-code').value=''; $('settings').close(); controls();
});
window.addEventListener('beforeunload',e=>{ if(state.dirty||state.busy) { e.preventDefault(); e.returnValue=''; } });
async function restoreConnection() {
  try {
    const saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');
    if(!saved||typeof saved.access!=='string'||saved.access.length<24) return;
    const base=validBase(saved.base);
    Object.assign(state,{base,access:saved.access,connected:true,enabled:false}); controls();
    const data=await checkConnection(base,saved.access); state.enabled=data.enabled===true;
  } catch { if(state.connected) error('Conservamos la sesión, pero no pudimos comprobar la IA. Revisa tu conexión o vuelve a cargar la página.'); }
  finally { controls(); }
}
render(); restoreConnection();
