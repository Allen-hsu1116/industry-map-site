import type { Metadata } from "next";
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
        {children}
      </body>
    </html>
  );
}