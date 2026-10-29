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
