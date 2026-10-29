# Backlog

Estados: `NEXT`, `IN_PROGRESS`, `REVIEW`, `DONE`, `BLOCKED`, `PARKED`, `REJECTED`.

Un estado pendiente no autoriza trabajo. `DONE` requiere evidencia verificable.

| ID | Estado | Resultado | Evidencia de aceptación |
|---|---|---|---|
| INIT-001 | IN_PROGRESS | Loreto usa la demo publicada con una noticia nueva, fuentes reales, respuesta citada, omisiones y respaldo. | Implementación, publicación y 17 pruebas sin gasto verificadas. Faltan configuración privada, ensayo real autorizado y aceptación. |
| BUILD-001 | DONE | Interfaz y servidor implementados; llamadas de pago desactivadas. | docs/VALIDATION.md; 17 pruebas; build estático; Worker a49cc696-9b03-48ad-93fe-54fe9a27f6cf; /health responde. |
| DEPLOY-001 | DONE | Pages publicado y enlazado al Worker. | https://carlitoselias.github.io/news-compass/; Actions 40892090417 aprobado; PUBLIC_API_BASE configurada; servidor responde; interfaz pública comprobada con teclado y proyección. |
| LIVE-001 | IN_PROGRESS | Configurar secretos y límite efectivo; ensayar con noticias reales. | La usuaria reactivó la preparación del ensayo. Proyecto API News Compass creado; límite mensual USD 1 con bloqueo activo verificado. La usuaria creó la clave; OPENAI_API_KEY y DEMO_ACCESS_TOKEN figuran cifrados en Cloudflare. Conexión Pages→Worker comprobada con IA desactivada. Pendiente elegir noticia y ejecutar ensayo autorizado para validar OpenAI, citas y respaldo; aún sin gasto API. |
| UX-001 | REVIEW | Aclarar pasos, fuentes frente a IA, citas y conservación del trabajo. | Comparación documentada en docs/DECISIONS.md; 30 pruebas y build aprobados; recorrido ficticio, teclado y móvil revisados según docs/VALIDATION.md. Implementado localmente. Pendientes revisión de claridad con la usuaria y publicación. |
| VISUAL-001 | REVIEW | Aplicar el sistema editorial blanco, negro y rojo sobre UX-001. | Implementación local; especificación en docs/DESIGN-SYSTEM.md; 31 pruebas y build; escritorio, móvil, teclado, archivos y proyección revisados; revisión crítica de otro agente y hallazgos corregidos. Evidencia en docs/VALIDATION.md. Pendientes prueba física de proyección y publicación. |
