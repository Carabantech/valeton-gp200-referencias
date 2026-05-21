from __future__ import annotations

import html
import json
import re
import time
from datetime import datetime
from pathlib import Path

import fitz
from deep_translator import GoogleTranslator


ROOT = Path(__file__).resolve().parent
PDF_DIR = Path(r"C:\Users\carab\OneDrive\Pedalera Valenton")
PDF_GLOB = "GP-200_Online*Manual_EN_Firmware V1.7.4.pdf"

OUTPUT_EN = ROOT / "manual 1.html"
OUTPUT_ES = ROOT / "manual 1_es.html"
ASSET_DIR = ROOT / "manual_1_assets" / "pages"
TRANSLATION_CACHE = ROOT / "manual_1_assets" / "translation-cache-google.json"

SPANISH_TITLES = {
    "About": "Acerca de",
    "Application Scenarios": "Escenarios de aplicacion",
    "Audio Studio (for livestreaming)": "Estudio de audio (para transmisiones en vivo)",
    "Auto CAB Match": "Emparejamiento automatico de CAB",
    "Compatible software": "Software compatible",
    "Contents": "Indice",
    "Cover": "Portada",
    "Display": "Pantalla",
    "Drum Rhythm List": "Lista de ritmos de bateria",
    "EXP 2 / Footswitch": "EXP 2 / Footswitch",
    "EXP Calibrate": "Calibracion de EXP",
    "EXP Pedal": "Pedal EXP",
    "Edit Menu": "Menu de edicion",
    "Effect List": "Lista de efectos",
    "Editing a Module": "Edicion de un modulo",
    "Footswitch": "Footswitch",
    "Getting Started": "Primeros pasos",
    "Global EQ": "EQ global",
    "Global Settings": "Ajustes globales",
    "Input/Output": "Entrada/Salida",
    "MIDI Control Information List": "Lista de informacion de control MIDI",
    "Main Display Screen": "Pantalla principal",
    "Managing the Signal Chain": "Gestion de la cadena de senal",
    "Overview": "Descripcion general",
    "Panel Introduction": "Introduccion del panel",
    "Patch Setting": "Ajustes de patch",
    "Patch Settings": "Ajustes de patch",
    "Save Menu": "Menu de guardado",
    "Screen Introduction": "Introduccion de pantalla",
    "SnapTone Function": "Funcion SnapTone",
    "Technical Specifications": "Especificaciones tecnicas",
    "Troubleshooting": "Solucion de problemas",
    "USB Audio": "Audio USB",
    "Welcome": "Bienvenida",
}

GLOSSARY_REPLACEMENTS = {
    "configuracion del parche": "ajuste de patch",
    "configuración del parche": "ajuste de patch",
    "configuraciones del parche": "ajustes de patch",
    "configuraciones de parches": "ajustes de patches",
    "parche": "patch",
    "parches": "patches",
    "preajuste": "preset",
    "preajustes": "presets",
    "interruptor de pie": "footswitch",
    "interruptores de pie": "footswitches",
    "pedal exp": "pedal EXP",
    "pedal de expresion": "pedal de expresion",
    "bucle de efectos": "loop de efectos",
    "bucle fx": "loop FX",
    "bucle de fx": "loop FX",
    "gabinete": "cabina",
    "gabinetes": "cabinas",
    "cabina": "cab/pantalla",
    "cabinas": "cabs/pantallas",
    "ruido puerta": "puerta de ruido",
    "puerta de ruidos": "puerta de ruido",
    "grifo tempo": "tap tempo",
    "tempo de tap": "tap tempo",
    "toque tempo": "tap tempo",
    "cadena de senal": "cadena de señal",
    "modulacion": "modulación",
    "reverberacion": "reverb",
    "retardo": "delay",
    "la ajuste de patch": "el ajuste de patch",
    "las ajuste de patch": "los ajustes de patch",
    "una ajuste de patch": "un ajuste de patch",
    "esta ajuste de patch": "este ajuste de patch",
    "ajustes de patch actual": "ajustes de patch actuales",
    "mando": "perilla",
    "mandos": "perillas",
    "el perilla": "la perilla",
    "del perilla": "de la perilla",
    "los perillas": "las perillas",
    ". la perilla": ". La perilla",
    "pedal/pedal exp": "footswitch/pedal EXP",
}


def first_pdf() -> Path:
    matches = sorted(PDF_DIR.glob(PDF_GLOB))
    if not matches:
        raise FileNotFoundError(f"No PDF matched {PDF_DIR / PDF_GLOB}")
    return matches[0]


