export const article = (id = 's1', overrides = {}) => ({ id, url: 'https://medio' + id + '.cl/noticia', medium: 'Medio de prueba ' + id, title: 'PRUEBA TÉCNICA: apertura de una biblioteca ficticia',
  date: '2026-10-29', dateOrigin: 'publication', text: 'La biblioteca de prueba abrirá el viernes. La directora de prueba dijo que tendrá acceso gratuito. El horario de prueba será de diez a dieciocho horas. Este texto es ficticio y sirve únicamente para comprobar el software.',
  access: 'read', accessNote: 'Datos ficticios de prueba, no una noticia real.', retrievedAt: new Date().toISOString(), ...overrides });
export const item = (id = 's1') => ({ text: 'La biblioteca de prueba abrirá el viernes.', evidence: [{ sourceId: id, quote: 'La biblioteca de prueba abrirá el viernes.' }] });
export const corpus = () => ({ id: 'test-corpus', createdAt: new Date().toISOString(), input: 'PRUEBA TÉCNICA: noticia ficticia de biblioteca.',
  event: { name: 'PRUEBA TÉCNICA · Apertura de una biblioteca ficticia', date: '2026-10-30', people: ['Directora ficticia'], uncertainties: ['Estos datos son ficticios. No son una ejecución real de IA.'] },
  articles: [article(), article('s2')], comparison: { agreements: [item()], differences: [], contradictions: [] }, receipts: [] });
export const responseEnvelope = (value, extra = {}) => ({ id: 'test-response', model: 'test-model', status: 'completed',
  output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }], ...extra });
