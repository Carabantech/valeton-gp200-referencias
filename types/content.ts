export type Locale = "en" | "es";

export type Tab = {
  id: string;
  label: string;
  icon?: string;
  iconText?: string;
};

export type Guide = {
  category: string;
  title: string;
  description: string;
  bodyHtml: string;
};

export type Effect = {
  name: string;
  className: string;
  image: string;
  descriptionHtml: string;
  paramsHtml: string;
  type: string;
  searchText: string;
};

export type ValetonContent = {
  locale: Locale;
  hero: {
    title: string;
    description: string;
    searchPlaceholder: string;
    image: string;
    languageHref: string;
    languageLabel: string;
  };
  tabs: Tab[];
  guides: Guide[];
  sections: Record<string, Effect[]>;
  footer: string;
};
