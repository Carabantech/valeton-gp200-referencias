"use client";

import { useMemo, useState } from "react";
import type { Effect, Guide, Tab, ValetonContent } from "@/types/content";

type ValetonAppProps = {
  content: ValetonContent;
};

const defaultTab = "pre";

export function ValetonApp({ content }: ValetonAppProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;

  const filteredSections = useMemo(() => {
    return Object.fromEntries(
      Object.entries(content.sections).map(([sectionId, effects]) => [
        sectionId,
        effects.filter((effect) => effect.searchText.toLowerCase().includes(normalizedSearch)),
      ]),
    );
  }, [content.sections, normalizedSearch]);

  return (
    <div className="container">
      <Hero content={content} searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />

      <Tabs
        tabs={content.tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setSearchTerm("");
        }}
      />

      <GuideSection active={!isSearching && activeTab === "view"} guides={content.guides} />

      {content.tabs
        .filter((tab) => tab.id !== "view")
        .map((tab) => {
          const effects = isSearching ? filteredSections[tab.id] ?? [] : content.sections[tab.id] ?? [];
          const active = isSearching ? effects.length > 0 : activeTab === tab.id;

          return (
            <EffectSection
              key={tab.id}
              id={tab.id}
              active={active}
              effects={effects}
              locale={content.locale}
            />
          );
        })}

      <div className="footer" dangerouslySetInnerHTML={{ __html: content.footer }} />
    </div>
  );
}

function Hero({
  content,
  searchTerm,
  onSearchTermChange,
}: {
  content: ValetonContent;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}) {
  return (
    <div className="hero">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <a
          href={content.hero.languageHref}
          style={{
            padding: "8px 16px",
            background: "rgba(96,165,250,0.25)",
            border: "1px solid rgba(96,165,250,0.45)",
            borderRadius: 8,
            color: "#38bdf8",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
          dangerouslySetInnerHTML={{ __html: content.hero.languageLabel }}
        />
      </div>

      <div className="hero-top">
        <h1>{content.hero.title}</h1>
        <img src={content.hero.image} className="hero-unit" alt="Valeton GP-200" />
      </div>

      <p>{content.hero.description}</p>

      <input
        type="text"
        className="search"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder={content.hero.searchPlaceholder}
      />
    </div>
  );
}

function Tabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Tab[];
  activeTab: string;
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
            <span style={{ fontSize: "1.3rem" }} dangerouslySetInnerHTML={{ __html: tab.iconText ?? "" }} />
          )}
          <span dangerouslySetInnerHTML={{ __html: tab.label }} />
        </button>
      ))}
    </div>
  );
}

function GuideSection({ active, guides }: { active: boolean; guides: Guide[] }) {
  return (
    <section className={`section${active ? " active" : ""}`} id="view">
      {guides.map((guide) => (
        <article className="card" key={guide.title}>
          <div className="category" dangerouslySetInnerHTML={{ __html: guide.category }} />
          <h3 dangerouslySetInnerHTML={{ __html: guide.title }} />
          <p className="description" dangerouslySetInnerHTML={{ __html: guide.description }} />
          <div
            style={{
              marginTop: 16,
              color: "#cbd5e1",
              fontSize: "0.97rem",
              lineHeight: 1.7,
            }}
            dangerouslySetInnerHTML={{ __html: guide.bodyHtml }}
          />
        </article>
      ))}
    </section>
  );
}

function EffectSection({
  id,
  active,
  effects,
  locale,
}: {
  id: string;
  active: boolean;
  effects: Effect[];
  locale: ValetonContent["locale"];
}) {
  return (
    <section className={`section${active ? " active" : ""}`} id={id}>
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

  return (
    <article className={effect.className} aria-label={effect.name}>
      <div className="fx-card-media">
        <img src={effect.image} className="fx-bg" alt="" aria-hidden="true" />
      </div>

      <div className="fx-card-body">
        <div className="fx-card-header">
          <h3 className="fx-title">{effect.name}</h3>
          <div className="fx-single-tag">{effect.type}</div>
        </div>

        <div className="fx-content-grid">
          <section className="fx-text-panel">
            <h4>{isSpanish ? "Descripción" : "Description"}</h4>
            <div className="fx-description" dangerouslySetInnerHTML={{ __html: effect.descriptionHtml }} />
          </section>

          <section className="fx-text-panel">
            <h4>{isSpanish ? "Parámetros" : "Parameters"}</h4>
            <div className="fx-params" dangerouslySetInnerHTML={{ __html: effect.paramsHtml }} />
          </section>
        </div>
      </div>
    </article>
  );
}
