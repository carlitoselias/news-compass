# Decisiones

- **ADR-001 — Demo de conferencia.** Se conserva todo el recorrido con noticias nuevas; no se sustituye por una transformación HTML precargada.
- **ADR-002 — Hosting separado.** GitHub Pages aloja archivos estáticos. Un Cloudflare Worker protege secretos y ejecuta operaciones.
- **ADR-003 — Acceso y consumo.** Se usa clave API del proyecto de la usuaria; Loreto recibe un código de demo. No se usa ni comparte la contraseña de ChatGPT. La IA queda desactivada de fábrica.
- **ADR-004 — Evidencia.** Se aceptan URLs presentes en resultados reales de búsqueda. Las citas deben coincidir con fragmentos del texto extraído. Síntesis y omisiones no disponen de herramientas web.
- **ADR-005 — Integridad.** El servidor firma el corpus y la respuesta; selección, pregunta y corpus quedan vinculados. Cambiar selección o pregunta invalida los resultados anteriores.
- **ADR-006 — Respaldo privado.** Exportación/importación JSON; sin base central de noticias. Las ejecuciones importadas son de consulta y llevan etiqueta visible.
- **ADR-007 — Antiduplicados.** Un Durable Object guarda solo IDs y contadores: una operación simultánea, rechazo de solicitudes repetidas, máximo 60 operaciones/día UTC. El presupuesto monetario se configura en API Platform.
- **ADR-008 — Dependencias.** Interfaz sin framework, librerías ni recursos remotos. Readability y LinkeDOM en el servidor para extraer texto público. Wrangler solo como herramienta de desarrollo/despliegue. package-lock.json fija versiones.
- **ADR-009 — Repositorio.** La aplicación vive en news-compass/ dentro del repositorio padre existente. No se crea otro .git. Workflow manual de Pages en la raíz.
- **ADR-010 — Validación honesta.** Pruebas con datos ficticios solo dentro de tests/output. Ningún modo de simulación aparece como IA real. La prueba con saldo está pendiente de autorización.

- **ADR-011 — Publicación autorizada.** Repositorio público carlitoselias/news-compass, Pages y Worker publicados el 29 de octubre. La propietaria autorizó Wrangler y luego decidió dejar las claves para el ensayo. No activar llamadas ni crear secretos hasta retomar esa etapa.
