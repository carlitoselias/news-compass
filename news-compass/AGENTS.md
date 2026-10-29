# Instrucciones para agentes

## Propósito

Demostrar en una charla, con noticias nuevas en vivo, como una IA compara coberturas y genera una sintesis verificable con fuentes y omisiones.

## Fuentes de verdad

1. Repositorio, pruebas y artefactos actuales.
2. Decisiones explícitas de la persona usuaria.
3. Backlog activo en la ruta declarada, cuando exista.
4. Handoff más reciente, solo para continuidad inmediata.

## Reglas

- No crear alcance, datos, credenciales, remotos ni despliegues sin autorización.
- No marcar trabajo terminado sin la evidencia de aceptación acordada.
- Un estado pendiente no autoriza su ejecución.
- Preservar cambios ajenos y revisar `git status --short` antes de editar.
- Mantener este archivo breve; las decisiones durables pertenecen a la documentación del proyecto.
- Validar build, comportamiento visible, teclado y ancho móvil en proporción al cambio.
- No exponer secretos al cliente ni versionar datos personales.

## Continuidad

- El backlog durable está en `docs/BACKLOG.md`.
- El handoff activo está en `.codex/handoff.md` y sus archivos históricos en `.codex/handoffs`.
- Reconciliar primero el backlog; el handoff referencia sus IDs y no duplica trabajo pendiente.
- Crear el primer handoff solo al cerrar una sesión sustantiva.

## Verificación

- `npm run check`
- `npm test`
- `npm run build`

- Explicar en español claro, con frases cortas y términos concretos. Cuestionar supuestos cuando afecten al resultado.
- No ejecutar llamadas de pago durante desarrollo. Un ensayo requiere autorización y límite efectivo confirmado.
