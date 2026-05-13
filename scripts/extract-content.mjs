import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const locales = [
  { locale: "en", file: "index.html", otherLocale: "es" },
  { locale: "es", file: "index-es.html", otherLocale: "en" },
];

const effectSections = ["pre", "wah", "dst", "amp", "nr", "cab", "eq", "mod", "dly", "rvb"];

function matchOne(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Could not extract ${label}`);
  }
  return match[1].trim();
}

function stripTags(html) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function basenameFromSrc(src) {
  return decodeURIComponent(src.split("/").pop() ?? "")
    .replace(/\.[^.]+$/, "")
    .trim();
}

function normalizeSource(source) {
  return source
    .replaceAll('src="img/', 'src="/img/')
    .replaceAll('src="temps/', 'src="/temps/')
    .replaceAll('href="index-es.html"', 'href="/es"')
    .replaceAll('href="index.html"', 'href="/en"');
}

function extractSection(source, id, occurrence = 0) {
  const sectionPattern = new RegExp(`<section class="section(?: active)?" id="${id}">`, "g");
  const matches = [...source.matchAll(sectionPattern)];
  const startMatch = matches[occurrence];

  if (!startMatch) {
    throw new Error(`Could not find section ${id}`);
  }

  const start = startMatch.index;
  const next = source.indexOf("<section class=\"section", start + startMatch[0].length);
  const end = next === -1 ? source.indexOf('<div class="footer"', start) : next;

  if (end === -1) {
    throw new Error(`Could not find end for section ${id}`);
  }

  return source.slice(start, end);
}

function extractBalancedDivs(source, className) {
  const blocks = [];
  const needle = `<div class="${className}`;
  let cursor = 0;

  while (true) {
    const start = source.indexOf(needle, cursor);
    if (start === -1) break;

    let depth = 0;
    const tokenPattern = /<\/?div\b[^>]*>/gi;
    tokenPattern.lastIndex = start;

    let end = -1;
    for (const token of source.slice(start).matchAll(/<\/?div\b[^>]*>/gi)) {
      const tokenText = token[0];
      const absoluteIndex = start + token.index;

      if (tokenText.startsWith("</")) {
        depth -= 1;
      } else {
        depth += 1;
      }

      if (depth === 0) {
        end = absoluteIndex + tokenText.length;
        break;
      }
    }

    if (end === -1) {
      throw new Error(`Unbalanced div for ${className}`);
    }

    blocks.push(source.slice(start, end));
    cursor = end;
  }

  return blocks;
}

function extractGuides(source) {
  const section = extractSection(source, "view", 0);
  return extractBalancedDivs(section, "card").map((card) => ({
    category: matchOne(card, /<div class="category">([\s\S]*?)<\/div>/, "guide category"),
    title: matchOne(card, /<h3>([\s\S]*?)<\/h3>/, "guide title"),
    description: matchOne(card, /<p class="description">([\s\S]*?)<\/p>/, "guide description"),
    bodyHtml: matchOne(
      card,
      /<div style="margin-top:16px;color:#cbd5e1;font-size:0\.97rem;line-height:1\.7;">([\s\S]*?)<\/div>\s*<\/div>$/,
      "guide body",
    ),
  }));
}

function extractEffects(source, sectionId) {
  const section = extractSection(source, sectionId, 0);
  return extractBalancedDivs(section, "fx-card").map((card) => {
    const className = matchOne(card, /<div class="([^"]*\bfx-card\b[^"]*)">/, "effect class");
    const image = matchOne(card, /<img src="([^"]+)" class="fx-bg">/, "effect image");
    const descriptionHtml = matchOne(
      card,
      /<div class="fx-description">([\s\S]*?)<\/div>/,
      "effect description",
    );
    const paramsHtml = matchOne(card, /<div class="fx-params">([\s\S]*?)<\/div>/, "effect params");
    const type = matchOne(card, /<div class="fx-single-tag">([\s\S]*?)<\/div>/, "effect type");
    const name = basenameFromSrc(image);

    return {
      name,
      className,
      image,
      descriptionHtml,
      paramsHtml,
      type: stripTags(type),
      searchText: stripTags(`${name} ${descriptionHtml} ${paramsHtml} ${type}`),
    };
  });
}

await mkdir(path.join(root, "data"), { recursive: true });

for (const { locale, file, otherLocale } of locales) {
  const source = normalizeSource(await readFile(path.join(root, file), "utf8"));
  const title = matchOne(source, /<h1>([\s\S]*?)<\/h1>/, `${locale} title`);
  const description = matchOne(source, /<div class="hero-top">[\s\S]*?<\/div>\s*<p>([\s\S]*?)<\/p>/, `${locale} description`);
  const searchPlaceholder = matchOne(source, /placeholder="([^"]+)"/, `${locale} search placeholder`);
  const languageLabel = matchOne(source, /<a href="\/(?:en|es)"[^>]*>([\s\S]*?)<\/a>/, `${locale} language label`);
  const guidesLabel = matchOne(source, /<div class="tab" data-tab="view">[\s\S]*?<span[^>]*>[\s\S]*?<\/span>\s*<span>([\s\S]*?)<\/span>/, `${locale} guides label`);
  const footer = matchOne(source, /<div class="footer">([\s\S]*?)<\/div>/, `${locale} footer`);

  const payload = {
    locale,
    hero: {
      title,
      description,
      searchPlaceholder,
      image: "/img/GP200.png",
      languageHref: `/${otherLocale}`,
      languageLabel,
    },
    tabs: [
      ...effectSections.map((id) => ({
        id,
        label: id.toUpperCase(),
        icon: `/img/icon_${id.toUpperCase()}.png`,
      })),
      {
        id: "view",
        label: guidesLabel,
        iconText: "📖",
      },
    ],
    guides: extractGuides(source),
    sections: Object.fromEntries(
      effectSections.map((sectionId) => [sectionId, extractEffects(source, sectionId)]),
    ),
    footer,
  };

  await writeFile(path.join(root, "data", `${locale}.json`), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
