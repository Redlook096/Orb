import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orb — Viral video studio",
  description: "Create Reddit stories, fake texts, split-screen and quiz videos with AI voices and animated captions.",
};

export const viewport: Viewport = { themeColor: "#07070b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
