import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARKHÉON Airdrop — Discover early. Start safely.",
  description: "A Saudi-first Telegram Mini App for clear, carefully reviewed airdrop opportunities.",
  openGraph: {
    title: "ARKHÉON AIRDROP",
    description: "Discover early. Start safely.",
    type: "website",
    url: "https://arkheon-airdrop.andreydocabo366.chatgpt.site",
    images: [
      {
        url: "https://arkheon-airdrop.andreydocabo366.chatgpt.site/og.png",
        width: 1200,
        height: 630,
        alt: "ARKHÉON AIRDROP — Discover early. Start safely.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ARKHÉON AIRDROP",
    description: "Discover early. Start safely.",
    images: ["https://arkheon-airdrop.andreydocabo366.chatgpt.site/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html dir="rtl" lang="ar">
      <body>{children}</body>
    </html>
  );
}
