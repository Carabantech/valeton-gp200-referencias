# Valeton GP-200 Tone Reference

Referencia visual bilingue para explorar los efectos, amplificadores, gabinetes y guias de uso del procesador Valeton GP-200.

El proyecto corre como una app Next.js. El contenido esta separado en JSON por idioma para que sea facil agregar nuevos efectos por categoria y mantener las tarjetas sin superposiciones de texto.

## Caracteristicas

- Rutas por idioma: `/es` y `/en`.
- Busqueda en tiempo real por nombre, descripcion, parametros y tipo de efecto.
- Tabs por categoria: `PRE`, `WAH`, `DST`, `AMP`, `NR`, `CAB`, `EQ`, `MOD`, `DLY`, `RVB` y `GUIAS`.
- Cada efecto se renderiza como una tarjeta independiente con imagen, descripcion, parametros y tipo.
- Contenido bilingue en archivos JSON editables.
- Assets servidos desde `public/img` y `public/temps`.

## Estructura

```text
valeton-gp200-reference/
|-- app/
|   |-- [locale]/page.tsx   # Paginas /es y /en
|   |-- globals.css         # Estilos globales
|   |-- layout.tsx
|   `-- page.tsx            # Redireccion a /es
|-- components/
|   `-- ValetonApp.tsx      # UI principal
|-- data/
|   |-- en.json             # Contenido ingles
|   `-- es.json             # Contenido espanol
|-- public/
|   |-- img/                # Iconos y foto de la unidad
|   `-- temps/              # Imagenes de referencia por categoria
|-- types/
|   `-- content.ts          # Tipos del contenido
|-- package.json
`-- README.md
```

## Desarrollo

Instalar dependencias:

```bash
npm install
```

Levantar el servidor local:

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

Por ejemplo, para agregar un nuevo efecto en `PRE`:

1. Abrir `data/es.json`.
2. Buscar `sections.pre`.
3. Copiar un objeto de efecto existente.
4. Cambiar estos campos:
   - `name`: nombre del efecto.
   - `className`: usar la categoria correspondiente, por ejemplo `fx-card pre-card`.
   - `image`: ruta de la imagen en `public/temps/pre/...`.
   - `descriptionHtml`: descripcion del efecto.
   - `paramsHtml`: parametros en HTML simple.
   - `type`: etiqueta visible, por ejemplo `Type: Comp`.
   - `searchText`: texto usado por la busqueda.
5. Repetir el mismo efecto traducido en `data/en.json`.

Ejemplo:

```json
{
  "name": "Nuevo Comp",
  "className": "fx-card pre-card",
  "image": "/temps/pre/Nuevo Comp.png",
  "descriptionHtml": "Descripcion del nuevo efecto.",
  "paramsHtml": "<strong>Sustain:</strong> Controla la compresion<br><strong>Volume:</strong> Controla el nivel",
  "type": "Type: Comp",
  "searchText": "Nuevo Comp Descripcion del nuevo efecto Sustain Controla la compresion Volume Controla el nivel Type Comp"
}
```

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
| GUIAS | 3 |

## Notas

- El proyecto ya no conserva los HTML estaticos originales ni carpetas duplicadas de assets.
- La UI no posiciona texto encima de las imagenes, por lo que las descripciones largas no deberian superponerse.
- El flujo principal de mantenimiento es editar `data/es.json`, `data/en.json` y agregar imagenes nuevas en `public/temps`.
