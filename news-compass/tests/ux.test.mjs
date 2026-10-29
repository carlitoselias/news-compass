import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { publicURL, validateArchive } from '../shared/evidence.mjs';
import { corpus, item } from './fixtures.mjs';
const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
const script = (await readFile(new URL('../web/app.mjs', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, '');
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup() {
  const { document, window } = parseHTML(html);
  window.HTMLElement.prototype.scrollIntoView = function () {};
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = value => { dialog.open = false; dialog.returnValue = value; dialog.dispatchEvent(new window.Event('close')); };
  }
  const blobs = []; const calls = [];
  class TestURL extends URL {
    static createObjectURL(blob) { blobs.push(blob); return 'blob:test'; }
    static revokeObjectURL() {}
  }
  const context = vm.createContext({ document, window, URL: TestURL, Blob, Set, Date, publicURL, validateArchive,
    DEFAULT_API_BASE: '', setTimeout: () => {}, TextDecoder, AbortSignal, crypto,
    fetch: async (...args) => { calls.push(args); throw new Error('Fallo de prueba'); } });
  vm.runInContext(script, context);
  const run = code => vm.runInContext(code, context);
  const $ = id => document.getElementById(id);
  const change = id => $(id).dispatchEvent(new window.Event('input'));
  const load = () => {
    context.fixture = { corpus: corpus(), answer: { question: '¿Qué ocurrió?', selectedIds: ['s1'], claims: [item()] }, omissions: { omissions: [], context: [] } };
    run("Object.assign(state, fixture, {selected:new Set(['s1']), connected:true, enabled:true}); $('question').value='¿Qué ocurrió?'; render();");
  };
  return { document, window, context, calls, blobs, run, $, change, load };
}

test('initial guide explains connection and all locked actions', () => {
  const ui = setup();
  assert.equal(ui.$('search').disabled, true);
  assert.match(ui.$('input-hint').textContent, /Conectar IA/);
  assert.match(ui.$('generate-help').textContent, /Primero/);
  assert.match(ui.$('save-status').textContent, /Sin guardado automático/);
  ui.$('next-action').click(); assert.equal(ui.$('settings').open, true);
});

test('editing the question preserves the old answer and prevents mismatched omissions', () => {
  const ui = setup(); ui.load();
  ui.$('question').value = '¿Quién participa?'; ui.change('question');
  assert.equal(ui.run('state.answer.claims.length'), 1);
  assert.equal(ui.run('state.dirty'), true);
  assert.equal(ui.$('find-omissions').disabled, true);
  assert.match(ui.$('answer-content').textContent, /Respuesta anterior/);
  assert.match(ui.$('answer-content').textContent, /Pregunta respondida: ¿Qué ocurrió\?/);
  ui.$('question').value = '¿Qué ocurrió?'; ui.change('question');
  assert.equal(ui.run('answerIsCurrent()'), true);
  assert.equal(ui.document.querySelector('.stale-note'), null);
});

test('source changes preserve results and mark them as previous', () => {
  const ui = setup(); ui.load();
  const box = ui.document.querySelector('[data-source="s1"]'); box.checked = false; box.dispatchEvent(new ui.window.Event('change'));
  assert.equal(ui.run('state.selected.size'), 0);
  assert.equal(ui.run('state.answer.claims.length'), 1);
  assert.equal(ui.$('generate').disabled, true);
  assert.match(ui.$('generate-help').textContent, /al menos una/);
  assert.match(ui.$('next-title').textContent, /al menos una/);
});

test('citation opens its exact local evidence and makes zero requests', () => {
  const ui = setup(); ui.load();
  const details = ui.$('answer-content').querySelector('details');
  ui.$('answer-content').querySelector('.inline-citation').click();
  assert.equal(details.open, true);
  assert.match(details.textContent, /Cita del medio · fragmento literal/);
  assert.equal(ui.calls.length, 0);
});

test('cancel replacement keeps work; download retains draft and original answer separately', async () => {
  const ui = setup(); ui.load();
  ui.$('question').value = 'Una pregunta nueva'; ui.change('question');
  ui.$('new-run').click(); assert.equal(ui.$('replace-dialog').open, true);
  ui.$('replace-cancel').click(); await tick();
  assert.ok(ui.run('state.corpus'));
  ui.$('export').click();
  const data = JSON.parse(await ui.blobs[0].text()); validateArchive(data);
  assert.equal(data.question, 'Una pregunta nueva'); assert.equal(data.answer.question, '¿Qué ocurrió?');
  assert.equal(data.access, undefined); assert.equal(data.base, undefined);
  assert.match(ui.$('save-status').textContent, /Descarga solicitada/);
  assert.equal(ui.run('state.dirty'), false);
  ui.$('question').value = 'Otra pregunta nueva'; ui.change('question');
  assert.equal(ui.$('export').textContent, 'Descargar versión actual');
  ui.$('new-run').click(); ui.$('replace-continue').click(); await tick();
  assert.equal(ui.run('state.corpus'), null);
});

test('failed generation preserves the old answer and re-enables controls without retries', async () => {
  const ui = setup(); ui.load();
  ui.$('generate').click(); await tick();
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.run('state.answer.claims.length'), 1);
  assert.equal(ui.$('generate').disabled, false);
  assert.match(ui.$('error').textContent, /Fallo de prueba/);
});

