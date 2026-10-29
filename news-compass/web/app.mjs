import { DEFAULT_API_BASE } from './config.mjs';
import { validateArchive, publicURL } from './shared/evidence.mjs';

const $ = id => document.getElementById(id);
const state = { corpus: null, selected: new Set(), answer: null, omissions: null, saved: false, busy: false,
  base: DEFAULT_API_BASE, access: '', enabled: false, connected: false };
function el(tag, text, cls) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (cls) node.className = cls; return node; }
function safeLink(text, url, cls) {
  const a = el('a', text, cls); a.href = publicURL(url); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
}
function showError(message) { $('error').textContent = message; $('error').hidden = !message; }
function progress(message) { $('feedback').textContent = message; $('feedback').hidden = !message; $('feedback').classList.toggle('busy', state.busy); }
function controls() {
  $('search').disabled = state.busy || !state.enabled;
  $('generate').disabled = state.busy || !state.enabled || !state.selected.size || state.saved;
  $('find-omissions').disabled = state.busy || !state.enabled || !state.answer?.claims.length || Boolean(state.omissions) || state.saved;
  $('export').disabled = state.busy || !state.corpus;
  $('import').disabled = state.busy; $('new-run').disabled = state.busy;
  $('news-input').disabled = state.busy; $('question').disabled = state.busy || state.saved;
  $('configure').disabled = state.busy;
  $('selection-count').textContent = `${state.selected.size} fuente${state.selected.size === 1 ? '' : 's'} seleccionada${state.selected.size === 1 ? '' : 's'}`;
  $('source-count').textContent = state.corpus?.articles.length ?? '—';
  for (const box of document.querySelectorAll('[data-source]')) box.disabled = state.busy || state.saved || box.dataset.readable !== 'true';
}
function tab(name, focus = false) {
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
  block.append(el('div', `“${e.quote}”`), safeLink(`${a.id.toUpperCase()} · ${a.medium || new URL(a.url).hostname} ↗`, a.url));
  return block;
}
function observation(item, { folded = false } = {}) {
  const node = el('div', undefined, 'observation'); const p = el('p', item.text);
  const used = new Set();
  for (const e of item.evidence) {
    if (used.has(e.sourceId)) continue; used.add(e.sourceId);
    const a = sourceById(e.sourceId); p.append(safeLink(`[${e.sourceId.toUpperCase()}]`, a.url, 'inline-citation'));
  }
  node.append(p);
  const quotes = folded ? el('details') : el('div');
  if (folded) quotes.append(el('summary', 'Ver fragmentos de respaldo'));
  for (const e of item.evidence) quotes.append(quoteBlock(e));
  node.append(quotes); return node;
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
  event.append(el('p', 'ACONTECIMIENTO IDENTIFICADO · REVISA QUE LAS COBERTURAS CORRESPONDAN', 'eyebrow'), el('h2', c.event.name));
  const meta = el('div', undefined, 'event-meta');
  meta.append(el('span', `Fecha del acontecimiento: ${c.event.date || 'no confirmada'}`), el('span', c.event.people.join(' · ')));
  event.append(meta);
  for (const uncertainty of c.event.uncertainties) event.append(el('p', uncertainty, 'uncertainty'));
  root.append(event);
  const heading = el('div', undefined, 'section-heading'); heading.append(el('h2', `${c.articles.length} coberturas para examinar.`), el('span', 'Selecciona las fuentes antes de generar', 'small-note')); root.append(heading);
  if (c.articles.length < 4) root.append(el('p', 'La búsqueda encontró menos de cuatro publicaciones verificables. No se completó la lista con resultados ajenos.', 'section-note'));
  const grid = el('div', undefined, 'sources-grid');
  for (const a of c.articles) {
    const card = el('article', undefined, `source-card${state.selected.has(a.id) ? ' selected' : ''}`);
    const top = el('div', undefined, 'source-top'); top.append(el('span', `${a.id.toUpperCase()} · ${a.medium || new URL(a.url).hostname}`, 'source-id'));
    const label = el('label', undefined, 'select-source'); const box = el('input'); box.type = 'checkbox'; box.dataset.source = a.id;
    box.dataset.readable = String(a.access !== 'unavailable' && a.text.length >= 80); box.checked = state.selected.has(a.id); box.setAttribute('aria-label', `Seleccionar ${a.title}`);
    box.addEventListener('change', () => { box.checked ? state.selected.add(a.id) : state.selected.delete(a.id); state.answer = null; state.omissions = null;
      card.classList.toggle('selected', box.checked); renderAnswer(); renderEvidence(); controls(); });
    label.append(box, document.createTextNode('Usar')); top.append(label); card.append(top);
    const h = el('h3'); h.append(safeLink(a.title || 'Abrir publicación', a.url)); card.append(h);
    card.append(el('p', `Publicación: ${a.date || 'fecha no disponible'}${a.dateOrigin === 'search' ? ' · fecha aportada por la búsqueda' : ''}`, 'metadata'));
    card.append(el('span', { read: 'Texto disponible', partial: 'Acceso parcial', unavailable: 'No se pudo leer' }[a.access], `access ${a.access}`));
    card.append(el('p', a.accessNote, 'small-note'));
    if (a.analysis) {
      const details = el('details'); details.append(el('summary', 'Hechos, voces y enfoque'));
      for (const [key, title] of [['facts', 'Hechos destacados'], ['voices', 'Voces y fuentes utilizadas'], ['context', 'Contexto que aporta'], ['focus', 'Enfoque'], ['agency', 'Posibles reproducciones o agencias']]) {
        details.append(el('h4', title, 'analysis-heading')); observationList(details, a.analysis[key]);
      }
      card.append(details);
    }
    if (a.text) { const details = el('details'); details.append(el('summary', 'Ver el texto que recibió la IA'), el('div', a.text, 'read-text')); card.append(details); }
    grid.append(card);
  }
  root.append(grid);
  const compare = el('section', undefined, 'comparison'); compare.append(el('h2', 'Lo que cambia entre coberturas.'));
  const comparisonGrid = el('div', undefined, 'comparison-grid');
  for (const [key, title] of [['agreements', 'Coincidencias'], ['differences', 'Diferencias'], ['contradictions', 'Contradicciones']]) {
    const column = el('div'); column.append(el('h3', title)); observationList(column, c.comparison[key]); comparisonGrid.append(column);
  }
  compare.append(comparisonGrid); root.append(compare);
  const next = el('div', undefined, 'action-row'); next.append(el('p', 'Revisa la selección. Cada artículo puede aportar una voz distinta.'));
  const button = el('button', 'Continuar a la respuesta →', 'primary'); button.addEventListener('click', () => { tab('response', true); $('response').scrollIntoView({ block: 'start', behavior: 'smooth' }); }); next.append(button); root.append(next);
}
function renderAnswer() {
  const root = $('answer-content'); root.replaceChildren();
  if (!state.answer) { root.append(el('p', state.corpus ? 'Selecciona las fuentes y genera una respuesta para explorarla aquí.' : 'Primero busca una noticia y revisa sus coberturas.', 'empty-note')); return; }
  const sheet = el('article', undefined, 'answer-sheet'); sheet.append(el('p', 'RESPUESTA DE IA · REFERENCIAS JUNTO A CADA AFIRMACIÓN', 'eyebrow'));
  if (!state.answer.claims.length) sheet.append(el('p', 'Las fuentes seleccionadas no ofrecen evidencia suficiente para responder esta pregunta.', 'callout'));
  for (const claim of state.answer.claims) sheet.append(observation(claim, { folded: true }));
  sheet.append(el('p', 'Los fragmentos se comprobaron contra el texto leído. Revisa también si respaldan la interpretación de la IA.', 'small-note'));
  root.append(sheet);
  const row = el('div', undefined, 'action-row'); row.append(el('p', 'Una síntesis siempre selecciona. Ahora podemos examinar esa selección.'));
  const button = el('button', 'Examinar fuentes y omisiones →', 'primary'); button.addEventListener('click', () => { tab('evidence', true); $('evidence').scrollIntoView({ block: 'start', behavior: 'smooth' }); }); row.append(button); root.append(row);
}
function renderEvidence() {
  const root = $('evidence-content'); root.replaceChildren();
  if (!state.answer) { root.append(el('p', 'Genera primero una respuesta. Aquí verás qué fuente respalda cada afirmación.', 'empty-note')); return; }
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
    root.append(el('p', state.saved ? 'Esta ejecución guardada no incluye un análisis de omisiones. Se mantiene como respaldo sin nuevas llamadas.' : 'Pulsa “¿Qué quedó fuera?” para contrastar la síntesis con los textos seleccionados. Esta acción realiza una llamada a la IA.', 'callout')); return;
  }
  const columns = el('div', undefined, 'omission-grid');
  for (const [key, title] of [['omissions', 'Matices que no llegaron a la respuesta'], ['context', 'Contexto para seguir leyendo']]) {
    const section = el('section'); section.append(el('h3', title)); observationList(section, state.omissions[key], 'No se identificaron observaciones con respaldo suficiente. Esto no prueba que la síntesis sea exhaustiva.'); columns.append(section);
  }
  root.append(columns, el('p', 'Este análisis cubre únicamente los textos disponibles de las fuentes seleccionadas. La identificación de omisiones es interpretativa y puede ser incompleta.', 'section-note'));
}
function render() {
  renderCoverage(); renderAnswer(); renderEvidence(); controls();
  $('new-run').hidden = !state.corpus;
  $('execution-label').textContent = state.corpus ? `${state.saved ? 'Ejecución guardada' : 'Ejecución en vivo'} · ${new Date(state.corpus.createdAt).toLocaleString('es-CL')}` : 'Sin ejecución activa';
  $('execution-label').classList.toggle('saved-banner', state.saved);
}
async function api(action, body) {
  if (state.busy) return;
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
  const result = await api('search', { input }); if (!result) return;
  state.corpus = result.corpus; state.selected = new Set(result.corpus.articles.filter(a => a.access !== 'unavailable' && a.text.length >= 80).map(a => a.id));
  state.answer = null; state.omissions = null; state.saved = false; render(); tab('coverage'); $('coverage').scrollIntoView({ block: 'start', behavior: 'smooth' });
});
$('generate').addEventListener('click', async () => { const result = await api('generate', { corpus: state.corpus, selectedIds: [...state.selected], question: $('question').value });
  if (!result) return; state.answer = result.answer; state.omissions = null; renderAnswer(); renderEvidence(); controls(); });
