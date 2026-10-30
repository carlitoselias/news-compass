import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHeadline, validateArchive } from '../shared/evidence.mjs';
import { overviewSchema } from '../worker/schema.mjs';
import { corpus, item } from './fixtures.mjs';

test('headline has an enforced size limit without truncating a statement',()=>{
  assert.equal(validateHeadline('  Una biblioteca abre sus puertas  '),'Una biblioteca abre sus puertas');
  for(const value of [undefined, null, '', ' '.repeat(10), 'a'.repeat(111)]) assert.throws(()=>validateHeadline(value));
  assert.equal(overviewSchema.properties.headline.maxLength,110);
  assert.ok(overviewSchema.required.includes('headline'));
});

test('saved headlines are validated while old archives remain readable',()=>{
  const c=corpus();
  c.overview={headline:'Una biblioteca abre sus puertas',sections:[{heading:'Apertura',claims:[item()]}]};
  const archive={format:'news-compass',version:2,corpus:c};
  assert.equal(validateArchive(archive).corpus.overview.headline,c.overview.headline);
  c.overview.headline='a'.repeat(111);assert.throws(()=>validateArchive(archive),/titular/);
  delete c.overview.headline;assert.doesNotThrow(()=>validateArchive(archive));
});
