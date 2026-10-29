# Diseño vigente: resumen y pregunta inversa

La revisión del 29 de octubre sustituye el recorrido anterior descrito más abajo. Se mantiene la identidad editorial roja, Georgia en títulos y Arial en lectura. Portada mínima: logo, icono de conexión y barra central. Dos vistas: La noticia y La pregunta. La primera contiene resumen por aristas, tarjetas de fuentes y comparación por temas con posiciones atribuidas. La segunda presenta los materiales y una propuesta editable. Sin Proyectar ni categoría Contradicciones. Footer centrado: newscompass · 2026. Ver ADR-017 a ADR-021 para conducta y límites.

Las fuentes usan dos columnas en escritorio y una en móvil. Los controles tienen foco visible, nombres accesibles y un tamaño de interacción mínimo de 44 px (las citas conservan formato compacto). Se usa el borde y la etiqueta, además del color, para distinguir el resumen derivado. Guardado en resultados y apertura mediante clip en la entrada. La conexión se indica con icono, estado accesible y punto de color.

## Especificación anterior conservada como referencia

# Sistema visual — Editorial rojo

Fecha: 29 de octubre de 2026. Dirección elegida por Loreto: blanco, negro y rojo. Implementación publicada sobre la refactorización UX existente (46c37d7; Actions 40914007892). Fuente de verdad de los valores: `web/styles.css`.

## Principio de diseño

Una interfaz editorial con titulares firmes, texto legible y acciones claras. El encabezado presenta la demo. Al cargar fuentes, se reduce para dar espacio al trabajo. Los medios reciben el mismo peso visual. El color no representa veracidad ni sesgo.

Se conservan la guía contextual, las tres vistas, la selección de fuentes, las citas locales, los avisos de cambios, el guardado manual y el modo lectura. La distinción entre FUENTE e IA usa palabras y estilos diferentes; no depende solo del color.

## Paleta

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#FFFDF8` | Fondo general blanco cálido |
| `--surface` | `#FFFFFF` | Campos, tarjetas y diálogos |
| `--surface-muted` | `#F1EFEA` | Citas, ayuda y superficies secundarias |
| `--ink` | `#171717` | Texto principal, reglas, selección y pestaña activa |
| `--muted` | `#595650` | Metadatos y explicaciones; no gris tenue |
| `--line` | `#B8B4AC` | Separadores secundarios y tarjetas no seleccionadas |
| `--accent` | `#C51F30` | Acción principal, enlaces y detalles de marca |
| `--accent-hover` | `#A31525` | Rojo al pasar el puntero |
| `--accent-active` | `#82101E` | Rojo durante la pulsación |
| `--accent-soft` | `#FFF0F1` | Fondo de error |
| `--warning` | `#694600` | Texto de aviso de respuesta anterior o acceso parcial |
| `--warning-bg` | `#FFF3D6` | Fondo de esos avisos |
| `--disabled-ink` | `#625E58` | Texto de controles desactivados |
| `--disabled-bg` | `#E7E4DE` | Fondo de controles desactivados |

El ámbar es una excepción funcional. Se reserva para avisos y limitaciones; no se usa como decoración. Los errores usan texto explícito, fondo rojo claro y borde. El rojo de marca, por sí solo, no indica un error. Los campos usan un borde `#79756E`, más fuerte que los separadores.

Contrastes calculados con luminancia relativa sRGB, sin redondear antes de dividir: texto/fondo 17,64:1; secundario/fondo 7,19:1; blanco/rojo 5,81:1; blanco/hover 7,80:1; blanco/pulsación 10,28:1; enlace rojo/fondo 5,72:1; texto inactivo/fondo 5,07:1; aviso ámbar 7,69:1; borde de campo/blanco 4,58:1. Estos cálculos no certifican la accesibilidad del sitio completo ni garantizan el contraste de un proyector físico.

## Tipografía

- **Titulares:** Georgia, Times New Roman, serif. Peso 700. Aporta carácter editorial sin cargar archivos de fuentes.
- **Interfaz y lectura:** Arial, Helvetica, sans-serif. Peso 400 para texto; 700 para controles y etiquetas. La síntesis conserva una letra sencilla para facilitar la lectura de párrafos y citas.
- **Marca:** misma familia de interfaz, peso 800 con respaldo del sistema. El isotipo SVG usa la paleta editorial.
- Sin peticiones a servicios de fuentes. La apariencia exacta depende de las fuentes instaladas; la familia de respaldo conserva su función.

