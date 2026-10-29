# News Compass

Demo en español: pregunta, enlace o texto → resumen citado → fuentes legibles → coincidencias y diferencias → pregunta propuesta.

[Web pública](https://carlitoselias.github.io/news-compass/) · [Guion para Loreto](docs/CHARLA.md)

## Usar

Conecta mediante el icono superior y el código de la demo. Escribe una pregunta noticiosa, pega una URL o un texto. La búsqueda genera un resumen por aristas y compara las publicaciones accesibles. Selecciona fuentes y abre «La pregunta»: el modelo propone una pregunta para la que esa selección y el resumen inicial podrían servir de respuesta.

El resumen se identifica como material derivado de IA. No cuenta como confirmación independiente. Cada afirmación y cada posición de la comparación conserva fragmentos y enlaces. Las citas se comprueban contra el texto extraído; esto no garantiza que la interpretación sea correcta.

«Nueva búsqueda» y el logo conservan la conexión. El icono superior permite desconectar. La sesión se conserva durante las recargas en sessionStorage de la pestaña; algunos navegadores pueden restaurarla al reabrir una sesión. Desconectar elimina el código guardado.

## Fuentes y archivos

Se buscan hasta doce candidatos por ronda, con un máximo de dos rondas y seis textos conservados. Las páginas inaccesibles, descripciones sin cuerpo y plantillas reconocidas se descartan. Si hay menos de cuatro artículos útiles, se buscan reemplazos. Si siguen faltando, se informa de la cobertura limitada. No se evaden muros de pago. Se admiten cuerpos recortados a 12.000 caracteres, marcados como lectura parcial.

Guardar ejecución descarga un JSON privado. El clip de la entrada abre un archivo en modo lectura, sin API. El formato 2 conserva resumen, comparación, selección y pregunta propuesta/editada. Se pueden leer archivos anteriores (formato 1); sus respuestas y omisiones se conservan al volver a exportar.

## Desarrollo

Node.js 24.19.0 o posterior y npm:

```text
npm ci
npm run check
npm test
npm run build
npm run dev
```

La vista local http://127.0.0.1:4173 mantiene la IA desactivada. Para comprobar la conexión local, usar esa dirección y el código ficticio local-preview-access-code. No se necesitan credenciales OpenAI para las pruebas.

## Arquitectura y consumo

GitHub Pages → Worker autenticado → OpenAI / artículos públicos. El Worker usa un Durable Object para reservar solicitudes, bloquear duplicados y limitar concurrencia. Solo persiste identificadores y contadores. Los secretos permanecen en Cloudflare.

Una búsqueda requiere dos llamadas al modelo, o tres si hacen falta reemplazos. Proponer la pregunta añade una llamada sin búsqueda web. Los errores no se reintentan automáticamente. El estado remoto de IA y el presupuesto se verifican antes de un ensayo; los valores false del archivo local no acreditan el estado remoto.

[Despliegue](docs/DEPLOYMENT.md) · [Decisiones](docs/DECISIONS.md) · [Validación](docs/VALIDATION.md) · [Backlog](docs/BACKLOG.md)

El workflow manual ../.github/workflows/pages.yml publica únicamente dist/. No incluir claves, capturas de facturación ni ejecuciones privadas.
