import type { Metadata } from "next";
import localFont from "next/font/local";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Providers from "./providers";
import "./globals.css";

// Self-hosted fonts: the corporate TLS proxy blocks next/font/google's
// download of Google Fonts, so the font files are bundled in ./fonts.
const nunito = localFont({
  src: "./fonts/Nunito-variable.ttf",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: 'Oren',
  description: "Premium women's fashion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className={`${nunito.variable} ${geistMono.variable} antialiased font-sans`}>
        <Providers>
          <div className="min-h-screen bg-ivory">
            <Header />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
