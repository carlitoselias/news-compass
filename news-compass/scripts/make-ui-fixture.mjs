// Synthetic data for UI verification only. Never copied to dist.
import { mkdir, writeFile } from 'node:fs/promises';
import { corpus, item } from '../tests/fixtures.mjs';
await mkdir('output', { recursive: true });
const data = { format: 'news-compass', version: 1, corpus: corpus(), selectedIds: ['s1'], question: '¿Qué ocurrió?',
  answer: { createdAt: new Date().toISOString(), corpusId: 'test-corpus', selectedIds: ['s1'], question: '¿Qué ocurrió?', claims: [item()] },
  omissions: { omissions: [{ text: 'La síntesis no incluyó el horario de prueba.', evidence: [{ sourceId: 's1', quote: 'El horario de prueba será de diez a dieciocho horas.' }] }], context: [] } };
await writeFile('output/ui-fixture.json', JSON.stringify(data, null, 2));
await writeFile('output/invalid-fixture.json', '{"format":"wrong","version":1}');
console.log('Datos ficticios de prueba creados en output/. No son una ejecución real.');
