# Contrato aceptado — 29 de octubre de 2026

La usuaria confirmó “crea todo lo conversado” después de revisar el contrato. El alcance de esta etapa es crear la base e implementar la demo, con las llamadas de pago desactivadas.

## Decisiones

| Campo | Decisión |
|---|---|
| Nombre / slug | News Compass / news-compass |
| Perfil / etapa | web-app / prototype |
| Idioma | es |
| Propietaria | Usuaria; Loreto maneja la demo |
| Destino | Subcarpeta news-compass en el workspace actual |
| Publicación prevista | Interfaz GitHub Pages; servidor Cloudflare Worker |
| Git | Usar el repositorio padre existente; no inicializar otro repositorio |
| Datos | Noticias públicas; secretos y ejecuciones fuera de Git |
| Workspace | split-code-data |
| Remoto previsto | public-remote; carlitoselias/news-compass autorizado |
| Runtime de desarrollo | Node 24.19.0 |
| IA | OpenAI API, con créditos de la cuenta de la usuaria |
| Fecha de charla | Viernes 30 de octubre de 2026, provisional; hora no indicada |
| Financiación | Créditos API de la propietaria; saldo y vencimiento se comprueban en privado |

## Resultado vertical

Loreto introduce una noticia nueva, revisa coberturas reales, selecciona fuentes, genera una síntesis con citas, examina omisiones y guarda o recupera una ejecución. El público puede proponer otras noticias.

La noticia ensayada y la ejecución guardada son respaldos. No sustituyen la búsqueda y generación reales.

## Consumo acordado

Desarrollo: cero llamadas de pago. Propuesta aprobada de control: límite inicial de USD 1 para un ensayo expresamente autorizado; límite acumulado de USD 10 para ensayo y charla. No ejecutar el ensayo todavía. El límite debe configurarse en un proyecto API dedicado. No activar recargas automáticas ni modificar presupuestos de otros proyectos.

El límite del proveedor no es instantáneo; puede existir un pequeño exceso. Comprobar saldo y vencimiento antes de activar la demo. No prometer un número de búsquedas con el saldo restante.

## Aceptación

Comandos locales pasan; interfaz revisada; secretos ausentes del sitio; nuevo tema probado con IA real tras autorización; citas contrastables; fallos visibles; respaldo recuperable sin llamadas. El arranque sigue pendiente de aceptación hasta cumplir también la prueba real y el despliegue.

## Exclusiones

Cuentas comerciales, suscripciones, automatizaciones periódicas, publicación automática de resultados, etiquetas políticas automáticas y métricas de objetividad o impacto económico.

## Autorización externa

La usuaria autorizó crear el repositorio público carlitoselias/news-compass y confirmó su cuenta Cloudflare. También completó la autorización de Wrangler. Se permite publicar Pages y el Worker con la IA desactivada. El ensayo de pago sigue pendiente.
