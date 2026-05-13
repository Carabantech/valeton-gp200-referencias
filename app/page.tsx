import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const languageHeader = (await headers()).get("accept-language") ?? "";
  const preferredLanguage = languageHeader.split(",")[0]?.trim().toLowerCase() ?? "";
  const locale = preferredLanguage.startsWith("es") ? "es" : "en";

  redirect(`/${locale}`);
}
