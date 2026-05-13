import { notFound } from "next/navigation";
import { ValetonApp } from "@/components/ValetonApp";
import enContent from "@/data/en.json";
import esContent from "@/data/es.json";
import type { Locale, ValetonContent } from "@/types/content";

const locales = ["en", "es"] as const;

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

function isLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const contentByLocale: Record<Locale, ValetonContent> = {
    en: enContent as ValetonContent,
    es: esContent as ValetonContent,
  };

  return <ValetonApp content={contentByLocale[locale]} />;
}
