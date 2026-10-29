# Backlog

Estados: `NEXT`, `IN_PROGRESS`, `REVIEW`, `DONE`, `BLOCKED`, `PARKED`, `REJECTED`.

Un estado pendiente no autoriza trabajo. `DONE` requiere evidencia verificable.

| ID | Estado | Resultado | Evidencia de aceptación |
|---|---|---|---|
| INIT-001 | IN_PROGRESS | Loreto usa la demo publicada con una noticia nueva, fuentes reales, respuesta citada, omisiones y respaldo. | Implementación y 17 pruebas sin gasto verificadas; Worker publicado con IA desactivada. Faltan configuración privada, ensayo real autorizado y aceptación. |
| BUILD-001 | DONE | Interfaz y servidor implementados; llamadas de pago desactivadas. | docs/VALIDATION.md; 17 pruebas; build estático; compilación y despliegue Worker a49cc696-9b03-48ad-93fe-54fe9a27f6cf; /health responde. |
| DEPLOY-001 | IN_PROGRESS | Publicar Pages en carlitoselias/news-compass y enlazar el Worker. | Repositorio creado; PUBLIC_API_BASE configurada; servidor https://news-compass-api.c-elias-pp.workers.dev responde. Falta verificar Pages. |
| LIVE-001 | BLOCKED | Configurar secretos y límite efectivo; ensayar con noticias reales. | Requiere clave API de proyecto y código privado en Cloudflare; verificar presupuesto y obtener autorización del ensayo. No se ejecutaron llamadas OpenAI. |