$('question').addEventListener('input', () => { if (state.answer) { state.answer = null; state.omissions = null; renderAnswer(); renderEvidence(); controls(); } });
$('find-omissions').addEventListener('click', async () => { const result = await api('omissions', { corpus: state.corpus, answer: state.answer });
  if (!result) return; state.omissions = result.omissions; renderEvidence(); controls(); });
$('new-run').addEventListener('click', () => { Object.assign(state, { corpus: null, answer: null, omissions: null, selected: new Set(), saved: false });
  $('question').value = '¿Qué ocurrió y por qué importa?'; $('news-input').value = ''; showError(''); progress(''); render(); tab('coverage'); $('news-input').focus(); });
$('export').addEventListener('click', () => {
  const data = { format: 'news-compass', version: 1, savedAt: new Date().toISOString(), corpus: state.corpus, answer: state.answer,
    omissions: state.omissions, selectedIds: [...state.selected], question: $('question').value };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
  const a = el('a'); a.href = url; a.download = `news-compass-${new Date().toISOString().replace(/[:.]/g, '-')}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  progress('Ejecución exportada. Guarda el archivo como respaldo privado para la charla.');
});
$('import').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async e => {
  try {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 1500000) throw new Error('El archivo supera 1,5 MB.');
    const data = validateArchive(JSON.parse(await file.text()));
    Object.assign(state, { corpus: data.corpus, answer: data.answer ?? null, omissions: data.omissions ?? null,
      selected: new Set(data.answer?.selectedIds ?? data.selectedIds ?? []), saved: true });
    $('question').value = data.answer?.question || data.question || '¿Qué ocurrió y por qué importa?';
    $('news-input').value = data.corpus.input || ''; showError(''); progress('Ejecución guardada abierta. No se hicieron búsquedas ni llamadas a la IA.'); render(); tab('coverage');
  } catch (error) { showError(`No se pudo abrir el respaldo: ${error.message}`); }
  finally { e.target.value = ''; }
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
