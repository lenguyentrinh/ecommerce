import type { Metadata } from "next";
import { Geist_Mono, Nunito } from "next/font/google";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Providers from "./providers";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["400", "500", "700"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FE Ecommerce",
  description: "Online food and grocery shopping",
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
          <div className="min-h-screen bg-slate-50">
            <Header />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
