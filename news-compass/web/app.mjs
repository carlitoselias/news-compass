import { DEFAULT_API_BASE } from './config.mjs';
import { validateArchive, publicURL } from './shared/evidence.mjs';

const $ = id => document.getElementById(id);
const state = { corpus: null, selected: new Set(), answer: null, omissions: null, saved: false, busy: false, dirty: false, downloaded: false, view: 'coverage',
  base: DEFAULT_API_BASE, access: '', enabled: false, connected: false };
function el(tag, text, cls) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (cls) node.className = cls; return node; }
function safeLink(text, url, cls) {
  const a = el('a', text, cls); a.href = publicURL(url); a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', `${text} (abre en otra pestaña)`); return a;
}
function showError(message) { $('error').textContent = message; $('error').hidden = !message; if (message) { $('error').tabIndex = -1; $('error').focus(); } }
function progress(message) { $('feedback').textContent = message; $('feedback').hidden = !message; $('feedback').classList.toggle('busy', state.busy); }
function answerIsCurrent() {
  return Boolean(state.answer && (state.answer.question ?? '').trim() === $('question').value.trim() &&
    state.answer.selectedIds.length === state.selected.size && state.answer.selectedIds.every(id => state.selected.has(id)));
}
function controls() {
  const current = answerIsCurrent();
  $('search').disabled = state.busy || !state.enabled || $('news-input').value.trim().length < 20;
  $('generate').disabled = state.busy || !state.enabled || !state.selected.size || state.saved || !$('question').value.trim();
  $('find-omissions').disabled = state.busy || !state.enabled || !state.answer?.claims.length || !current || Boolean(state.omissions) || state.saved;
  $('export').disabled = state.busy || !state.corpus;
  for (const button of document.querySelectorAll('[data-download]')) button.disabled = state.busy;
  $('import').disabled = state.busy; $('new-run').disabled = state.busy;
  $('news-input').disabled = state.busy; $('question').disabled = state.busy || state.saved || !state.corpus;
  $('configure').disabled = state.busy;
  $('selection-count').textContent = `${state.selected.size} fuente${state.selected.size === 1 ? '' : 's'} seleccionada${state.selected.size === 1 ? '' : 's'}`;
  $('source-count').textContent = state.corpus?.articles.length ?? '—';
  for (const box of document.querySelectorAll('[data-source]')) box.disabled = state.busy || state.saved || box.dataset.readable !== 'true';
  $('input-hint').textContent = !state.connected ? 'Primero pulsa “Conectar IA”, o abre un archivo guardado. Conectar no consume IA.' : !state.enabled ? 'El servidor tiene la IA desactivada. Puedes abrir un archivo guardado.' : 'Busca hasta 6 coberturas y compara sus textos con IA. Esta acción consume crédito. Introduce al menos 20 caracteres.';
  $('generate-help').textContent = state.saved ? 'Archivo abierto en modo lectura. Para generar otra respuesta, inicia una nueva búsqueda.' : !state.corpus ? 'Primero busca una noticia en el paso 1.' : !state.selected.size ? 'Selecciona al menos una fuente con texto en “1. Elegir fuentes”.' : !state.enabled ? 'Conecta y habilita la IA para generar. Puedes seguir leyendo las fuentes.' : !$('question').value.trim() ? 'Escribe una pregunta para continuar.' : 'Usa solo las fuentes seleccionadas. Consume crédito. Cambiar la pregunta no genera una respuesta automáticamente.';
  $('generate').textContent = state.busy ? 'Espera a que termine…' : state.answer ? 'Generar otra respuesta con IA' : 'Generar respuesta con IA';
  $('omissions-help').textContent = !state.answer ? (state.saved ? 'Este archivo no contiene una respuesta para analizar.' : 'Primero genera una respuesta en el paso 2.') : !current ? (state.saved ? 'Las citas corresponden a la respuesta anterior del archivo. El modo lectura no genera omisiones nuevas.' : 'La selección o la pregunta cambió. Genera una nueva respuesta antes de analizar sus omisiones.') : state.omissions ? 'Análisis de IA disponible debajo de las citas. Revisa sus fragmentos de respaldo.' : state.saved ? 'Este archivo no incluye omisiones. El modo lectura no genera contenido nuevo.' : !state.answer.claims.length ? 'La respuesta no tiene afirmaciones suficientes para analizar omisiones.' : !state.enabled ? 'Conecta la IA para analizar omisiones. Las citas ya se pueden leer.' : 'Opcional: compara la respuesta con los textos seleccionados para buscar matices que quedaron fuera. Consume crédito.';
  $('save-status').textContent = !state.corpus ? 'Sin guardado automático' : state.saved ? 'Archivo abierto · solo lectura' : state.dirty ? 'Cambios sin descargar' : state.downloaded ? 'Descarga solicitada · comprueba el archivo' : 'Sin guardado automático';
  $('export').textContent = state.downloaded && state.dirty ? 'Descargar versión actual' : 'Descargar archivo';
  document.querySelector('.workspace').setAttribute('aria-busy', String(state.busy));
  updateGuide();
}
function updateGuide() {
  let title, description, label, action;
  if (state.busy) {
    title = 'La IA está trabajando'; description = 'Puedes leer las vistas. Espera antes de iniciar otra acción. Mantén esta página abierta.'; label = 'En curso…';
  } else if (!state.corpus) {
    if (!state.connected) { title = 'Empieza por conectar la IA'; description = 'Conectar no consume crédito. También puedes abrir un archivo guardado sin conectar.'; label = 'Conectar IA'; action = () => $('configure').click(); }
    else if (!state.enabled) { title = 'IA desactivada en el servidor'; description = 'Puedes revisar un archivo guardado. Las búsquedas requieren que la IA esté habilitada.'; label = 'Abrir archivo guardado'; action = () => $('import').click(); }
    else { title = 'Introduce la noticia de partida'; description = 'Pega un enlace o texto. Después pulsa “Buscar y comparar con IA”.'; label = 'Ir a la noticia'; action = () => $('news-input').focus(); }
  } else if (state.saved) {
    title = 'Estás leyendo un archivo guardado'; description = 'Explora las tres vistas sin consumir IA. El contenido disponible depende de lo que se guardó.';
    label = state.view === 'coverage' && state.answer ? 'Ver respuesta guardada' : state.view === 'response' ? 'Revisar citas' : 'Ver fuentes';
    action = () => goTo(state.view === 'coverage' && state.answer ? 'response' : state.view === 'response' ? 'evidence' : 'coverage');
    if (!state.answer) {
      title = 'Este archivo contiene solo coberturas'; description = 'Puedes leerlas en el paso 1. Para generar una respuesta, inicia una nueva búsqueda.';
      label = 'Nueva búsqueda'; action = () => $('new-run').click();
    }
  } else if (!state.selected.size) {
    title = 'Elige al menos una fuente con texto'; description = 'Las fuentes sin texto suficiente no se pueden usar. Si no hay ninguna disponible, inicia otra búsqueda.'; label = 'Revisar fuentes'; action = () => goTo('coverage');
  } else if (!state.answer || !answerIsCurrent()) {
    title = state.answer ? 'Tu respuesta anterior sigue disponible' : `${state.selected.size} fuentes listas para tu pregunta`;
    description = state.answer ? 'Cambiaste la pregunta o las fuentes. Genera otra respuesta cuando estés conforme.' : 'Revisa las casillas “Usar en respuesta”. Después escribe tu pregunta en el paso 2.';
    label = 'Ir a la pregunta'; action = () => { goTo('response'); $('question').focus(); };
  } else if (state.view !== 'evidence') {
    title = 'La respuesta está lista para revisar'; description = 'Comprueba los fragmentos que respaldan cada afirmación. Revisarlos no consume IA.'; label = 'Revisar citas'; action = () => goTo('evidence');
  } else {
    title = state.omissions ? 'Revisa los matices antes de terminar' : 'Revisa las citas; las omisiones son opcionales';
    description = 'Si quieres conservar este trabajo, descarga un archivo. No necesitas descargar para cambiar de vista.'; label = 'Descargar archivo'; action = downloadArchive;
  }
  $('next-title').textContent = title; $('next-description').textContent = description;
  $('next-action').textContent = label; $('next-action').disabled = state.busy; $('next-action').onclick = action;
}
function goTo(name) {
  tab(name, true); $(name).scrollIntoView({ block: 'start', behavior: 'auto' });
}
function markChanged() { if (state.corpus && !state.saved) state.dirty = true; }
function tab(name, focus = false) {
  state.view = name; updateGuide();
  for (const b of document.querySelectorAll('[data-tab]')) {
    const active = b.dataset.tab === name; b.setAttribute('aria-selected', String(active)); b.tabIndex = active ? 0 : -1;
    $(b.dataset.tab).hidden = !active;
    if (active && focus) b.focus();
  }
}
for (const b of document.querySelectorAll('[data-tab]')) {
  b.addEventListener('click', () => tab(b.dataset.tab));
  b.addEventListener('keydown', e => {
    const names = ['coverage', 'response', 'evidence']; let index = names.indexOf(b.dataset.tab);
    if (e.key === 'ArrowRight') index = (index + 1) % 3;
    else if (e.key === 'ArrowLeft') index = (index + 2) % 3;
    else if (e.key === 'Home') index = 0; else if (e.key === 'End') index = 2; else return;
    e.preventDefault(); tab(names[index], true);
  });
}
function sourceById(id) { return state.corpus.articles.find(a => a.id === id); }
function quoteBlock(e) {
  const a = sourceById(e.sourceId); const block = el('blockquote', undefined, 'quote');
  block.append(el('span', 'Cita del medio · fragmento literal', 'content-label source-label'), el('div', `“${e.quote}”`), safeLink(`${a.id.toUpperCase()} · ${a.medium || new URL(a.url).hostname} ↗`, a.url));
  return block;
}
function observation(item, { folded = false } = {}) {
  const node = el('div', undefined, 'observation'); const p = el('p', item.text);
  const quotes = folded ? el('details') : el('div');
  if (folded) quotes.append(el('summary', 'Ver fragmentos de respaldo'));
  const used = new Set();
  for (const e of item.evidence) {
    const block = quoteBlock(e); quotes.append(block);
    if (used.has(e.sourceId)) continue; used.add(e.sourceId);
    const citation = el('button', `[${e.sourceId.toUpperCase()}]`, 'inline-citation');
    citation.setAttribute('aria-label', `Ver fragmento de ${e.sourceId.toUpperCase()} que respalda esta afirmación`);
    citation.addEventListener('click', () => {
      if (folded) quotes.open = true;
      block.tabIndex = -1; block.focus(); block.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    });
    p.append(citation);
  }
  node.append(p, quotes); return node;
}
function observationList(parent, items, empty = 'Sin evidencia suficiente para señalar un hallazgo.') {
  if (!items?.length) { parent.append(el('p', empty, 'small-note')); return; }
  for (const item of items) parent.append(observation(item));
}
function emptyCoverage() {
  const wrap = el('div'); const intro = el('div', undefined, 'empty-intro');
  intro.append(el('h2', 'El recorrido, a la vista.'), el('p', 'Conecta la demo para empezar, o abre una ejecución guardada.'));
  const grid = el('div', undefined, 'journey');
  for (const [symbol, title, text] of [['≋', 'Las distintas miradas', 'Revisa qué cuenta cada publicación y elige las fuentes.'], ['↗', 'La respuesta que construye', 'Observa cómo la IA conecta la información seleccionada.'], ['◎', 'Los matices que quedan fuera', 'Vuelve a los textos y examina las decisiones de síntesis.']]) {
    const card = el('article'); card.append(el('span', symbol, 'glyph'), el('h3', title), el('p', text)); grid.append(card);
  }
  wrap.append(intro, grid); return wrap;
}
function renderCoverage() {
  const root = $('coverage-content'); root.replaceChildren();
  if (!state.corpus) { root.append(emptyCoverage()); return; }
  const c = state.corpus; const event = el('div', undefined, 'event-card');
  event.append(el('p', 'IDENTIFICACIÓN GENERADA POR IA · COMPRUEBA EL ACONTECIMIENTO', 'eyebrow'), el('h2', c.event.name));
  const meta = el('div', undefined, 'event-meta');
  meta.append(el('span', `Fecha del acontecimiento: ${c.event.date || 'no confirmada'}`), el('span', c.event.people.join(' · ')));
  event.append(meta);
  for (const uncertainty of c.event.uncertainties) event.append(el('p', uncertainty, 'uncertainty'));
  const input = el('details', undefined, 'seed-details'); input.append(el('summary', 'Ver la noticia de partida'), el('p', c.input)); event.append(input);
  root.append(event);
  const legend = el('div', undefined, 'content-legend');
  legend.append(el('span', 'FUENTE · Texto extraído del medio', 'content-label source-label'), el('span', 'IA · Resumen e interpretación', 'content-label ai-label'));
  root.append(legend, el('p', state.saved ? 'Archivo de solo lectura. Las casillas muestran la selección guardada.' : 'Las fuentes con texto están seleccionadas al inicio. Desmarca las que no quieras usar. Leer los textos y cambiar la selección no consume IA.', 'section-note'));
  const heading = el('div', undefined, 'section-heading'); heading.append(el('h2', `${c.articles.length} coberturas para examinar.`), el('span', state.saved ? 'Selección guardada · solo lectura' : 'Selecciona las fuentes antes de generar', 'small-note')); root.append(heading);
  if (c.articles.length < 4) root.append(el('p', 'La búsqueda encontró menos de cuatro publicaciones verificables. No se completó la lista con resultados ajenos.', 'section-note'));
  const grid = el('div', undefined, 'sources-grid');
  for (const a of c.articles) {
    const card = el('article', undefined, `source-card${state.selected.has(a.id) ? ' selected' : ''}`);
    const top = el('div', undefined, 'source-top'); top.append(el('span', `${a.id.toUpperCase()} · ${a.medium || new URL(a.url).hostname}`, 'source-id'));
    const label = el('label', undefined, 'select-source'); const box = el('input'); box.type = 'checkbox'; box.dataset.source = a.id;
    box.dataset.readable = String(a.access !== 'unavailable' && a.text.length >= 80); box.checked = state.selected.has(a.id); box.setAttribute('aria-label', `${state.saved ? (state.selected.has(a.id) ? 'Seleccionada' : 'No seleccionada') : 'Usar en respuesta'}: ${a.id.toUpperCase()} · ${a.medium || new URL(a.url).hostname} · ${a.title}`);
    box.addEventListener('change', () => { box.checked ? state.selected.add(a.id) : state.selected.delete(a.id); markChanged();
      card.classList.toggle('selected', box.checked); renderAnswer(); renderEvidence(); controls(); });
    label.append(box, document.createTextNode(state.saved ? (state.selected.has(a.id) ? 'Seleccionada' : 'No seleccionada') : 'Usar en respuesta')); top.append(label); card.append(top);
    const h = el('h3'); h.append(safeLink(a.title || 'Abrir publicación', a.url)); card.append(h);
    card.append(el('p', `Publicación: ${a.date || 'fecha no disponible'}${a.dateOrigin === 'search' ? ' · fecha aportada por la búsqueda' : ''}`, 'metadata'));
    card.append(el('span', { read: 'Texto disponible', partial: 'Acceso parcial', unavailable: 'No se pudo leer' }[a.access], `access ${a.access}`));
    card.append(el('p', a.accessNote, 'small-note'));
    if (a.access === 'unavailable' || a.text.length < 80) card.append(el('p', 'No seleccionable: falta texto suficiente para generar una respuesta.', 'small-note'));
    card.append(safeLink('Abrir publicación original ↗', a.url, 'original-link'));
    if (a.analysis) {
      const details = el('details'); details.append(el('summary', 'IA · Ver análisis de esta cobertura'));
      for (const [key, title] of [['facts', 'Hechos destacados'], ['voices', 'Voces y fuentes utilizadas'], ['context', 'Contexto que aporta'], ['focus', 'Enfoque'], ['agency', 'Posibles reproducciones o agencias']]) {
        details.className = 'ai-analysis'; details.append(el('h4', title, 'analysis-heading')); observationList(details, a.analysis[key]);
      }
      card.append(details);
    }
    if (a.text) { const details = el('details'); details.append(el('summary', 'FUENTE · Leer texto extraído del medio'), el('div', a.text, 'read-text')); card.append(details); }
    grid.append(card);
  }
  root.append(grid);
  const compare = el('section', undefined, 'comparison'); compare.append(el('span', 'GENERADO POR IA', 'content-label ai-label'), el('h2', 'Comparación de coberturas'), el('p', 'Interpretación de la IA sobre todas las coberturas encontradas. Cambiar la selección solo afecta a la respuesta del paso 2.', 'section-note'));
  const comparisonGrid = el('div', undefined, 'comparison-grid');
  for (const [key, title] of [['agreements', 'Coincidencias'], ['differences', 'Diferencias'], ['contradictions', 'Contradicciones']]) {
    const column = el('div'); column.append(el('h3', title)); observationList(column, c.comparison[key]); comparisonGrid.append(column);
  }
  compare.append(comparisonGrid); root.append(compare);
  const next = el('div', undefined, 'action-row'); next.append(el('p', 'Revisa la selección. Cada artículo puede aportar una voz distinta.'));
  const button = el('button', state.saved ? 'Ver respuesta guardada →' : 'Ir al paso 2: tu pregunta →', 'primary'); button.addEventListener('click', () => { goTo('response'); }); next.append(button); root.append(next);
}
function renderAnswer() {
  const root = $('answer-content'); root.replaceChildren();
  if (!state.answer) { root.append(el('p', state.saved ? 'Este archivo no incluye una respuesta. Puedes leer sus fuentes o iniciar una nueva búsqueda.' : state.corpus ? 'Selecciona las fuentes y genera una respuesta para explorarla aquí.' : 'Primero busca una noticia y revisa sus coberturas.', 'empty-note')); return; }
  if (!answerIsCurrent()) root.append(el('p', state.saved ? 'Respuesta anterior: el archivo conserva una pregunta o selección distinta de la usada para generarla. Esta vista es de solo lectura.' : 'Respuesta anterior: corresponde a otra pregunta o selección. Se conserva para que puedas leerla. Genera otra respuesta para aplicar tus cambios.', 'stale-note'));
  const sheet = el('article', undefined, 'answer-sheet'); sheet.append(el('p', 'RESPUESTA DE IA · REFERENCIAS JUNTO A CADA AFIRMACIÓN', 'eyebrow'));
  sheet.append(el('p', `Pregunta respondida: ${state.answer.question}`, 'answered-question'));
  if (!state.answer.claims.length) sheet.append(el('p', 'Las fuentes seleccionadas no ofrecen evidencia suficiente para responder esta pregunta.', 'callout'));
  for (const claim of state.answer.claims) sheet.append(observation(claim, { folded: true }));
  sheet.append(el('p', 'Los fragmentos se comprobaron contra el texto leído. Revisa también si respaldan la interpretación de la IA.', 'small-note'));
  root.append(sheet);
  const row = el('div', undefined, 'action-row'); row.append(el('p', 'Una síntesis siempre selecciona. Ahora podemos examinar esa selección.'));
  const button = el('button', 'Examinar fuentes y omisiones →', 'primary'); button.addEventListener('click', () => { goTo('evidence'); }); row.append(button); root.append(row);
}
function appendSaveAction(root) {
  const row = el('div', undefined, 'action-row save-result');
  row.append(el('p', state.saved ? 'Este contenido ya procede de un archivo. Solo descarga si necesitas otra copia.' : '¿Quieres conservar el trabajo? Descarga una copia antes de cerrar. Puedes seguir revisando sin guardar.'));
  const button = el('button', 'Descargar archivo', 'secondary'); button.disabled = state.busy;
  button.dataset.download = 'true'; button.addEventListener('click', downloadArchive); row.append(button); root.append(row);
}
function renderEvidence() {
  const root = $('evidence-content'); root.replaceChildren();
  if (!state.answer) { root.append(el('p', state.saved ? 'Este archivo no incluye una respuesta ni un mapa de citas. Puedes revisar sus fuentes en el paso 1.' : 'Genera primero una respuesta. Aquí verás qué fuente respalda cada afirmación.', 'empty-note')); return; }
  if (!answerIsCurrent()) root.append(el('p', state.saved ? 'Estas citas y omisiones corresponden a la respuesta anterior guardada en este archivo.' : 'Estas citas y omisiones corresponden a la respuesta anterior. Genera otra respuesta para aplicar la pregunta o selección actual.', 'stale-note'));
  root.append(el('h3', 'Citas de la respuesta'), el('p', 'Cada fragmento procede del texto disponible del medio. Comprueba si respalda la afirmación de la IA.', 'section-note'));
  const grid = el('div', undefined, 'evidence-map');
  for (const a of state.corpus.articles) {
    const card = el('article', undefined, 'evidence-card'); const h = el('h3'); h.append(safeLink(`${a.id.toUpperCase()} · ${a.medium}`, a.url)); card.append(h);
    const claims = state.answer.claims.filter(c => c.evidence.some(e => e.sourceId === a.id));
    const selected = state.answer.selectedIds.includes(a.id);
    card.append(el('p', !selected ? 'No seleccionada: fuera del alcance de esta síntesis.' : claims.length ? `Citada en ${claims.length} afirmación${claims.length === 1 ? '' : 'es'}.` : 'Seleccionada, pero no citada en la respuesta.', 'small-note'));
    for (const claim of claims) { card.append(el('p', claim.text)); for (const e of claim.evidence.filter(e => e.sourceId === a.id)) card.append(quoteBlock(e)); }
    grid.append(card);
  }
  root.append(grid);
  if (!state.omissions) {
    root.append(el('p', state.saved ? 'Esta ejecución guardada no incluye un análisis de omisiones. Se mantiene como respaldo sin nuevas llamadas.' : 'Pulsa “Analizar omisiones con IA” para contrastar la síntesis con los textos seleccionados. Esta acción realiza una llamada a la IA.', 'callout')); appendSaveAction(root); return;
  }
  root.append(el('span', 'GENERADO POR IA · INTERPRETACIÓN', 'content-label ai-label'));
  const columns = el('div', undefined, 'omission-grid');
  for (const [key, title] of [['omissions', 'Matices que no llegaron a la respuesta'], ['context', 'Contexto para seguir leyendo']]) {
    const section = el('section'); section.append(el('h3', title)); observationList(section, state.omissions[key], 'No se identificaron observaciones con respaldo suficiente. Esto no prueba que la síntesis sea exhaustiva.'); columns.append(section);
  }
  root.append(columns, el('p', 'Este análisis cubre únicamente los textos disponibles de las fuentes seleccionadas. La identificación de omisiones es interpretativa y puede ser incompleta.', 'section-note')); appendSaveAction(root);
}
function render() {
  renderCoverage(); renderAnswer(); renderEvidence(); controls();
  $('new-run').hidden = !state.corpus; $('entry-panel').hidden = Boolean(state.corpus); document.body.classList.toggle('has-corpus', Boolean(state.corpus));
  $('execution-label').textContent = state.corpus ? `${state.saved ? 'Archivo guardado' : 'Búsqueda actual'} · ${new Date(state.corpus.createdAt).toLocaleString('es-CL')}` : 'Sin búsqueda activa';
  $('execution-label').classList.toggle('saved-banner', state.saved);
}
async function api(action, body) {
  if (state.busy || !state.enabled) return;
  state.busy = true; controls(); showError(''); progress('Conectando con el servidor…');
  try {
    const response = await fetch(`${state.base}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${state.access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, requestId: crypto.randomUUID() }), signal: AbortSignal.timeout(420000) });
    if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || `El servidor devolvió HTTP ${response.status}.`); }
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = ''; let result;
    const consume = line => { if (!line.trim()) return; const event = JSON.parse(line);
      if (event.type === 'progress') progress(event.message);
      if (event.type === 'error') throw new Error(event.message);
      if (event.type === 'result') result = event;
    };
    try {
      for (;;) { const { done, value } = await reader.read(); if (done) break;
        pending += decoder.decode(value, { stream: true });
        if (pending.length > 1500000) throw new Error('La respuesta supera el tamaño esperado.');
        const lines = pending.split('\n'); pending = lines.pop(); for (const line of lines) consume(line);
      }
      pending += decoder.decode(); consume(pending);
    } finally { await reader.cancel().catch(() => {}); }
    if (!result) throw new Error('La conexión terminó antes de entregar un resultado. No se reintentó.');
    progress('Operación terminada. Revisa la evidencia antes de continuar.'); return result;
  } catch (error) {
    showError(error.name === 'TimeoutError' || error instanceof TypeError ? 'La conexión se interrumpió. No se reintentó; la operación podría haber consumido crédito. Revisa el servidor o abre un respaldo.' : error.message);
    progress(''); return null;
  } finally { state.busy = false; controls(); $('feedback').classList.remove('busy'); }
}
$('search-form').addEventListener('submit', async e => {
  e.preventDefault(); const input = $('news-input').value.trim();
  if (input.length < 20) { showError('Pega una URL completa o un texto de al menos 20 caracteres.'); return; }
  if (!(await confirmReplace())) return;
  const result = await api('search', { input }); if (!result) return;
  state.corpus = result.corpus; state.selected = new Set(result.corpus.articles.filter(a => a.access !== 'unavailable' && a.text.length >= 80).map(a => a.id));
  state.answer = null; state.omissions = null; state.saved = false; state.dirty = true; state.downloaded = false; render(); goTo('coverage'); progress('Coberturas listas. Revisa las fuentes y continúa al paso 2.');
});
$('generate').addEventListener('click', async () => {
  if ($('generate').disabled) return;
  const result = await api('generate', { corpus: state.corpus, selectedIds: [...state.selected], question: $('question').value.trim() });
  if (!result) return;
  state.answer = result.answer; state.omissions = null; markChanged(); renderAnswer(); renderEvidence(); controls();
  progress('Respuesta generada. Revisa sus citas en el paso 3.'); $('answer-content').focus();
});
$('question').addEventListener('input', () => { markChanged(); renderAnswer(); renderEvidence(); controls(); });
$('news-input').addEventListener('input', controls);
$('find-omissions').addEventListener('click', async () => {
  if ($('find-omissions').disabled) return;
  const result = await api('omissions', { corpus: state.corpus, answer: state.answer });
  if (!result) return; state.omissions = result.omissions; markChanged(); renderEvidence(); controls();
  progress('Análisis de omisiones listo. Revisa los fragmentos antes de conservar el resultado.');
  const resultNode = $('evidence-content').querySelector('.omission-grid'); resultNode.tabIndex = -1; resultNode.focus();
});
$('new-run').addEventListener('click', async () => {
  if (!(await confirmReplace())) return;
  Object.assign(state, { corpus: null, answer: null, omissions: null, selected: new Set(), saved: false, dirty: false, downloaded: false });
  $('question').value = '¿Qué ocurrió y por qué importa?'; $('news-input').value = ''; showError(''); progress(''); render(); tab('coverage'); $('news-input').focus();
});
function downloadArchive() {
  if (state.busy || !state.corpus) return;
  // The previous answer keeps its own question and source IDs when the draft changes.
  const data = { format: 'news-compass', version: 1, savedAt: new Date().toISOString(), corpus: state.corpus, answer: state.answer,
    omissions: state.omissions, selectedIds: [...state.selected], question: $('question').value };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
  const a = el('a'); a.href = url; a.download = `news-compass-${new Date().toISOString().replace(/[:.]/g, '-')}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  state.dirty = false; state.downloaded = true; controls();
  progress('Descarga solicitada. Comprueba que el archivo JSON esté en tus descargas. Si cancelaste la descarga, pulsa “Descargar archivo” de nuevo.');
}
$('export').addEventListener('click', downloadArchive);
function confirmReplace() {
  if (!state.dirty) return Promise.resolve(true);
  return new Promise(resolve => {
    const dialog = $('replace-dialog'); dialog.returnValue = 'cancel';
    $('replace-status').textContent = ''; $('replace-continue').textContent = 'Continuar sin descargar';
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'continue'), { once: true });
    dialog.showModal();
  });
}
$('replace-cancel').addEventListener('click', () => $('replace-dialog').close('cancel'));
$('replace-continue').addEventListener('click', () => $('replace-dialog').close('continue'));
$('replace-download').addEventListener('click', () => {
  downloadArchive(); $('replace-status').textContent = 'Descarga solicitada. Comprueba el archivo antes de continuar.'; $('replace-continue').textContent = 'Ya tengo la copia: continuar';
});
window.addEventListener('beforeunload', e => { if (state.dirty || state.busy) { e.preventDefault(); e.returnValue = ''; } });
$('import').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async e => {
  const input = e.currentTarget;
  try {
    const file = input.files[0]; if (!file) return;
    if (file.size > 1500000) throw new Error('El archivo supera 1,5 MB.');
    const data = validateArchive(JSON.parse(await file.text()));
    if (!(await confirmReplace())) return;
    Object.assign(state, { corpus: data.corpus, answer: data.answer ?? null, omissions: data.omissions ?? null,
      selected: new Set(data.selectedIds ?? data.answer?.selectedIds ?? []), saved: true, dirty: false, downloaded: false });
    $('question').value = data.question || data.answer?.question || '¿Qué ocurrió y por qué importa?';
    $('news-input').value = data.corpus.input || ''; showError(''); progress('Archivo abierto en modo lectura. No se hicieron búsquedas ni llamadas a la IA.'); render(); goTo('coverage');
  } catch (error) { showError(`No se pudo abrir el respaldo: ${error.message}`); }
  finally { input.value = ''; }
});
$('configure').addEventListener('click', () => { $('server-url').value = state.base; $('settings-message').textContent = ''; $('settings').showModal(); });
$('close-settings').addEventListener('click', () => $('settings').close());
$('settings-form').addEventListener('submit', async e => {
  e.preventDefault(); $('connect').disabled = true; $('settings-message').textContent = 'Comprobando conexión sin consumir API…';
  try {
    const u = new URL($('server-url').value);
    if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname))) throw new Error('El servidor debe usar HTTPS.');
    if (u.username || u.password || u.search || u.hash || (u.pathname !== '/' && u.pathname !== '')) throw new Error('Usa la dirección base del servidor, sin ruta ni parámetros.');
    const base = u.origin; const access = $('access-code').value;
    const response = await fetch(`${base}/status`, { headers: { Authorization: `Bearer ${access}` }, signal: AbortSignal.timeout(12000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudo conectar.');
    Object.assign(state, { base, access, connected: true, enabled: data.enabled === true });
    $('access-code').value = ''; $('settings').close();
    $('connection-status').textContent = state.enabled ? 'IA conectada' : 'IA desactivada'; $('connection-status').classList.toggle('ready', state.enabled);
    $('configure').textContent = 'Conexión'; controls(); progress(state.enabled ? 'Conexión lista. Cada búsqueda o generación consume API. No se ha realizado ninguna llamada de pago al conectar.' : 'Servidor conectado. Las llamadas de pago están desactivadas; puedes abrir un respaldo.');
  } catch (error) { $('settings-message').textContent = error instanceof TypeError ? 'No se pudo contactar al servidor. Revisa la dirección y el origen permitido.' : error.message; }
  finally { $('connect').disabled = false; }
});
$('disconnect').addEventListener('click', () => { state.access = ''; state.enabled = false; state.connected = false; $('access-code').value = '';
  $('connection-status').textContent = 'IA sin conectar'; $('connection-status').classList.remove('ready'); $('configure').textContent = 'Conectar'; controls(); $('settings').close(); progress('Conexión cerrada. La ejecución permanece en esta página.'); });
$('projection').addEventListener('click', () => { const active = document.body.classList.toggle('projection'); $('projection').setAttribute('aria-pressed', String(active)); $('projection').textContent = active ? 'Salir de proyección' : 'Proyectar'; });
render();
