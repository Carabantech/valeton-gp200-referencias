import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valeton GP-200 Tone Reference",
  description: "Visual tone reference for the Valeton GP-200.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
