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

## Revisión de UX — 29 de octubre de 2026

**Alcance:** aclarar el recorrido, el origen del contenido y el guardado. La comparación se hizo con documentación pública de los productos. No se ensayaron cuentas privadas de esos servicios. Las decisiones siguientes son adaptaciones a News Compass; no prueban por sí solas una mejora de usabilidad.

| Referencia consultada | Práctica observada | Aplicación y límite |
|---|---|---|
| [Ground News: comparación de coberturas](https://help.ground.news/en/articles/3189505) | Una vista específica reúne la comparación; el servicio explica el uso de IA. | Etiquetas explícitas en identificación, análisis por fuente, comparación, respuesta y omisiones. No copiar etiquetas de sesgo político: News Compass no tiene evidencia para asignarlas. |
| [Gemini Notebook: notas y selección](https://support.google.com/gemininotebook/answer/16262519?hl=en) | Casillas determinan qué contenido entra en la respuesta; las referencias permiten consultar fragmentos. | “Usar en respuesta”, contador y citas que abren el fragmento local. Las notas y los resúmenes no se convierten automáticamente en fuentes. |
| [Feedly: guardar en un Board](https://docs.feedly.com/article/60-how-can-i-save-an-article-to-a-board) | Guardar exige una acción explícita y un destino. | “Descargar archivo”, ayuda “¿Cuándo debo guardar?” y estado visible. Nuestro destino es el equipo, no una cuenta en la nube. |
| [GOV.UK: botones](https://design-system.service.gov.uk/components/button/) | El nombre del botón describe su efecto; distingue continuar de guardar. | Pasos numerados, guía de siguiente acción y textos como “Analizar omisiones con IA”. Moverse entre vistas no guarda ni genera contenido. |
| [Nielsen Norman Group: explicaciones de IA](https://www.nngroup.com/articles/explainable-ai/) | Las explicaciones deben permitir evaluar el resultado y reconocer sus límites. | Texto del medio separado de interpretación; citas accesibles sin salir de la página; coincidencia textual no se presenta como prueba de verdad. |

**ADR-012 — Orientación.** La guía cambia según conexión, selección, resultados y modo lectura. Las pestañas permanecen disponibles para explorar. Los controles inactivos tienen una explicación próxima. Tras obtener un resultado, el foco permite revisarlo. Errores y progreso se anuncian mediante regiones accesibles.

**ADR-013 — Conservar sin confundir.** Se aclara que no hay guardado automático. Cambiar una pregunta o selección conserva la respuesta previa con una advertencia visible. No se permite analizar omisiones contra una selección nueva hasta generar otra respuesta. Si falla la generación, permanece el resultado anterior. Esto sustituye el borrado inmediato descrito por ADR-005; se mantiene la vinculación entre cada respuesta y sus fuentes originales.

**ADR-014 — Archivo.** Una descarga incluye la pregunta y selección actuales, junto con la pregunta y fuentes originales de la respuesta conservada. La importación recupera ambas y muestra cualquier diferencia. Se mantiene el formato versión 1. Abrir un archivo es solo lectura. El navegador solo permite afirmar “Descarga solicitada”; la aplicación no puede saber si la persona canceló el guardado. El aviso lo explica. Antes de reemplazar trabajo sin descargar se puede volver, descargar una copia o continuar. El aviso de cierre depende del soporte del navegador.

**Qué no se adoptó.** No se añadieron recorridos emergentes obligatorios, más paneles ni guardado en nube. Esas opciones amplían el producto y pueden aumentar la carga de uso. Se mantuvo la identidad visual existente. No se cambió el servidor ni se activaron llamadas de pago.

**Aceptación con la usuaria pendiente.** Pedir que complete cuatro tareas sin ayuda: elegir fuentes; identificar qué escribió la IA; abrir una cita; descargar y reabrir el resultado. Observar errores y dudas. Las pruebas de software no sustituyen esta comprobación.

## Sistema editorial — 29 de octubre de 2026

**ADR-015 — Blanco, negro y rojo sobre la nueva UX.** Loreto eligió la propuesta editorial. Se reemplaza la paleta verde por un sistema con tokens, Georgia para titulares y Arial para lectura e interfaz. Se mantienen los pasos, la guía, las citas locales, el guardado explícito y la conservación de respuestas anteriores. El encabezado se reduce con resultados. Proyección amplía el texto de lectura, citas y ayudas. Las fuentes no reciben colores que sugieran fiabilidad. Las especificaciones de colores, tamaños, estados, foco, botones y adaptación están en [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

La revisión crítica independiente encontró nombres accesibles idénticos en fuentes con titulares repetidos y dos estados hover fuera de la condición de puntero documentada. Ambos se corrigieron y el revisor confirmó la solución. Los cambios siguen locales; no se publicó el sitio ni se modificó la configuración API durante esta revisión.