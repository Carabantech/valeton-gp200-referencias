"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Effect, Guide, Tab, ValetonContent } from "@/types/content";

type ValetonAppProps = {
  content: ValetonContent;
};

const defaultTab = "pre";
const chainOrder = ["pre", "wah", "dst", "amp", "nr", "cab", "eq", "mod", "dly", "rvb", "vol"];
const needOptions = [
  { id: "clean", en: "I want clean", es: "Quiero un clean" },
  { id: "metal", en: "I want metal", es: "Quiero metal" },
  { id: "blues", en: "I want blues", es: "Quiero blues" },
  { id: "ambient", en: "I want ambient", es: "Quiero ambient" },
  { id: "bass", en: "I want bass", es: "Quiero bajo" },
  { id: "acoustic", en: "I want acoustic", es: "Quiero acustica" },
  { id: "experimental", en: "I want experimental", es: "Quiero experimentar" },
  { id: "lead", en: "I want lead", es: "Quiero lead" },
  { id: "rhythm", en: "I want rhythm", es: "Quiero rhythm" },
];

export function ValetonApp({ content }: ValetonAppProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeNeed, setActiveNeed] = useState<string | null>(null);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const isFiltering = normalizedSearch.length > 0 || Boolean(activeNeed);

  const sectionCounts = useMemo(
    () => Object.fromEntries(Object.entries(content.sections).map(([id, effects]) => [id, effects.length])),
    [content.sections],
  );

  const filteredSections = useMemo(() => {
    return Object.fromEntries(
      Object.entries(content.sections).map(([sectionId, effects]) => [
        sectionId,
        effects.filter((effect) => {
          const matchesSearch = effect.searchText.toLowerCase().includes(normalizedSearch);
          const matchesNeed = activeNeed ? effectMatchesNeed(effect, activeNeed) : true;
          return matchesSearch && matchesNeed;
        }),
      ]),
    );
  }, [activeNeed, content.sections, normalizedSearch]);

  const totalEffects = useMemo(
    () => Object.values(sectionCounts).reduce((total, count) => total + count, 0),
    [sectionCounts],
  );

  const totalResults = useMemo(
    () => Object.values(filteredSections).reduce((total, effects) => total + effects.length, 0),
    [filteredSections],
  );

  return (
    <div className="container">
      <Hero
        content={content}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        totalEffects={totalEffects}
        activeCount={isFiltering ? totalResults : sectionCounts[activeTab] ?? content.guides.length}
        isSearching={isFiltering}
      />

      <NeedFilters
        locale={content.locale}
        activeNeed={activeNeed}
        onNeedChange={(need) => setActiveNeed((current) => (current === need ? null : need))}
        onClear={() => {
          setActiveNeed(null);
          setSearchTerm("");
        }}
        isFiltering={isFiltering}
      />

      <SignalChain
        tabs={content.tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setSearchTerm("");
          setActiveNeed(null);
        }}
      />

      <Tabs
        tabs={content.tabs}
        activeTab={activeTab}
        counts={{ ...sectionCounts, view: content.guides.length }}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setSearchTerm("");
          setActiveNeed(null);
        }}
      />

      <GuideSection active={!isFiltering && activeTab === "view"} guides={content.guides} locale={content.locale} />

      {content.tabs
        .filter((tab) => tab.id !== "view")
        .map((tab) => {
          const effects = isFiltering ? filteredSections[tab.id] ?? [] : content.sections[tab.id] ?? [];
          const active = isFiltering ? effects.length > 0 : activeTab === tab.id;

          return (
            <EffectSection
              key={tab.id}
              id={tab.id}
              active={active}
              effects={effects}
              locale={content.locale}
              label={tab.label}
              isSearching={isFiltering}
            />
          );
        })}

      <DonationSection locale={content.locale} />

      <div className="footer" dangerouslySetInnerHTML={{ __html: content.footer }} />
    </div>
  );
}

