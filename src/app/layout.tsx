import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "꿀통노기",
  description: "마비노기 아이템 생산 효율 분석 웹사이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8">
            <Suspense fallback={
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 animate-pulse">
                <div className="h-8 bg-amber-200/50 rounded w-1/4 mb-6"></div>
                <div className="h-32 bg-amber-100/50 rounded mb-4"></div>
                <div className="h-32 bg-amber-100/50 rounded"></div>
              </div>
            }>
              {children}
            </Suspense>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