| Elemento | Tamaño habitual a base 18 px | Criterio |
|---|---|---|
| Texto base | 18 px | Interlineado 1,55; lectura 1,65 |
| Ayudas y metadatos | 15,75 px (`.875rem`) | Texto secundario visible |
| Etiquetas pequeñas | 14,63 px (`.8125rem`) | No usar para contenido principal |
| Título inicial | 48,6–83,7 px | Escala fluida; interlineado 0,99 |
| Título con resultados | 40,5 px | Reduce el espacio de portada |
| Títulos de sección | 29,7–40,5 px | Georgia; interlineado 1,15 |
| Título de fuente | 27,9 px | Georgia; interlineado 1,2 |
| Texto de respuesta | 21,6 px | Interlineado 1,7; ancho máximo 68 caracteres |
| Botones | 15,75 px | Peso 700; interlineado 1,35 |
| Pestañas | 18 px | Paso explícito y selección persistente |

Desde 1600 px de ancho, la base sube a 20 px. En móvil, el titular baja hasta 37,8 px y las tarjetas se apilan. El subtítulo decorativo de marca es menor que el texto funcional.

## Controles y estados

| Componente | Normal | Hover | Pulsado / seleccionado |
|---|---|---|---|
| Principal | Rojo, texto blanco | Rojo oscuro | Rojo profundo |
| Secundario | Blanco, borde y texto negros | Negro, texto blanco | Gris carbón, texto blanco |
| Discreto | Fondo transparente, texto negro | Fondo gris y borde visible | Gris más fuerte |
| Pestaña | Blanco, texto negro | Gris suave | Negro, texto blanco y regla roja inferior |
| Cita local | Blanco, borde negro, referencia entre corchetes | Negro con texto blanco | Rojo profundo |
| Enlace | Rojo y subrayado | Rojo oscuro; subrayado más grueso | Rojo profundo |
| Casilla de fuente | Control nativo negro | Respuesta nativa | Marca de selección y borde de tarjeta negro |
| Proyección | Botón con borde negro | Fondo neutro | Negro; texto “Salir de proyección” |

Los estados hover solo se aplican a botones cuando hay un puntero compatible. No cambian el tamaño ni mueven el contenido. Transición de color: 120 ms. Movimiento reducido elimina transiciones y animaciones.

**Campo inválido:** tras una validación nativa fallida, borde rojo y fondo rojo claro mediante `:user-invalid`. Se conserva el mensaje de validación del navegador.

**Desactivado:** fondo y texto grises sólidos, cursor de acción no disponible, sin opacidad global. Se mantiene la explicación próxima que introdujo la nueva UX. No se habilita ninguna acción por motivos de apariencia.

**Foco de teclado:** contorno negro de 3 px, separación de 4 px y halo blanco. El anillo mantiene contraste tanto sobre blanco como sobre negro o rojo. Fragmentos y resultados enfocados reciben un contorno equivalente. Se mantiene el enlace para saltar al análisis, navegación de pestañas con flechas/Home/End y foco de los diálogos.

**Tamaños de interacción:** botones y desplegables de al menos 48 px; citas de al menos 44 × 44 px. Las casillas se incluyen en una etiqueta de 48 px de alto. Los textos largos pueden ocupar varias líneas.

## Composición

- Ancho máximo de página: 1440 px; 1600 px en pantallas grandes. Margen lateral fluido de 20 a 64 px.
- Espaciado basado en múltiplos de 4 px: 8, 12, 16, 20, 24, 32, 40 y 48.
- Bordes estructurales de 2–3 px; detalles de énfasis de 5–6 px. Radio de 3 px, sin píldoras decorativas.
- Dos columnas para fuentes y citas. Una columna hasta 800 px. La comparación se apila hasta 1100 px y siempre en proyección.
- Pestañas persistentes sin bloquear los destinos del foco. Se reserva espacio al desplazar hasta preguntas, citas y resultados.
- La guía indica la siguiente acción. El área de archivos mantiene un rango secundario. Las explicaciones extensas permanecen desplegables.
- El acontecimiento usa un bloque negro; las fuentes usan blanco. Las etiquetas FUENTE son blancas con borde; las etiquetas IA son negras con texto blanco. No se asignan colores distintos a distintos medios.
- Diálogos con fondo blanco, borde negro, acento rojo y fondo de página oscurecido. Su altura máxima respeta la ventana y permite desplazamiento.

## Proyección

El modo Proyectar sube ayudas y metadatos a 18–20 px, texto general a 20,25–22,5 px y respuesta a 24,3–27 px, según ancho de pantalla. Los titulares de fuentes crecen a 31,5–35 px. El encabezado con resultados permanece compacto. La comparación pasa a una columna.

El objetivo es facilitar la lectura. No es correcto asegurar que cualquier proyector será legible solo por usar rojo y negro. La distancia, la luz y el equipo todavía requieren una prueba en la sala.

## Alcance y validación

La capa visual no cambia el contrato de API ni el formato de archivos. La refactorización de UX previa continúa en revisión. La evidencia de pruebas y las observaciones del segundo agente se registran en `docs/VALIDATION.md`. La versión está publicada en https://carlitoselias.github.io/news-compass/. La publicación no implica aceptación del ensayo real.