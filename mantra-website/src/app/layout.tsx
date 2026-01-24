import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { headers } from 'next/headers';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if we're on a chapter reading route - hide global header/footer for immersive reading
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('referer') || '';
  const isReaderRoute = pathname.includes('/chapter/');

  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        {!isReaderRoute && <Header />}
        <main className={`flex-1 ${!isReaderRoute ? 'pb-16 md:pb-0' : ''}`}>
          {children}
        </main>
        {!isReaderRoute && <BottomNav />}
        {!isReaderRoute && <Footer />}
      </body>
    </html>
  );
}
