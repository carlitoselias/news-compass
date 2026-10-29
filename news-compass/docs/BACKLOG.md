# Backlog

Estados: `NEXT`, `IN_PROGRESS`, `REVIEW`, `DONE`, `BLOCKED`, `PARKED`, `REJECTED`.

Un estado pendiente no autoriza trabajo. `DONE` requiere evidencia verificable.

| ID | Estado | Resultado | Evidencia de aceptación |
|---|---|---|---|
| INIT-001 | IN_PROGRESS | Loreto usa la demo publicada con una noticia nueva, fuentes reales, respuesta citada, omisiones y respaldo. | Implementación, publicación y 17 pruebas sin gasto verificadas. Faltan configuración privada, ensayo real autorizado y aceptación. |
| BUILD-001 | DONE | Interfaz y servidor implementados; llamadas de pago desactivadas. | docs/VALIDATION.md; 17 pruebas; build estático; Worker a49cc696-9b03-48ad-93fe-54fe9a27f6cf; /health responde. |
| DEPLOY-001 | DONE | Pages publicado y enlazado al Worker. | https://carlitoselias.github.io/news-compass/; Actions 40892090417 aprobado; PUBLIC_API_BASE configurada; servidor responde; interfaz pública comprobada con teclado y proyección. |
| LIVE-001 | PARKED | Configurar secretos y límite efectivo; ensayar con noticias reales. | Decisión explícita: dejar las claves para el ensayo. Requiere OPENAI_API_KEY y DEMO_ACCESS_TOKEN privados, presupuesto efectivo y autorización específica. No ejecutar por el solo estado del backlog. |
