# Valeton GP-200 Online Manual

Manual online bilingue para la Valeton GP-200, pensado como una referencia visual y practica para explorar efectos, amplificadores, gabinetes, guias de ruteo y configuraciones utiles para vivo, estudio y grabacion.

El proyecto esta construido con Next.js y organiza el contenido en tarjetas por categoria, para que sea facil leer, buscar y agregar nuevos efectos cuando Valeton publique actualizaciones de firmware.

## Que Incluye

- Version en espanol e ingles: `/es` y `/en`.
- Busqueda en tiempo real por nombre, descripcion, parametros, tipo de efecto y tags musicales.
- Categorias por modulo: `PRE`, `WAH`, `DST`, `AMP`, `NR`, `CAB`, `EQ`, `MOD`, `DLY`, `RVB`, `VOL` y `GUIAS`.
- Tarjetas independientes para cada efecto, con imagen, descripcion, parametros, inspiracion de modelo real, uso recomendado y posicion sugerida en la cadena.
- Vista por necesidad musical: clean, blues, metal, ambient, worship, bajo, acustica, lead, rhythm y experimental.
- Cadena sugerida de referencia: `PRE -> WAH -> DST -> AMP -> NR -> CAB -> EQ -> MOD -> DLY -> RVB -> VOL`.
- Guias para configuraciones globales, salida a consola, USB audio/reamp, EXP/CTRL, looper, drum machine y tips de vivo.
- Favicon propio del sitio.

## Objetivo

La idea es que el manual funcione como una herramienta rapida para guitarristas y bajistas que usan la GP-200:

- Encontrar un efecto sin tener que recorrer todo el manual PDF.
- Entender para que sirve cada modelo.
- Identificar inspiraciones tipo Tube Screamer, Klon, AC30, Rectifier, CE-1, Phase 90 y similares.
- Armar cadenas de sonido mas logicas para vivo, grabacion o practica.
- Mantener una base facil de actualizar si aparecen nuevos efectos o funciones.

## Estructura Del Proyecto

```text
valeton-gp200-reference/
|-- app/
|   |-- [locale]/page.tsx   # Paginas /es y /en
|   |-- globals.css         # Estilos globales
|   |-- icon.svg            # Favicon del sitio
|   |-- layout.tsx
|   `-- page.tsx            # Redireccion a /es
|-- components/
|   `-- ValetonApp.tsx      # UI principal
|-- data/
|   |-- en.json             # Contenido en ingles
|   `-- es.json             # Contenido en espanol
|-- public/
|   |-- img/                # Imagenes generales
|   `-- temps/              # Imagenes de referencia por categoria
|-- types/
|   `-- content.ts          # Tipos del contenido
|-- package.json
`-- README.md
```

## Desarrollo Local

Instalar dependencias:

```bash
npm install
```

Levantar el servidor:

```bash
npm run dev
```

Abrir:

- Espanol: `http://127.0.0.1:3000/es`
- English: `http://127.0.0.1:3000/en`

Compilar para produccion:

```bash
npm run build
```

## Como Agregar Un Nuevo Efecto

Los efectos viven dentro de `data/es.json` y `data/en.json`, agrupados por categoria en `sections`.

Para agregar un efecto nuevo:

1. Abrir `data/es.json`.
2. Buscar la categoria correspondiente, por ejemplo `sections.pre`.
3. Copiar una tarjeta existente.
4. Cambiar los campos principales:
   - `name`: nombre del efecto.
   - `className`: clase de la categoria, por ejemplo `fx-card pre-card`.
   - `image`: ruta de la imagen dentro de `public/temps`.
   - `descriptionHtml`: descripcion del efecto.
   - `paramsHtml`: parametros disponibles.
   - `type`: tipo visible del efecto.
   - `musicalTags`: tags musicales para filtros y busqueda.
   - `recommendedUse`: recomendacion practica.
   - `inspiration`: referencia del modelo real si aplica.
   - `suggestedPosition`: lugar sugerido en la cadena.
   - `needTags`: necesidades musicales relacionadas.
   - `searchText`: texto usado por la busqueda.
5. Repetir el mismo contenido traducido en `data/en.json`.

Si la imagen es nueva, colocarla en la carpeta correspondiente dentro de `public/temps`.

## Conteo Actual

| Categoria | Cantidad |
|---|---:|
| PRE | 31 |
| WAH | 6 |
| DST | 39 |
| AMP | 72 |
| NR | 4 |
| CAB | 71 |
| EQ | 6 |
| MOD | 27 |
| DLY | 22 |
| RVB | 12 |
| VOL | 1 |
| GUIAS | 3 |

## Notas

- El proyecto ya no conserva los HTML estaticos originales ni carpetas duplicadas de assets.
- La UI usa tarjetas y controles de despliegue para evitar superposiciones de texto.
- El flujo principal de mantenimiento es editar `data/es.json`, `data/en.json` y agregar imagenes nuevas en `public/temps`.

## Autor

Proyecto creado y mantenido por Carabantech.

Portfolio: https://portfoliocarabantech.netlify.app/

GitHub: https://github.com/Carabantech