def slugify(value: str, index: int) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return f"{slug or 'page'}-{index}"


def page_title(text: str, index: int) -> str:
    if index == 1:
        return "Cover"
    if index == 2:
        return "Contents"

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        line = re.sub(r"\s+\d+\s*$", "", line)
        line = re.sub(r"\s{2,}.*$", "", line).strip()
        if 2 <= len(line) <= 70:
            return line

    return f"Page {index}"


def render_page(page: fitz.Page, output: Path) -> tuple[int, int]:
    matrix = fitz.Matrix(2, 2)
    pixmap = page.get_pixmap(matrix=matrix, alpha=False)
    pixmap.save(output)
    return pixmap.width, pixmap.height


def extract_pages(pdf_path: Path) -> list[dict[str, object]]:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    pages: list[dict[str, object]] = []

    for zero_index, page in enumerate(doc):
        index = zero_index + 1
        image_name = f"page-{index:03}.png"
        image_path = ASSET_DIR / image_name
        width, height = render_page(page, image_path)
        text = page.get_text("text").strip()
        title = page_title(text, index)
        pages.append(
            {
                "index": index,
                "id": slugify(title, index),
                "title": title,
                "text": text,
                "image": f"manual_1_assets/pages/{image_name}",
                "width": width,
                "height": height,
            }
        )

    return pages


def load_cache() -> dict[str, str]:
    if not TRANSLATION_CACHE.exists():
        return {}
    return json.loads(TRANSLATION_CACHE.read_text(encoding="utf-8"))


def save_cache(cache: dict[str, str]) -> None:
    TRANSLATION_CACHE.parent.mkdir(parents=True, exist_ok=True)
    TRANSLATION_CACHE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def get_translator():
    return GoogleTranslator(source="en", target="es")


def split_for_translation(text: str, limit: int = 900) -> list[str]:
    blocks = re.split(r"\n\s*\n", text.strip())
    chunks: list[str] = []
    current = ""

    for block in blocks:
        clean_block = re.sub(r"[ \t]+", " ", block).strip()
        if not clean_block:
            continue
        if current and len(current) + len(clean_block) + 2 > limit:
            chunks.append(current)
            current = clean_block
        else:
            current = f"{current}\n\n{clean_block}".strip()

    if current:
        chunks.append(current)

    return chunks


def apply_glossary(text: str) -> str:
    for source, target in GLOSSARY_REPLACEMENTS.items():
        text = re.sub(rf"\b{re.escape(source)}\b", target, text, flags=re.IGNORECASE)
    return text


def translate_text(text: str, translator: GoogleTranslator, cache: dict[str, str]) -> str:
    if not text.strip():
        return ""

    translated_chunks: list[str] = []
    for chunk in split_for_translation(text):
        if chunk not in cache:
            cache[chunk] = translate_chunk(translator, chunk)
        translated_chunks.append(cache[chunk])

    return apply_glossary("\n\n".join(translated_chunks))


def translate_chunk(translator: GoogleTranslator, chunk: str) -> str:
    last_error: Exception | None = None

    for attempt in range(4):
        try:
            return translator.translate(chunk)
        except Exception as error:  # The free endpoint occasionally drops requests.
            last_error = error
            time.sleep(1.5 + attempt)

    if len(chunk) > 350:
        midpoint = len(chunk) // 2
        split_at = chunk.rfind(" ", 0, midpoint)
        if split_at < 120:
            split_at = midpoint
        left = translate_chunk(translator, chunk[:split_at].strip())
        right = translate_chunk(translator, chunk[split_at:].strip())
        return f"{left} {right}".strip()

    raise RuntimeError(f"Could not translate chunk after retries: {last_error}")


def translated_pages(pages: list[dict[str, object]]) -> list[dict[str, object]]:
    cache = load_cache()
    translator = get_translator()
    translated: list[dict[str, object]] = []

    for page in pages:
        copy = dict(page)
        copy["title"] = SPANISH_TITLES.get(str(page["title"]), str(page["title"]))
        copy["text"] = translate_text(str(page["text"]), translator, cache)
        translated.append(copy)

        save_cache(cache)

    save_cache(cache)
    return translated


def nav_html(pages: list[dict[str, object]]) -> str:
    return "\n".join(
        f'<a href="#{page["id"]}"><span>{html.escape(str(page["title"]))}</span>'
        f'<small>{page["index"]}</small></a>'
        for page in pages
    )


