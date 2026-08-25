import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OnlyChamps",
  description: "A subscription platform for online fitness coaches.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // Dark is the default theme — see docs/03-DESIGN-SYSTEM.md §2.
      // Ship the light theme, but always default to dark.
      className={`dark ${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      {/*
        suppressHydrationWarning is here for browser extensions, not for our
        own markup. Grammarly (and password managers, and translation
        extensions) inject attributes onto <body> — data-gr-ext-installed,
        data-new-gr-c-s-check-loaded — before React hydrates, so the DOM no
        longer matches the HTML the server sent and React logs a mismatch on
        every page load. The server output is clean; there is nothing to fix
        on our side, and no way to stop an extension writing to the document.

        This is narrower than it looks: the flag applies one level deep, to
        this element's own attributes and text only. Every child still gets
        the normal hydration check, so a genuine mismatch inside the app is
        still reported.
      */}
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
