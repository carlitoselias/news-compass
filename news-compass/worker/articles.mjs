import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import { normalize, publicURL } from '../shared/evidence.mjs';

export async function readLimited(response, max = 1500000) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > max) throw new Error('La página supera el tamaño de lectura permitido.');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}
export function extractArticle(html, url) {
  const { document } = parseHTML(html);
  const meta = (key, attr = 'property') => document.querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content') ?? '';
  const title = normalize(meta('og:title') || document.querySelector('title')?.textContent);
  const date = normalize(meta('article:published_time') || document.querySelector('time[datetime]')?.getAttribute('datetime'));
  const medium = normalize(meta('og:site_name') || new URL(url).hostname);
  const description = normalize(meta('og:description') || meta('description', 'name'));
  const paywall = /"isAccessibleForFree"\s*:\s*(?:false|"false")/i.test(html);
  for (const el of document.querySelectorAll('script,style,noscript,iframe,svg,form,button,nav,footer')) el.remove();
  const article = new Readability(document, { charThreshold: 250 }).parse();
  const extracted = normalize(article?.textContent);
  const template = /\{\{[^}]+\}\}/.test(extracted) || (extracted.match(/Alerta de Spoiler|Advertencia de imágenes explícitas|Estamos recopilando más antecedentes|Este artículo describe un proceso judicial/gi) ?? []).length >= 2;
  const challenge = /^(just a moment|access denied|verify you are human|checking your browser)/i.test(extracted);
  const usable = extracted.length >= 250 && !paywall && !template && !challenge;
  // We never claim the entire original was accessible: this is the extracted text only.
  const text = (usable ? extracted : description).slice(0, 12000);
  return { title, date, medium, text, textOrigin: usable ? 'body' : 'description', access: usable && extracted.length <= 12000 ? 'read' : text.length >= 80 ? 'partial' : 'unavailable',
    accessNote: template || challenge ? 'La página entregó una plantilla o bloqueo, no el cuerpo de la noticia.' : paywall ? 'Se detectó acceso restringido. Solo se conserva la descripción pública.' :
      usable ? (extracted.length > 12000 ? 'Texto recortado a 12.000 caracteres.' : 'Texto extraído; revisa su alcance en el original.') :
        'Solo se obtuvo la descripción pública, o no hubo texto suficiente.',
    retrievedAt: new Date().toISOString() };
}
export async function fetchArticle(candidate, fetcher = fetch) {
  let url = publicURL(candidate.url);
  const fallback = { ...candidate, url, text: '', access: 'unavailable', accessNote: 'No fue posible leer el artículo.', retrievedAt: new Date().toISOString() };
  try {
    for (let redirects = 0; redirects <= 3; redirects++) {
      const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { Accept: 'text/html', 'User-Agent': 'NewsCompass/0.1 (conference research; no paywall bypass)' } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel();
        url = publicURL(new URL(response.headers.get('location'), url).href); continue;
      }
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        await response.body?.cancel();
        return { ...fallback, accessNote: `El medio no entregó un artículo HTML accesible (HTTP ${response.status}).` };
      }
      const extracted = extractArticle(await readLimited(response), url);
      return { ...fallback, ...extracted, url, title: extracted.title || candidate.title, date: extracted.date || candidate.date,
        dateOrigin: extracted.date ? 'publication' : candidate.date ? 'search' : 'unknown' };
    }
    return { ...fallback, accessNote: 'Demasiadas redirecciones. Consulta el original.' };
  } catch {
    return { ...fallback, accessNote: 'Acceso bloqueado, lectura no disponible o tiempo de espera agotado.' };
  }
}