def sections_html(
    pages: list[dict[str, object]],
    page_label: str,
    image_alt: str,
    visible_text_heading: str | None = None,
) -> str:
    sections: list[str] = []

    for page in pages:
        visible_text = ""
        if visible_text_heading:
            visible_text = f"""
  <div class="translation">
    <h3>{visible_text_heading}</h3>
    <pre>{html.escape(str(page["text"]))}</pre>
  </div>
"""

        sections.append(
            f"""
<section class="manual-page" id="{page["id"]}" data-page="{page["index"]}" data-title="{html.escape(str(page["title"]))}">
  <div class="page-heading">
    <h2>{html.escape(str(page["title"]))}</h2>
    <span>{page_label} {page["index"]}</span>
  </div>
  <figure>
    <img src="{page["image"]}" width="{page["width"]}" height="{page["height"]}" alt="{image_alt} {page["index"]}">
  </figure>
{visible_text}
  <pre class="page-text">{html.escape(str(page["text"]))}</pre>
</section>
""".strip()
        )

    return "\n".join(sections)


def write_html(
    output: Path,
    *,
    lang: str,
    title: str,
    heading: str,
    subtitle: str,
    search_placeholder: str,
    source_label: str,
    pages_label: str,
    generated_label: str,
    page_label: str,
    image_alt: str,
    visible_text_heading: str | None = None,
    pdf_name: str,
    pages: list[dict[str, object]],
) -> None:
    generated = datetime.now().strftime("%Y-%m-%d %H:%M")
    nav = nav_html(pages)
    sections = sections_html(pages, page_label, image_alt, visible_text_heading)

    output.write_text(
        f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    :root {{
      color-scheme: light;
      --ink: #17202b;
      --muted: #657083;
      --line: #d8dee8;
      --paper: #f5f7fa;
      --panel: #ffffff;
      --side: #111820;
      --side-soft: #1b2531;
      --accent: #b72b24;
      --accent-soft: #fff1ef;
    }}

    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}

    body {{
      margin: 0;
      color: var(--ink);
      background: var(--paper);
      font-family: "Segoe UI", Roboto, Arial, sans-serif;
      line-height: 1.5;
    }}

    .shell {{
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(245px, 315px) minmax(0, 1fr);
    }}

    aside {{
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: auto;
      padding: 22px 18px;
      color: white;
      background: var(--side);
      border-right: 1px solid #253241;
    }}

    .brand {{
      display: grid;
      gap: 5px;
      margin-bottom: 18px;
    }}

    .brand strong {{
      font-size: 1.2rem;
      letter-spacing: 0;
    }}

    .brand span {{
      color: #b7c3d4;
      font-size: .9rem;
    }}

    .search {{
      width: 100%;
      min-height: 42px;
      border: 1px solid #344357;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 16px;
      color: white;
      background: var(--side-soft);
      font: inherit;
    }}

    nav {{
      display: grid;
      gap: 2px;
    }}

    nav a {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 9px;
      border-radius: 6px;
      color: #dbe4f0;
      text-decoration: none;
      font-size: .92rem;
    }}

    nav a:hover,
    nav a:focus {{
      background: #263345;
      outline: none;
    }}

    nav small {{
      flex: 0 0 auto;
      color: #94a4b9;
      font-size: .74rem;
    }}

    main {{
      min-width: 0;
      padding: 34px clamp(16px, 4vw, 58px) 58px;
    }}

    header {{
      max-width: 1100px;
      margin: 0 auto 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--line);
    }}

    h1 {{
      margin: 0;
      font-size: clamp(2rem, 4vw, 3.25rem);
      line-height: 1.05;
      letter-spacing: 0;
    }}

    .meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-top: 10px;
      color: var(--muted);
      font-size: .95rem;
    }}

    .manual-page {{
      max-width: 1100px;
      margin: 0 auto 22px;
      overflow: hidden;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 12px 28px rgba(20, 30, 44, .08);
    }}

    .page-heading {{
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      padding: 15px 18px;
      background: linear-gradient(90deg, var(--accent-soft), #fff);
      border-bottom: 1px solid var(--line);
    }}

    h2 {{
      margin: 0;
      font-size: 1.12rem;
      letter-spacing: 0;
    }}

    .page-heading span {{
      color: var(--muted);
      font-size: .85rem;
      white-space: nowrap;
    }}

    figure {{
      margin: 0;
      padding: clamp(10px, 2vw, 22px);
      background: #e9edf3;
    }}

    img {{
      display: block;
      width: 100%;
      height: auto;
      margin: 0 auto;
      background: white;
      border: 1px solid #cfd6e1;
      box-shadow: 0 8px 20px rgba(15, 23, 35, .14);
    }}

    .translation {{
      padding: 18px;
      border-top: 1px solid var(--line);
      background: #fff;
    }}

    .translation h3 {{
      margin: 0 0 10px;
      color: var(--accent);
      font-size: .98rem;
      letter-spacing: 0;
    }}

    .translation pre {{
      margin: 0;
      white-space: pre-wrap;
      font: 15px/1.62 "Segoe UI", Roboto, Arial, sans-serif;
    }}

    .page-text {{
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: pre-wrap;
    }}

    .hidden {{ display: none; }}

    @media print {{
      .shell {{ display: block; }}
      aside, header, .page-heading {{ display: none; }}
      main {{ padding: 0; }}
      .manual-page {{
        margin: 0 0 10mm;
        border: 0;
        box-shadow: none;
        break-after: page;
      }}
      figure {{ padding: 0; background: white; }}
      img {{ border: 0; box-shadow: none; }}
    }}

    @media (max-width: 860px) {{
      .shell {{ display: block; }}
      aside {{
        position: relative;
        height: auto;
        max-height: 48vh;
        border-right: 0;
      }}
      main {{ padding-top: 22px; }}
    }}
  </style>
</head>
<body>
  <div class="shell">
    <aside>
      <div class="brand">
        <strong>Valeton GP-200</strong>
        <span>{subtitle}</span>
      </div>
      <input class="search" id="search" type="search" placeholder="{search_placeholder}">
      <nav id="nav">
{nav}
      </nav>
    </aside>
    <main>
      <header>
        <h1>{heading}</h1>
        <div class="meta">
          <span>{source_label}: {html.escape(pdf_name)}</span>
          <span>{len(pages)} {pages_label}</span>
          <span>{generated_label} {generated}</span>
        </div>
      </header>
{sections}
    </main>
  </div>
  <script>
    const search = document.querySelector("#search");
    const pages = [...document.querySelectorAll(".manual-page")];
    const links = [...document.querySelectorAll("nav a")];

    search.addEventListener("input", () => {{
      const query = search.value.trim().toLowerCase();

      pages.forEach((page, index) => {{
        const title = page.dataset.title.toLowerCase();
        const text = page.querySelector(".page-text").innerText.toLowerCase();
        const visible = !query || title.includes(query) || text.includes(query);
        page.classList.toggle("hidden", !visible);
        links[index].classList.toggle("hidden", !visible);
      }});
    }});
  </script>
</body>
</html>
""",
        encoding="utf-8",
    )


def build() -> None:
    pdf_path = first_pdf()
    pages_en = extract_pages(pdf_path)
    pages_es = translated_pages(pages_en)

    write_html(
        OUTPUT_EN,
        lang="en",
        title="Valeton GP-200 User Manual - Firmware V1.7.4",
        heading="Valeton GP-200 User Manual",
        subtitle="User Manual - Firmware V1.7.4",
        search_placeholder="Search manual",
        source_label="Source",
        pages_label="rendered pages with images",
        generated_label="Generated",
        page_label="Page",
        image_alt="GP-200 manual page",
        visible_text_heading=None,
        pdf_name=pdf_path.name,
        pages=pages_en,
    )

    write_html(
        OUTPUT_ES,
        lang="es",
        title="Manual en espa&ntilde;ol Valeton GP-200 - Firmware V1.7.4",
        heading="Manual en espa&ntilde;ol Valeton GP-200",
        subtitle="Manual en espa&ntilde;ol - Firmware V1.7.4",
        search_placeholder="Buscar en el manual",
        source_label="Fuente",
        pages_label="paginas con imagenes originales",
        generated_label="Traducido/generado",
        page_label="Pagina",
        image_alt="Pagina del manual GP-200",
        visible_text_heading="Traducci&oacute;n al espa&ntilde;ol",
        pdf_name=pdf_path.name,
        pages=pages_es,
    )

    print(f"Generated {OUTPUT_EN}")
    print(f"Generated {OUTPUT_ES}")
    print(f"Rendered {len(pages_en)} pages into {ASSET_DIR}")


if __name__ == "__main__":
    build()
