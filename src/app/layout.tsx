import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "台股產業鏈知識圖譜 | Industry Map",
  description: "82 個題材 × 505 家公司 — 台股最完整的產業鏈知識圖譜",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full" /></div>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}