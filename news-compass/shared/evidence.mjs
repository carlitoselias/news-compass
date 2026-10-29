export const normalize = value => String(value ?? '').replace(/\s+/gu, ' ').trim();
export function publicURL(value) {
  const u = new URL(value);
  const host = u.hostname.toLowerCase();
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') ||
      !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host) ||
      /(^|\.)(localhost|local|internal|test|invalid|example|onion|arpa)$/.test(host) ||
      /(^|\.)(nip\.io|sslip\.io|localtest\.me)$/.test(host)) throw new Error('Usa un enlace HTTPS a un medio público.');
  u.hash = '';
  return u.href;
}
export function validateEvidence(items, articles, { max = 24 } = {}) {
  if (!Array.isArray(items) || items.length > max) throw new Error('La respuesta no tiene un formato válido.');
  const sources = new Map(articles.map(a => [a.id, a]));
  return items.map(item => {
    if (!normalize(item.text) || !Array.isArray(item.evidence) || !item.evidence.length || item.evidence.length > 6)
      throw new Error('Una afirmación no incluye evidencia. No se mostrará como verificada.');
    const evidence = item.evidence.map(e => {
      const source = sources.get(e.sourceId);
      const quote = normalize(e.quote);
      if (!source || quote.length < 15 || quote.length > 600 || !normalize(source.text).includes(quote))
        throw new Error('Una cita no coincide con el texto leído. Revisa las fuentes antes de volver a generar.');
      return { sourceId: source.id, quote };
    });
    return { text: normalize(item.text).slice(0, 1800), evidence };
  });
}
export function selectedArticles(corpus, ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 6 || new Set(ids).size !== ids.length)
    throw new Error('Selecciona entre una y seis fuentes.');
  return ids.map(id => {
    const article = corpus.articles.find(a => a.id === id);
    if (!article || article.text.length < 80 || article.access === 'unavailable')
      throw new Error('Una fuente seleccionada no tiene suficiente texto disponible.');
    return article;
  });
}
export function validateArchive(data) {
  if (data?.format !== 'news-compass' || data.version !== 1 || !data.corpus || !Array.isArray(data.corpus.articles))
    throw new Error('Este archivo no es una ejecución de News Compass compatible.');
  const c = data.corpus;
  if (!Number.isFinite(Date.parse(c.createdAt)) || typeof c.input !== 'string' || c.input.length > 16000 || !c.comparison || typeof c.comparison !== 'object') throw new Error('La ejecución no contiene fecha, entrada o comparación válidas.');
  if (!c.event || typeof c.event.name !== 'string' || typeof c.event.date !== 'string' || !Array.isArray(c.event.people) || !Array.isArray(c.event.uncertainties))
    throw new Error('Falta la identificación del acontecimiento.');
  if (c.articles.length > 6 || new Set(c.articles.map(a => a.id)).size !== c.articles.length)
    throw new Error('El archivo contiene fuentes duplicadas o demasiadas fuentes.');
  for (const a of c.articles) {
    publicURL(a.url);
    if (!/^s[1-6]$/.test(a.id) || typeof a.text !== 'string' || a.text.length > 14000 || typeof a.title !== 'string' ||
      !['read', 'partial', 'unavailable'].includes(a.access)) throw new Error('Una fuente guardada no es válida.');
    if (a.analysis) for (const key of ['facts', 'voices', 'context', 'focus', 'agency']) validateEvidence(a.analysis[key], [a]);
  }
  for (const key of ['agreements', 'differences', 'contradictions']) validateEvidence(c.comparison?.[key] ?? [], c.articles);
  if (data.question !== undefined && (typeof data.question !== 'string' || data.question.length > 1200)) throw new Error('La pregunta guardada no es válida.');
  if (data.selectedIds !== undefined) {
    if (!Array.isArray(data.selectedIds)) throw new Error('La selección guardada no es válida.');
    if (data.selectedIds.length) selectedArticles(c, data.selectedIds);
  }
  if (data.answer) {
    if (data.answer.question !== undefined && (typeof data.answer.question !== 'string' || data.answer.question.length > 1200)) throw new Error('La pregunta de la respuesta no es válida.');
    const selected = selectedArticles(c, data.answer.selectedIds);
    validateEvidence(data.answer.claims, selected);
    if (data.omissions) {
      for (const key of ['omissions', 'context']) validateEvidence(data.omissions[key], selected);
    }
  } else if (data.omissions) throw new Error('Las omisiones requieren una respuesta guardada.');
  return data;
}
