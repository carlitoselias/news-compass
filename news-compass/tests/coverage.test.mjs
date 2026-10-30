import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCoverage, validateArchive, summarySource } from '../shared/evidence.mjs';
import { corpus, item } from './fixtures.mjs';
function fixture() {
  const c=corpus();c.overview={sections:[{heading:'Apertura',claims:[item()]}]};
  const pair={text:'Conserva la fecha de apertura.',evidence:[item().evidence[0],{sourceId:'ai-summary',quote:item().text}]};
  return {c,summary:summarySource(c),coverage:{retained:[pair],omitted:[item()],reframed:[pair]}};
}
test('coverage requires source and summary evidence for retention and changes of nuance',()=>{
  const {c,summary,coverage}=fixture();
  assert.deepEqual(validateCoverage(coverage,[c.articles[0]],summary),coverage);
  for(const key of ['retained','reframed']) {
    const oneSide=structuredClone(coverage);oneSide[key]=[item()];
    assert.throws(()=>validateCoverage(oneSide,c.articles,summary),/fragmento del resumen/);
    oneSide[key][0].evidence=[{sourceId:'ai-summary',quote:item().text}];
    assert.throws(()=>validateCoverage(oneSide,c.articles,summary),/fuente seleccionada/);
  }
});
test('coverage rejects invented quotes and deselected sources and accepts no findings',()=>{
  const {c,summary,coverage}=fixture();
  coverage.omitted=[item('s2')];
  assert.throws(()=>validateCoverage(coverage,[c.articles[0]],summary),/cita no coincide/);
  coverage.omitted=[item()];coverage.reframed[0].evidence[1].quote='Esta afirmación no está en el resumen.';
  assert.throws(()=>validateCoverage(coverage,c.articles,summary),/cita no coincide/);
  assert.throws(()=>validateCoverage(undefined,c.articles,summary),/Falta/);
  assert.deepEqual(validateCoverage({retained:[],omitted:[],reframed:[]},c.articles,summary),{retained:[],omitted:[],reframed:[]});
});
test('archive checks coverage against original selection, preserves it, and supports older suggestions',()=>{
  const {c,coverage}=fixture();
  const archive={format:'news-compass',version:2,corpus:c,selectedIds:['s2'],suggestion:{corpusId:c.id,selectedIds:['s1'],question:'¿Cuándo abre?',rationale:[item()],coverage}};
  assert.deepEqual(validateArchive(JSON.parse(JSON.stringify(archive))).suggestion.coverage,coverage);
  archive.suggestion.coverage.omitted=[item('s2')];
  assert.throws(()=>validateArchive(archive),/cita no coincide/);
  delete archive.suggestion.coverage;
  assert.doesNotThrow(()=>validateArchive(archive));
});
