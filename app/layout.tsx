import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Gennetex бүртгэл",
  description: "Gennetex-ийн ажилтан, гишүүдийн нэгдсэн бүртгэл",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
