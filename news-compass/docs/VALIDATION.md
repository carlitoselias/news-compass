# Validación — 29 de octubre de 2026

## Verificado sin consumo de OpenAI

- Node 24.19.0: comprobación de sintaxis de 14 módulos, 17 pruebas aprobadas y construcción del sitio.
- Pruebas de búsqueda completa con transporte simulado: solo enlaces devueltos por la herramienta; lectura de cuatro fuentes; análisis y firmas.
- Citas inexistentes, fuentes excluidas, selecciones inválidas, ejecuciones alteradas o vencidas: rechazo.
- Generación y omisiones reciben solo los textos seleccionados y no tienen búsqueda web.
- Acceso parcial, muro de pago declarado, recorte de texto y redirecciones privadas: controles comprobados.
- Autenticación, origen permitido, desactivación, duplicados y concurrencia: controles comprobados.
- Errores del proveedor no generan reintentos automáticos.
- Worker compilado y cargado sin clave API y con las llamadas desactivadas.

## Interfaz revisada

En navegador: conexión local con IA desactivada; importación y exportación de un archivo de prueba; tres vistas; fragmentos y enlaces; mapa de citas y omisiones; rechazo de archivo inválido sin perder la ejecución actual. Vista móvil sin desbordamiento horizontal. No se detectaron errores en la consola durante la revisión.

Los datos ficticios se identifican como PRUEBA TÉCNICA. Solo pertenecen a las pruebas; no se cargan en el sitio publicado.

## Pendiente para aceptar la demo

Validar el proveedor con una clave real y presupuesto efectivo, mediante un ensayo autorizado. Comprobar pertinencia del acontecimiento, variedad de fuentes, interpretación de fragmentos y calidad de la síntesis con noticias reales. Guardar el resultado de ese ensayo como respaldo privado.

La coincidencia textual de una cita no demuestra que una afirmación sea verdadera o que la interpretación sea correcta. El extractor no garantiza leer todas las páginas. Se muestran estas limitaciones en la interfaz.

## Entorno Windows

La ruta de OneDrive impide que el proceso nativo de esbuild abra algunos archivos. La compilación del Worker se realizó desde una copia temporal de worker/, shared/ y wrangler.jsonc con las mismas dependencias fijadas. El sitio estático y las pruebas sí se ejecutaron en el proyecto. No se modificaron permisos de OneDrive.

## Publicación comprobada

