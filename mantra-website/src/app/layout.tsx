import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mantra Novel - Read & Write Web Novels",
  description: "Discover captivating web novels from talented authors. Read for free, earn from your writing.",
  keywords: ["web novel", "light novel", "fiction", "stories", "reading", "writing"],
  authors: [{ name: "Mantra Novel" }],
  openGraph: {
    title: "Mantra Novel - Read & Write Web Novels",
    description: "Discover captivating web novels from talented authors.",
    url: "https://mantra.run.place",
    siteName: "Mantra Novel",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
