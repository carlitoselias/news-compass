# Desplegar News Compass

## 1. Preparar el proyecto API

Crear o elegir un proyecto dedicado a esta demo en la organización que tiene los créditos. No utilizar una clave de administrador.

1. Comprobar saldo y vencimiento en API Platform.
2. Configurar un límite efectivo inicial de USD 1; una alerta no es un bloqueo de consumo.
3. Obtener una clave de proyecto. Introducirla únicamente en el gestor de secretos del Worker.
4. Antes de la charla, elevar el límite acumulado del proyecto a USD 10 si se mantiene esa decisión.
5. Mantener `AI_ENABLED=false` hasta autorizar el ensayo.

Documentación: [límites API](https://developers.openai.com/api/docs/guides/spend-limits), [créditos de suscripción](https://developers.openai.com/api/docs/guides/chatgpt-api-credits).

## 2. Preparar el Worker

Desde la carpeta de la aplicación, con Node 24.19.0:

```text
npm ci
npx wrangler login --use-keyring --scopes account:read user:read workers:write workers_scripts:write
npm run worker:check
npm run worker:deploy
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put DEMO_ACCESS_TOKEN
```

El despliegue inicial lleva la IA desactivada. Las órdenes `secret put` solicitan el valor de forma interactiva; no escribirlo en el comando, el chat o un archivo versionado. El código de acceso debe tener al menos 24 caracteres aleatorios y ser distinto de la clave de OpenAI. Entregar a Loreto solo ese código de demo.

Configuración:
- `ALLOWED_ORIGIN`: origen exacto de Pages, por ejemplo `https://cuenta.github.io`, sin la ruta del repositorio.
- `OPENAI_MODEL`: el modelo elegido y disponible en la cuenta. Valor inicial propuesto: `gpt-6.1-sol`; su disponibilidad real debe comprobarse en el ensayo.
- `AI_ENABLED`: `false` durante preparación.
- `BUDGET_READY`: `false` hasta verificar que existe un límite efectivo en el proyecto API.
- `DEMO_GATE`: enlace al Durable Object creado con la migración del proyecto.

El gate usa SQLite solo para contadores e IDs. No hay una base central de noticias. Cualquier coste de Cloudflare es independiente del saldo de OpenAI; revisar el plan de alojamiento antes de habilitar recursos. No se contrata un plan de pago como parte del código.

## 3. GitHub Pages

El repositorio actual tiene la app dentro de `news-compass/`. Se preparó `.github/workflows/pages.yml` en la raíz del repositorio.

1. Usar el repositorio público autorizado carlitoselias/news-compass y subir el código, nunca secretos ni respaldos.
2. En Settings → Pages, elegir GitHub Actions como origen.
3. Opcional: crear la variable de repositorio `PUBLIC_API_BASE` con la URL HTTPS del Worker. Es configuración pública, no una credencial.
4. Ejecutar manualmente el workflow “Publish News Compass”.
5. Abrir el sitio, pulsar Conectar e introducir URL del Worker y código privado.
6. Confirmar “IA desactivada”. Esta comprobación no consume OpenAI.

El workflow publica solo `news-compass/dist/`. No incluye fuentes del servidor, documentación interna, datos de prueba ni claves.

## 4. Autorizar un ensayo real

Solo después de la autorización específica:
- Verificar el límite de USD 1 en API Platform.
- Activar `BUDGET_READY=true` y `AI_ENABLED=true` en la configuración remota del Worker.
- Volver a conectar la interfaz para actualizar el estado.
- Hacer una búsqueda con una noticia real nueva; seleccionar fuentes; generar respuesta; analizar omisiones.
- Comprobar fragmentos y enlaces manualmente.
- Guardar el JSON y comprobar su recuperación con la IA desconectada.
- Revisar el gasto real en el panel; no deducir el coste solo del número de solicitudes.
- Volver a desactivar `AI_ENABLED` hasta la charla.

La configuración versionada permanece en false. Un despliegue posterior con esa configuración vuelve a desactivar las llamadas: revisar este estado antes del evento.

## 5. Durante y después de la charla

Elevar el límite acumulado a USD 10 solo si sigue autorizado. Abrir la demo y probar la conexión, sin hacer una búsqueda de cortesía. Cada búsqueda puede requerir dos llamadas al modelo; generar y examinar omisiones son operaciones adicionales. El gate permite una operación simultánea y hasta 60 operaciones al día (UTC), además del límite monetario.

Si hay un error no se reintenta automáticamente. Una interrupción puede haber consumido crédito; esperar antes de hacer otro intento. Al terminar, poner `AI_ENABLED=false` y revocar el código de acceso o retirar el Worker si ya no se necesita.

## Límites conocidos

No hay garantía de acceso a todos los medios. El extractor no ejecuta JavaScript del sitio ni evade muros de pago. Guarda hasta 12.000 caracteres por artículo e informa el recorte. La fecha del acontecimiento es una propuesta de la IA; la fecha de publicación proviene de metadatos o de la búsqueda, identificada en pantalla.

La comprobación de citas acredita coincidencia textual, no veracidad del artículo ni corrección absoluta de la interpretación. La expositora revisa pertinencia y respaldo.

Los archivos guardados pueden consultarse sin conexión al servidor. Para nuevas llamadas, los datos firmados caducan a las 24 horas o al cambiar la clave del servidor; iniciar una búsqueda nueva.