GitHub Actions [40892090417](https://github.com/carlitoselias/news-compass/actions/runs/40892090417) completó instalación, 17 pruebas, build y Pages. La web pública carga las tres vistas; navegación con flechas/Home y modo de proyección comprobados. Consola sin errores observados. Worker versión a49cc696-9b03-48ad-93fe-54fe9a27f6cf con /health operativo. No se introdujeron claves OpenAI ni se hicieron llamadas a ese proveedor.

La usuaria decidió dejar las claves para el ensayo. La demo sigue sin aceptación final de su recorrido con IA real.

## Revisión de UX — 29 de octubre de 2026

La usuaria informa que las pruebas previas funcionaron. Esta revisión trabaja sobre la interfaz; no repite el ensayo real ni comprueba el estado actual del proveedor.

- Comprobación de sintaxis: 15 módulos. Suite completa: 30 pruebas aprobadas, incluidas 13 de UX. Build estático aprobado. `git diff --check` sin errores.
- Pruebas nuevas: orientación inicial, pregunta y selección editadas sin perder la respuesta anterior, cita local sin red, cancelación antes de reemplazar, exportación sin credenciales, error sin reintentos, bloqueo durante una operación, archivos de solo lectura e incompletos, importación inválida, validación del borrador y recuperación de pregunta/selección distintas del resultado anterior.
- Navegador: recorrido completo con servidor de respuestas ficticias en 127.0.0.1:4174. Búsqueda, selección, generación, cita local, cambio de pregunta, nueva generación, omisiones, cancelación y descarga. No se hicieron llamadas a OpenAI.
- El JSON descargado se abrió en el servidor normal de desarrollo (127.0.0.1:4173). Se comprobó el estado de solo lectura y la conservación de fuentes, respuesta y omisiones.
- Teclado: navegación entre pestañas con flechas y Home; foco visible en pestañas, citas y diálogo. La cancelación devuelve al trabajo.
- Anchos de contenido observados: 347 y 426 píxeles CSS en móvil; 1437 en escritorio. En las vistas revisadas, `scrollWidth` coincide con `clientWidth`. Sin desbordamiento horizontal. El navegador integrado aplica escala a los tamaños solicitados.
- Consola de la vista normal sin errores observados. Los archivos de prueba y el servidor ficticio están en output/, fuera de dist y Git.

Límites: no es una certificación de accesibilidad ni una prueba con lectores de pantalla. El aviso de cierre depende del navegador. La aplicación no puede confirmar que una descarga se guardó en disco. Falta probar la claridad con la usuaria; ver el ejercicio de aceptación en DECISIONS.md. Los cambios están locales, sin publicar.

## Sistema editorial — 29 de octubre de 2026

Implementado sobre la refactorización UX previa. Paleta, tamaños, componentes, estados y reglas documentados en DESIGN-SYSTEM.md.

- Node 24.19.0: 15 módulos comprobados, 31 pruebas aprobadas y build estático completo. Se agregó una prueba que distingue nombres accesibles de fuentes con titulares iguales. Las 30 pruebas anteriores siguen pasando.
- Recorrido visual en el servidor ficticio local 4174: conexión, búsqueda, fuentes con texto completo/parcial/inaccesible, respuesta, apertura de cita, cambio de pregunta sin perder el resultado anterior, omisiones, diálogo antes de reemplazar y cancelación. Sin consumo de API externa.
- Descarga del archivo ficticio y reapertura en 4173: selección, respuesta y omisiones conservadas; aviso de solo lectura y controles bloqueados comprobados. Las casillas muestran nombres únicos con ID y medio.
- Tres vistas medidas en anchos efectivos de 287, 328, 623, 804 y 1132 píxeles CSS: scrollWidth coincide con clientWidth. La portada final también se comprobó a 250, 328 y 1295 píxeles sin desbordamiento. El navegador aplica escala a los tamaños solicitados; se registran los valores medidos.
- Portada y diálogo de conexión revisados visualmente a 328 píxeles. El diálogo admite desplazamiento vertical y mantiene accesibles sus campos y controles.
- Teclado: flecha derecha y Home cambian pestaña y foco; contorno sólido visible. La cita enfocada queda por debajo de las pestañas persistentes. Tab en el diálogo alcanza los campos y Escape lo cierra.
- Proyección observada a 1132 píxeles: cita de 18 px y respuesta de 24,3 px. Sin desbordamiento horizontal. Capturas en output/visual-proposals/ del repositorio padre: editorial-implementado.png, editorial-cita-desktop.png, editorial-cita-mobile.png y editorial-projection.png.
- Contraste calculado: texto/fondo 17,64:1; texto secundario 7,19:1; texto blanco/botón rojo 5,81:1. Valores y pares completos en DESIGN-SYSTEM.md. Consola final de la vista normal sin errores ni advertencias observados.
- Revisión independiente por otro agente, solo lectura: recorrido ficticio, cita, proyección, código y capturas. Sin defectos P1. Corrigió dos observaciones: P2, nombres de casillas ambiguos con titulares idénticos; P3, hover de pestañas y citas fuera de la condición documentada. El revisor confirmó ambos arreglos y no dejó defectos relevantes de los detectados.

Límites: validación local con datos ficticios, no ensayo con noticias reales. No se usó un lector de pantalla ni un proyector físico. La medida de contraste digital no garantiza lectura a distancia. La implementación visual no publica los cambios ni da por aceptada la demo real.
## Publicación de UX y sistema editorial — 29 de octubre de 2026

La usuaria autorizó pasar los cambios a main y usar la versión pública. Commit de aplicación: `46c37d71614f3462cd685b8a239087db6d26ea23`. GitHub Actions [40914007892](https://github.com/carlitoselias/news-compass/actions/runs/40914007892) completó las 31 pruebas, el build y el despliegue de Pages.

Web verificada: https://carlitoselias.github.io/news-compass/. El navegador confirma el acento #C51F30, Georgia en titulares, los controles de la nueva UX, navegación con flecha derecha y Home, y el modo Proyectar. Ancho efectivo de 373 px sin desbordamiento horizontal. Consola sin errores ni advertencias observados. El diálogo incluye la URL pública del Worker. No se introdujeron credenciales ni se hicieron llamadas de pago para esta comprobación. La publicación no modifica el Worker ni su configuración privada.

Se conservan como pendientes la prueba física de proyección y la revisión de claridad con la usuaria. La nueva web puede usarse directamente sin el servidor local.

## Ensayo real y cierre de continuidad — 29 de octubre de 2026

Este registro actualiza el estado previo al ensayo. Las afirmaciones anteriores sobre ausencia de llamadas API corresponden a sus respectivas fases de desarrollo y publicación.

- Verificado: el archivo privado output/ensayo-aluvion-las-condes-busqueda-2026-10-29.run.json conserva cinco artículos y dos recibos reales de Responses. Corpus creado a las 12:13:25 de Santiago. Acontecimiento: aluvión de San Carlos de Apoquindo del 8 de octubre de 2026.
- El archivo tiene 47.483 bytes, incluye las cinco fuentes seleccionadas y no contiene respuesta ni omisiones. Es respaldo de búsqueda, no del recorrido completo.
- Reportado por la usuaria: los botones de respuesta y omisiones funcionaron cuando continuó en su navegador. No se inspeccionó ese resultado completo ni se confirmó la selección final.
- Hallazgos: S3 (BioBioChile) contiene plantilla y avisos genéricos, aunque fue marcado como texto disponible; S2 (Chilevisión) muestra fecha extraída incompatible; S5 tiene texto parcial de 12.000 caracteres. El evento mostró identificadores técnicos en sus incertidumbres. Estos defectos no se corrigieron en este cierre.
- El agente propuso excluir S2 y S3, pero no lo ejecutó. No afirmar que la respuesta final utilizó solo tres fuentes.
- La herramienta de control del navegador se detuvo al no poder verificar la URL en Windows. Esto no demuestra una avería de la aplicación; la usuaria pudo continuar.
- Antes del ensayo se comprobó un límite mensual USD 1 con bloqueo. El último estado remoto observado tenía AI_ENABLED=true y BUDGET_READY=true. No se verificaron gasto final ni desactivación posterior. Los valores false en wrangler.jsonc son configuración local, no prueba del estado remoto.

Pendiente de aceptación: revisar respuesta, citas y omisiones reales; exportar y recuperar el archivo completo; verificar presupuesto disponible, estado del servidor y acceso desde el equipo de Loreto. No se repitieron pruebas de código ni llamadas API en este cierre documental. Ver LIVE-001, QA-001 y ACCESS-001.


## Resumen inicial y pregunta inversa — 29 de octubre de 2026

- 16 módulos comprobados, 35 pruebas aprobadas y build estático completo con Node 24.19.0.
- Pruebas sin red externa: búsqueda con pregunta corta; URLs verificadas; reemplazo de artículos bloqueados, descripciones y plantillas; máximo dos rondas; aviso cuando no se logran cuatro; resumen firmado; comparación con dos fuentes; pregunta inversa que distingue el resumen derivado y rechaza citas de medios desmarcados.
- Sesión: logo/Nueva búsqueda conservan acceso; cancelación conserva trabajo; el diálogo conectado solo ofrece desconectar; recarga revalida la sesión; desactivación explícita elimina la credencial de sessionStorage. Exportación sin credenciales; archivos v2 y lectura de v1 comprobados.
- Navegador integrado en 127.0.0.1:4175: recorrido ficticio completo, cita local, pregunta propuesta, descarga solicitada, regreso por logo, recarga manteniendo conexión y menú conectado. Consola sin errores ni advertencias observados. No se enviaron llamadas a OpenAI.
- Móvil: ambas vistas medidas con ancho efectivo 341 px, sin desbordamiento horizontal. El navegador aplica escala a la dimensión solicitada. No se certifica accesibilidad ni lectura en proyector físico.
- Worker compilado desde la copia temporal por restricciones de lectura de OneDrive. Versión publicada a86a11b7-3a51-42d4-8de2-d028518ac267. Se usó configuración temporal sin vars y --keep-vars; consulta de la versión confirma AI_ENABLED=true, BUDGET_READY=true, modelo y origen conservados. No se alteraron secretos ni presupuesto.
- Capturas privadas: output/inverse-summary.png y output/inverse-question.png. Son datos ficticios etiquetados; no se incluyen en dist.
- Límite: no se repitió un ensayo real de pago con este nuevo esquema. La detección de plantillas es heurística y los metadatos de fechas pueden contener errores. Las pruebas no garantizan cuatro fuentes legibles para toda noticia.


Publicación: commit f232aa6 y GitHub Actions 40975634414 completaron comprobación, 35 pruebas, build y Pages. La portada pública muestra la entrada mínima, el footer solicitado y el diálogo con el Worker correcto. Consola pública sin errores ni advertencias observados. /health del Worker devuelve versión 2 y capacidades overview, source-replacement y suggest. No se introdujo el token real ni se hizo un ensayo de pago en esta verificación.