test('busy state prevents duplicate requests and warns before closing', async () => {
  const ui = setup(); ui.load();
  ui.run('state.busy = true; controls();');
  assert.equal(ui.$('next-action').disabled, true);
  assert.equal(ui.$('generate').disabled, true);
  assert.equal(ui.$('import').disabled, true);
  await ui.run("api('generate', {})"); assert.equal(ui.calls.length, 0);
  const event = new ui.window.Event('beforeunload', { cancelable: true }); ui.window.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
});

test('read-only archive states explain missing results and never enable AI actions', () => {
  const ui = setup(); ui.load(); ui.run('state.saved = true; state.omissions = null; render();');
  assert.equal(ui.$('generate').disabled, true); assert.equal(ui.$('find-omissions').disabled, true);
  assert.match(ui.$('generate-help').textContent, /modo lectura/);
  assert.match(ui.$('omissions-help').textContent, /no incluye omisiones/);
  assert.equal(ui.document.querySelector('[data-source]').disabled, true);
  assert.match(ui.$('save-status').textContent, /solo lectura/);
});

test('invalid imports preserve the current corpus', async () => {
  const ui = setup(); ui.load();
  const file = ui.$('import-file'); file.files = [{ size: 20, text: async () => '{"format":"wrong"}' }];
  file.dispatchEvent(new ui.window.Event('change')); await tick();
  assert.equal(ui.run('state.corpus.id'), 'test-corpus');
  assert.match(ui.$('error').textContent, /No se pudo abrir/);
});

test('draft archive validation rejects non-text questions and unavailable draft selections', () => {
  const data = { format: 'news-compass', version: 1, corpus: corpus(), question: 2 };
  assert.throws(() => validateArchive(data)); data.question = 'Pregunta'; data.selectedIds = ['s9'];
  assert.throws(() => validateArchive(data)); data.selectedIds = [];
  assert.equal(validateArchive(data), data);
});

test('keyboard navigation updates active tab and its tab stop', () => {
  const ui = setup();
  const event = new ui.window.Event('keydown', { cancelable: true }); event.key = 'ArrowRight'; ui.$('tab-coverage').dispatchEvent(event);
  assert.equal(ui.$('tab-response').getAttribute('aria-selected'), 'true');
  assert.equal(ui.$('response').hidden, false); assert.equal(ui.$('coverage').hidden, true);
  assert.equal(ui.$('tab-coverage').getAttribute('tabindex'), '-1');
});
test('a partial archive explains absence of a response and offers a new search', () => {
  const ui = setup(); ui.load(); ui.run('state.saved = true; state.answer = null; state.omissions = null; render();');
  assert.match(ui.$('next-title').textContent, /solo coberturas/);
  assert.equal(ui.$('next-action').textContent, 'Nueva búsqueda');
  assert.match(ui.$('answer-content').textContent, /no incluye una respuesta/);
  assert.match(ui.$('omissions-help').textContent, /no contiene una respuesta/);
});

test('archive round trip preserves an edited draft alongside its previous answer', async () => {
  const ui = setup(); ui.load(); ui.$('question').value = 'Nueva pregunta sin generar'; ui.change('question'); ui.$('export').click();
  const saved = await ui.blobs[0].text();
  const restored = setup(); const input = restored.$('import-file'); input.files = [{size:saved.length, text:async()=>saved}];
  input.dispatchEvent(new restored.window.Event('change')); await tick();
  assert.equal(restored.$('question').value, 'Nueva pregunta sin generar');
  assert.match(restored.$('answer-content').textContent, /Pregunta respondida: ¿Qué ocurrió\?/);
  assert.match(restored.$('answer-content').textContent, /Respuesta anterior/);
  assert.equal(restored.$('generate').disabled, true);
  assert.equal(restored.calls.length, 0);
});

test('source controls distinguish publications with identical headlines', () => {
  const ui = setup(); ui.load();
  const boxes = [...ui.document.querySelectorAll('[data-source]')];
  const names = boxes.map(box => box.getAttribute('aria-label'));
  assert.equal(new Set(names).size, boxes.length);
  for (const box of boxes) {
    const source = ui.run('state.corpus.articles').find(article => article.id === box.dataset.source);
    assert.ok(box.getAttribute('aria-label').includes(source.id.toUpperCase()));
    assert.ok(box.getAttribute('aria-label').includes(source.medium));
  }
});