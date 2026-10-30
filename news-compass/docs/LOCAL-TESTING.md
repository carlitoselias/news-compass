# Pruebas locales activas

Instrucción explícita de la usuaria, 29 de octubre de 2026:
mantener habilitadas las pruebas para varias noticias, conservar el límite de proyecto de USD 10, no pasar cambios a main y no desactivar el servidor salvo que la usuaria lo pida.

## Acceso

- Vista actualizada con collage: http://127.0.0.1:4178/
- Servidor de IA y vista anterior: http://127.0.0.1:4176/
- El puerto 4178 sirve la interfaz y reenvía las operaciones al servidor 4176. Conserva la clave en memoria y el presupuesto existente. Fuente: output/frontend-preview.mjs; copia activa en la misma carpeta temporal del servidor. No detener ninguno de los dos procesos mientras continúen las pruebas.
- Activación inicial: http://127.0.0.1:4176/setup
- El puerto 4175 corresponde a la prueba ficticia anterior. No es la prueba real.
- Tras ingresar la clave del proyecto News Compass, el enlace Abrir News Compass prepara automáticamente la sesión local. No se introduce la clave API en el diálogo del código de Loreto.
- Cada resultado permite Nueva búsqueda sin perder la conexión.

## Servidor

Fuente local: output/live-rehearsal.mjs.
Copia en ejecución: %TEMP%/news-compass-live-20261029/output/live-rehearsal.mjs.
Proceso iniciado en segundo plano y sin ventana. Su PID queda en output/local-active.pid dentro de esa copia temporal. Verificar proceso y ruta antes de cualquier intervención.

No hay temporizador de una hora, cupo de una noticia ni cupo global de cuatro llamadas.
Se conserva una operación simultánea y el rechazo de identificadores duplicados. No hay reintentos automáticos.
Cada ejecución se respalda en un archivo distinto de output/rehearsal-* en la copia temporal.

La clave está solo en memoria; reiniciar Windows o terminar el proceso exige iniciar de nuevo e ingresar la clave. Cerrar una pestaña no detiene el servidor.
No detener este proceso como limpieza al terminar un chat ni volver al servidor de solo lectura.

## Presupuesto y validación

Panel verificado: USD 1,05 usados de USD 10, con límite efectivo activado. No se cambió presupuesto.
El límite es acumulado del proyecto y lo aplica OpenAI, también al usar esta clave desde local. No es un cupo adicional de USD 10 por sesión.
El límite del proveedor puede tener demora de aplicación; no se promete precisión de gasto al centavo.

Prueba técnica aislada, sin OpenAI: tres búsquedas y tres análisis consecutivos aceptados; solicitudes duplicadas rechazadas; estado activo al terminar.
Estado al preparar las pruebas: no se habían publicado cambios ni modificado main. La autorización posterior para integrar los cambios en main mantiene las pruebas locales activas y el mismo límite de presupuesto.
