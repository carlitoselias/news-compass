# News Compass

Demo en español para una charla: noticia → coberturas → respuesta citada → fuentes y omisiones.

**Estado:** implementación verificada sin gasto; servidor publicado en https://news-compass-api.c-elias-pp.workers.dev. Las llamadas de pago están desactivadas. La aceptación final requiere la configuración privada y un ensayo API expresamente autorizado. No se ha gastado saldo de OpenAI.

## Abrir y comprobar

Requiere Node.js 24.19.0 o posterior y npm.

```text
npm ci
npm run check
npm test
npm run build
npm run dev
```

Abrir http://127.0.0.1:4173. El servidor de vista previa siempre mantiene la IA desactivada, incluso si hay variables de OpenAI en el entorno. Para comprobar el diálogo, usar esa misma dirección y el código de prueba `local-preview-access-code`. No es una credencial de producción.

`npm run worker:check` compila el Worker sin publicarlo. `npm run worker:deploy` sí publica y requiere la cuenta Cloudflare elegida.

## Qué hace

- Busca hasta seis artículos sobre el mismo acontecimiento mediante Responses API y búsqueda web.
- Solo admite candidatos cuyos enlaces aparezcan en los resultados de la herramienta.
- Lee HTML público con Readability; muestra acceso parcial, restricciones y recortes. No evade muros de pago.
- Compara hechos, declaraciones, fuentes, contexto, enfoques y posibles reproducciones de agencias con fragmentos.
- Genera una respuesta solo con artículos seleccionados, sin herramienta de búsqueda en esa fase.
- Comprueba que cada cita sea un fragmento del texto recibido. Esta comprobación no garantiza por sí sola que una interpretación sea correcta.
- Permite guardar una ejecución como JSON privado y abrirla sin consumir API. La interfaz marca la reproducción como “Ejecución guardada”.
- Permite iniciar búsquedas nuevas durante la charla; no depende de una noticia precargada.

## Arquitectura mínima

`GitHub Pages → Worker autenticado → OpenAI / artículos públicos`

El Worker usa un Durable Object para reservar solicitudes, impedir duplicados y limitar operaciones concurrentes. Solo persiste identificadores y contadores; no guarda noticias, respuestas ni credenciales en esa tabla. Los textos viajan al navegador de la expositora y a OpenAI para el análisis. Los archivos guardados permanecen bajo control de la expositora.

La API se desactiva con `AI_ENABLED=false`. También exige `BUDGET_READY=true`, que solo debe declararse después de comprobar el límite efectivo en la plataforma API. Un indicador booleano no configura el presupuesto por sí mismo.

## Publicación y charla

- [Contrato aceptado](docs/CONTRATO.md)
- [Despliegue y configuración](docs/DEPLOYMENT.md)
- [Guion y respaldo](docs/CHARLA.md)
- [Decisiones técnicas](docs/DECISIONS.md)
- [Pruebas y limitaciones](docs/VALIDATION.md)
- [Backlog](docs/BACKLOG.md)

El workflow de GitHub Pages está en `../.github/workflows/pages.yml`, porque el repositorio actual contiene esta aplicación en la subcarpeta `news-compass`. Se ejecuta manualmente y publica únicamente `dist/`.

Los comandos locales no requieren una clave OpenAI. No copiar secretos, capturas de facturación, respaldos de noticias ni archivos `output/` a GitHub Pages.
