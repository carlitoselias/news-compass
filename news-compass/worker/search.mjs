import { normalize, publicURL, validateEvidence, validateHeadline } from '../shared/evidence.mjs';
import { fetchArticle } from './articles.mjs';
import { modelRequest, discoveredURLs, signed, UserError } from './service.mjs';
import { searchSchema, overviewSchema } from './schema.mjs';

export async function searchNews(input, env, emit, fetcher) {
  input = normalize(input);
  if (input.length < 5 || input.length > 16000) throw new UserError('Escribe una pregunta, enlace o texto de entre 5 y 16.000 caracteres.');
  let seed = input;
  if (/^https?:\/\/\S+$/.test(input)) {
    publicURL(input); emit('Leyendo la noticia de partida…');
    const initial = await fetchArticle({ url: input, title: '', date: '' }, fetcher);
    seed = { url: initial.url, title: initial.title, text: initial.text, access: initial.access };
  }
  const articles = [], receipts = [], attempted = new Set(), discarded = [];
  let event;
  // At most two discovery rounds, twelve candidates per round, six retained texts.
  for (let round = 0; round < 2 && articles.length < 4; round++) {
    emit(round ? 'Buscando reemplazos para las publicaciones que no pudimos leer…' : 'Buscando publicaciones en español…');
    const search = await modelRequest(env,
      'La entrada puede ser una pregunta noticiosa, URL o texto. Identifica el tema y delimita el acontecimiento y periodo; para preguntas abiertas usa la fecha actual y distingue hechos de fechas distintas. Busca hasta 12 artículos en español sobre ese mismo tema, de al menos cuatro medios si existen. Incluye candidatos de reserva con texto público. No agregues noticias ajenas para completar la lista. Devuelve solo URLs consultadas mediante búsqueda web real. Evita las URLs ya intentadas. Mantén el acontecimiento de la primera ronda. Usa fecha vacía si no se conoce. Las uncertainties deben ser frases breves sin identificadores de herramientas ni Markdown.',
      searchSchema, { seed, event: event ?? null, attempted: [...attempted], today: new Date().toISOString().slice(0, 10) }, { search: true, fetcher });
    receipts.push(search.receipt); event ??= search.value.event;
    const allowed = discoveredURLs(search.raw), candidates = [];
    for (const candidate of search.value.articles ?? []) {
      try {
        const url = publicURL(candidate.url);
        if (!allowed.has(url) || attempted.has(url)) continue;
        attempted.add(url);
        candidates.push({ url, title: normalize(candidate.title), medium: normalize(candidate.medium), date: normalize(candidate.date) });
      } catch { /* invalid addresses cannot be fetched */ }
      if (candidates.length >= 12) break;
    }
    for (let i = 0; i < candidates.length && articles.length < 6; i += 3) {
      emit('Leyendo publicaciones y descartando textos no disponibles…');
      const batch = await Promise.all(candidates.slice(i, i + 3).map(a => fetchArticle(a, fetcher)));
      for (const article of batch) {
        if (articles.some(a => a.url === article.url)) continue;
        // A metadata description is not an accessible article. Truncated body text is usable.
        if (article.textOrigin !== 'body' || article.access === 'unavailable' || article.text.length < 250) {
          discarded.push({ url: article.url, reason: article.accessNote }); continue;
        }
        if (articles.length < 6) articles.push({ ...article, id: 's' + (articles.length + 1) });
      }
    }
  }
  if (!articles.length) throw new UserError('No encontramos artículos con texto accesible tras buscar alternativas. Prueba con una pregunta más precisa.', 422);
  emit('Escribiendo el resumen y comparando las fuentes por temas…');
  const analysis = await modelRequest(env,
    'Usa EXCLUSIVAMENTE los textos suministrados. headline: escribe UN TITULAR periodístico en español, de preferencia entre 6 y 12 palabras y nunca más de 110 caracteres. Expresa una sola idea principal respaldada por las claims del resumen. No copies event.name: describe el alcance de búsqueda, no es un titular. No añadas fechas, años, periodos, cortes temporales, listas de aristas, subtítulos ni punto final. No combines acontecimientos distintos en un hecho nuevo, no exageres ni presentes una previsión como certeza. Para un tema amplio, identifica su eje común sin inventar un acontecimiento único. Deja el contexto temporal y los detalles en las secciones. sections: resumen de 3 a 5 aristas del tema; cada sección tiene heading corto y 1 o 2 claims citados. Máximo 350 palabras entre todas las claims. Atribuye cifras y declaraciones, conserva dudas y distingue fechas. agreements y differences: hasta 4 temas por categoría. Cada topic nombra UN concepto concreto (ejemplo: Causa del incidente). positions muestra qué sostiene cada fuente o grupo de fuentes mediante text y evidence. Para coincidencias, aporta evidencia de al menos dos fuentes. Para diferencias, al menos dos posiciones respaldadas por fuentes distintas. Explica si difieren en cifras, explicación o énfasis; no interpretes falta de mención como desacuerdo. Si hay contradicciones, preséntalas como diferencias sin resolverlas. Cada sourceId debe pertenecer a los artículos suministrados.',
    overviewSchema, { input, event, articles: articles.map(({ id, title, date, medium, text, url, access }) => ({ id, title, date, medium, text, url, access })) }, { fetcher });
  receipts.push(analysis.receipt);
  const headline = validateHeadline(analysis.value.headline);
  const sections = validateSections(analysis.value.sections, articles);
  const comparison = { agreements: validateTopics(analysis.value.agreements, articles, false), differences: validateTopics(analysis.value.differences, articles, true) };
  return { corpus: await signed({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), input, event, articles,
    overview: { headline, sections }, comparison, discarded, searchNotice: articles.length < 4 ? 'Solo encontramos ' + articles.length + ' publicaciones con texto útil tras dos rondas. El resumen tiene una cobertura limitada.' : '', receipts }, env.OPENAI_API_KEY) };
}
export function validateSections(sections, articles) {
  if (!Array.isArray(sections) || !sections.length || sections.length > 6) throw new UserError('El resumen no contiene secciones válidas.', 502);
  return sections.map(s => {
    const heading = normalize(s.heading);
    const claims = validateEvidence(s.claims, articles, { max: 4 });
    if (!heading || !claims.length) throw new UserError('Una sección del resumen no tiene evidencia.', 502);
    return { heading: heading.slice(0, 140), claims };
  });
}
export function validateTopics(topics, articles, differences) {
  if (!Array.isArray(topics) || topics.length > 4) throw new UserError('La comparación no tiene un formato válido.', 502);
  return topics.map(t => {
    const topic = normalize(t.topic), positions = validateEvidence(t.positions, articles, { max: 6 });
    const sources = new Set(positions.flatMap(p => p.evidence.map(e => e.sourceId)));
    if (!topic || sources.size < 2 || (differences && positions.length < 2)) throw new UserError('La comparación necesita evidencia de al menos dos fuentes.', 502);
    return { topic: topic.slice(0, 180), positions };
  });
}
