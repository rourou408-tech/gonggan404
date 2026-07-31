import type { Metadata } from "next";
import "./globals.css";
import "./blog.css";
import Aurora from "./components/Aurora";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: "Sankou Lee | AI 创意导演",
  description: "Sankou Lee 的品牌设计、AI 视觉实验、创意思考与提示词档案。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Sankou Lee | AI 创意导演",
    description: "人类直觉与 AI 协作之间的新视觉语言。",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><Aurora colorStops={["#94a3b8","#a0a0a0","#ffffff"]} blend={.63} amplitude={1} speed={1.4} />{children}</body></html>;
}