function Hero({
  content,
  searchTerm,
  onSearchTermChange,
  totalEffects,
  activeCount,
  isSearching,
}: {
  content: ValetonContent;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  totalEffects: number;
  activeCount: number;
  isSearching: boolean;
}) {
  const isSpanish = content.locale === "es";

  return (
    <div className="hero">
      <div className="hero-actions">
        <a
          href={content.hero.languageHref}
          className="language-link"
          dangerouslySetInnerHTML={{ __html: content.hero.languageLabel }}
        />
      </div>

      <div className="hero-top">
        <div>
          <p className="eyebrow">Valeton GP-200</p>
          <h1>{content.hero.title}</h1>
        </div>
        <img src={content.hero.image} className="hero-unit" alt="Valeton GP-200" />
      </div>

      <p className="hero-copy">{content.hero.description}</p>

      <div className="hero-meta" aria-label={isSpanish ? "Resumen" : "Summary"}>
        <span>{totalEffects} FX</span>
        <span>
          {activeCount} {isSearching ? (isSpanish ? "resultados" : "results") : isSpanish ? "visibles" : "visible"}
        </span>
        <span>GP-200</span>
      </div>

      <div className="search-wrap">
        <input
          type="text"
          className="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder={content.hero.searchPlaceholder}
        />
        {searchTerm ? (
          <button type="button" className="clear-search" onClick={() => onSearchTermChange("")}>
            {isSpanish ? "Limpiar" : "Clear"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Tabs({
  tabs,
  activeTab,
  counts,
  onTabChange,
}: {
  tabs: Tab[];
  activeTab: string;
  counts: Record<string, number>;
  onTabChange: (tabId: string) => void;
}) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab${activeTab === tab.id ? " active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon ? (
            <img src={tab.icon} className="tab-icon" alt="" aria-hidden="true" />
          ) : (
            <span className="tab-symbol" dangerouslySetInnerHTML={{ __html: tab.iconText ?? "" }} />
          )}
          <span dangerouslySetInnerHTML={{ __html: tab.label }} />
          <span className="tab-count">{counts[tab.id] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

function NeedFilters({
  locale,
  activeNeed,
  isFiltering,
  onNeedChange,
  onClear,
}: {
  locale: ValetonContent["locale"];
  activeNeed: string | null;
  isFiltering: boolean;
  onNeedChange: (need: string) => void;
  onClear: () => void;
}) {
  const isSpanish = locale === "es";

  return (
    <section className="need-panel" aria-label={isSpanish ? "Vista por necesidad" : "Need-based view"}>
      <div>
        <p>{isSpanish ? "Vista por necesidad" : "Need-based view"}</p>
        <h2>{isSpanish ? "Buscar por intencion musical" : "Browse by musical intention"}</h2>
      </div>

      <div className="need-actions">
        {needOptions.map((need) => (
          <button
            key={need.id}
            type="button"
            className={`need-chip${activeNeed === need.id ? " active" : ""}`}
            onClick={() => onNeedChange(need.id)}
          >
            {isSpanish ? need.es : need.en}
          </button>
        ))}
        {isFiltering ? (
          <button type="button" className="need-chip clear" onClick={onClear}>
            {isSpanish ? "Ver todo" : "Show all"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function SignalChain({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}) {
  const labels = Object.fromEntries(tabs.map((tab) => [tab.id, tab.label]));

  return (
    <nav className="signal-chain" aria-label="Suggested signal chain">
      {chainOrder.map((id, index) => (
        <div className="chain-step" key={id}>
          <button
            type="button"
            className={activeTab === id ? "active" : ""}
            onClick={() => onTabChange(id)}
          >
            {labels[id] ?? id.toUpperCase()}
          </button>
          {index < chainOrder.length - 1 ? <span aria-hidden="true">&gt;</span> : null}
        </div>
      ))}
    </nav>
  );
}

function GuideSection({
  active,
  guides,
  locale,
}: {
  active: boolean;
  guides: Guide[];
  locale: ValetonContent["locale"];
}) {
  const isSpanish = locale === "es";

  return (
    <section className={`section${active ? " active" : ""}`} id="view">
      <div className="section-heading">
        <div>
          <p>{isSpanish ? "Documentacion" : "Documentation"}</p>
          <h2>{isSpanish ? "Guias" : "Guides"}</h2>
        </div>
        <span>{guides.length}</span>
      </div>

      <div className="guide-grid">
        {guides.map((guide) => (
          <article className="card guide-card" key={guide.title}>
            <div className="category" dangerouslySetInnerHTML={{ __html: guide.category }} />
            <h3 dangerouslySetInnerHTML={{ __html: guide.title }} />
            <p className="description" dangerouslySetInnerHTML={{ __html: guide.description }} />
            <div className="guide-body" dangerouslySetInnerHTML={{ __html: guide.bodyHtml }} />
          </article>
        ))}
      </div>
    </section>
  );
}

function DonationSection({ locale }: { locale: ValetonContent["locale"] }) {
  const isSpanish = locale === "es";

  return (
    <section className="donation-panel" aria-label={isSpanish ? "Donaciones" : "Donations"}>
      <div className="donation-copy">
        <p>{isSpanish ? "Apoyar el proyecto" : "Support the project"}</p>
        <h2>{isSpanish ? "Te sirvio el manual?" : "Did this manual help?"}</h2>
        <span>
          {isSpanish
            ? "Si queres colaborar con este manual online, podes invitarme un cafe o enviar cripto por QR."
            : "If you want to support this online manual, you can buy me a coffee or send crypto by QR."}
        </span>
      </div>

      <div className="donation-actions">
        <a href="https://cafecito.app/carabantech" rel="noopener" target="_blank" className="cafecito-link">
          <img
            srcSet="https://cdn.cafecito.app/imgs/buttons/button_6.png 1x, https://cdn.cafecito.app/imgs/buttons/button_6_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_6_3.75x.png 3.75x"
            src="https://cdn.cafecito.app/imgs/buttons/button_6.png"
            alt={isSpanish ? "Invitame un cafe en cafecito.app" : "Buy me a coffee on cafecito.app"}
          />
        </a>

        <div className="crypto-donation">
          <img src="/img/qr-bitso.jpeg" alt={isSpanish ? "QR para donacion cripto" : "Crypto donation QR"} />
          <span>{isSpanish ? "Cripto por QR" : "Crypto by QR"}</span>
        </div>
      </div>
    </section>
  );
}

function EffectSection({
  id,
  active,
  effects,
  locale,
  label,
  isSearching,
}: {
  id: string;
  active: boolean;
  effects: Effect[];
  locale: ValetonContent["locale"];
  label: string;
  isSearching: boolean;
}) {
  const isSpanish = locale === "es";

  return (
    <section className={`section${active ? " active" : ""}`} id={id}>
      <div className="section-heading">
        <div>
          <p>{isSearching ? (isSpanish ? "Resultados en" : "Results in") : isSpanish ? "Categoria" : "Category"}</p>
          <h2>{label}</h2>
        </div>
        <span>{effects.length}</span>
      </div>

      <div className="fx-grid searchable">
        {effects.map((effect, index) => (
          <EffectCard effect={effect} key={`${id}-${effect.name}-${index}`} locale={locale} />
        ))}
      </div>
    </section>
  );
}

function EffectCard({ effect, locale }: { effect: Effect; locale: ValetonContent["locale"] }) {
  const isSpanish = locale === "es";
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const descriptionPanelRef = useRef<HTMLElement>(null);
  const paramsPanelRef = useRef<HTMLElement>(null);
  const toneTags = getToneTags(effect, locale);
  const toneTip = effect.recommendedUse ?? getToneTip(effect, locale);

  useEffect(() => {
    setExpanded(false);

    const measureOverflow = () => {
      const panels = [descriptionPanelRef.current, paramsPanelRef.current].filter(
        (panel): panel is HTMLElement => Boolean(panel),
      );
      setCanExpand(panels.some((panel) => panel.scrollHeight > panel.clientHeight + 2));
    };

    const frame = window.requestAnimationFrame(measureOverflow);
    window.addEventListener("resize", measureOverflow);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureOverflow);
    };
  }, [effect.descriptionHtml, effect.paramsHtml]);

  return (
    <article className={`${effect.className}${expanded ? " expanded" : ""}`} aria-label={effect.name}>
      <div className="fx-card-media">
        <img src={effect.image} className="fx-bg" alt="" aria-hidden="true" />
      </div>

      <div className="fx-card-body">
        <div className="fx-card-header">
          <h3 className="fx-title">{effect.name}</h3>
          <div className="fx-single-tag">{effect.type}</div>
        </div>

        <div className="tone-row" aria-label={isSpanish ? "Etiquetas musicales" : "Musical tags"}>
          {toneTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <p className="fx-tip">{toneTip}</p>

        {(effect.inspiration || effect.suggestedPosition) ? (
          <div className="effect-meta">
            {effect.inspiration ? <span>{effect.inspiration}</span> : null}
            {effect.suggestedPosition ? <span>{effect.suggestedPosition}</span> : null}
          </div>
        ) : null}

        <div className="fx-content-grid">
          <section className="fx-text-panel" ref={descriptionPanelRef}>
            <h4>{isSpanish ? "Descripcion" : "Description"}</h4>
            <div className="fx-description" dangerouslySetInnerHTML={{ __html: effect.descriptionHtml }} />
          </section>

          <section className="fx-text-panel" ref={paramsPanelRef}>
            <h4>{isSpanish ? "Parametros" : "Parameters"}</h4>
            <div className="fx-params" dangerouslySetInnerHTML={{ __html: effect.paramsHtml }} />
          </section>
        </div>

        {canExpand ? (
          <button type="button" className="expand-card" onClick={() => setExpanded((value) => !value)}>
            {expanded ? (isSpanish ? "Ver menos" : "Show less") : isSpanish ? "Ver mas" : "Show more"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function getToneTags(effect: Effect, locale: ValetonContent["locale"]) {
  if (effect.musicalTags?.length) {
    return effect.musicalTags.slice(0, 4);
  }

  const text = `${effect.name} ${effect.type} ${effect.searchText} ${effect.className}`.toLowerCase();
  const tags = new Set<string>();
  const es = locale === "es";

  if (text.includes("clean")) tags.add(es ? "Limpio" : "Clean");
  if (text.includes("drive") || text.includes("od") || text.includes("dist") || text.includes("boost")) {
    tags.add(es ? "Ganancia" : "Gain");
  }
  if (text.includes("hi gain") || text.includes("metal") || text.includes("rectifier")) {
    tags.add(es ? "High gain" : "High gain");
  }
  if (text.includes("bass")) tags.add(es ? "Bajo" : "Bass");
  if (text.includes("acoustic")) tags.add(es ? "Acustico" : "Acoustic");
  if (text.includes("delay") || text.includes("reverb") || text.includes("shimmer") || text.includes("freeze")) {
    tags.add(es ? "Ambiente" : "Ambient");
  }
  if (text.includes("chorus") || text.includes("flanger") || text.includes("phaser") || text.includes("tremolo") || text.includes("vibrato")) {
    tags.add(es ? "Movimiento" : "Movement");
  }
  if (text.includes("wah") || text.includes("pitch") || text.includes("expression")) {
    tags.add(es ? "Expresivo" : "Expressive");
  }
  if (text.includes("comp") || text.includes("gate") || text.includes("eq") || text.includes("volume")) {
    tags.add(es ? "Control" : "Control");
  }

  if (tags.size === 0) {
    tags.add(es ? "Tono" : "Tone");
  }

  return Array.from(tags).slice(0, 3);
}

function getToneTip(effect: Effect, locale: ValetonContent["locale"]) {
  const text = `${effect.type} ${effect.className} ${effect.searchText}`.toLowerCase();
  const es = locale === "es";

  if (text.includes("pre-card")) return es ? "Usalo al inicio para moldear la respuesta antes del ampli." : "Use early in the chain to shape the feel before the amp.";
  if (text.includes("wah-card")) return es ? "Asignalo al pedal EXP para fraseo y barridos mas expresivos." : "Assign it to EXP for expressive sweeps and phrasing.";
  if (text.includes("dst-card")) return es ? "Funciona mejor antes del AMP para empujar o colorear la ganancia." : "Best before the AMP to push or color the gain stage.";
  if (text.includes("amp-card")) return es ? "Elegilo como base del preset; despues ajusta CAB y EQ." : "Pick this as the preset foundation, then match CAB and EQ.";
  if (text.includes("nr-card")) return es ? "Ajustalo justo hasta limpiar ruido sin cortar sustain." : "Set it just high enough to clean noise without choking sustain.";
  if (text.includes("cab-card")) return es ? "Clave para el caracter final: proba low/high cut para mezclar mejor." : "Key to the final voice: use low/high cut to sit better in a mix.";
  if (text.includes("eq-card")) return es ? "Usalo para corregir la mezcla, no solo para cambiar el tono." : "Use it to make the preset fit the mix, not just change tone.";
  if (text.includes("mod-card")) return es ? "Despues del AMP da color clasico; antes del AMP suena mas experimental." : "After AMP is classic color; before AMP gets more experimental.";
  if (text.includes("dly-card")) return es ? "Sincronizalo al tempo y cuida el Mix para no tapar la pua." : "Sync to tempo and keep Mix controlled so repeats do not bury the pick.";
  if (text.includes("rvb-card")) return es ? "Ideal al final de la cadena; menos Mix suele sonar mas grande." : "Usually best late in the chain; less Mix often sounds bigger.";
  if (text.includes("vol-card")) return es ? "Ponelo donde quieras controlar nivel: antes del delay para swells, al final para volumen general." : "Place it where you need level control: before delay for swells, last for master volume.";

  return es ? "Probalo con diferentes posiciones en la cadena." : "Try it in different chain positions.";
}

function effectMatchesNeed(effect: Effect, need: string) {
  const explicitTags = effect.needTags?.map((tag) => tag.toLowerCase()) ?? [];
  if (explicitTags.includes(need)) return true;

  const text = `${effect.name} ${effect.type} ${effect.searchText} ${effect.className} ${(effect.musicalTags ?? []).join(" ")}`.toLowerCase();

  switch (need) {
    case "clean":
      return text.includes("clean") || text.includes("jazz chorus") || text.includes("room") || text.includes("compressor");
    case "metal":
      return text.includes("hi gain") || text.includes("metal") || text.includes("rectifier") || text.includes("mark iv") || text.includes("dist");
    case "blues":
      return text.includes("blues") || text.includes("tweed") || text.includes("tube screamer") || text.includes("od");
    case "ambient":
      return text.includes("delay") || text.includes("reverb") || text.includes("shimmer") || text.includes("freeze") || text.includes("chorus");
    case "bass":
      return text.includes("bass") || text.includes("ampeg") || text.includes("fretless") || text.includes("double bass");
    case "acoustic":
      return text.includes("acoustic") || text.includes("mandolin") || text.includes("jumbo") || text.includes("classical");
    case "experimental":
      return text.includes("bit") || text.includes("ring") || text.includes("freeze") || text.includes("hold") || text.includes("broken") || text.includes("pitch");
    case "lead":
      return text.includes("lead") || text.includes("solo") || text.includes("delay") || text.includes("sustain") || text.includes("drive");
    case "rhythm":
      return text.includes("rhythm") || text.includes("crunch") || text.includes("clean") || text.includes("boost") || text.includes("comp");
    default:
      return true;
  }
}
