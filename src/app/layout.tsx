import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "コトツナ | 身近な出来事とニュースをつなぐ",
  description:
    "高校生が日常で感じた出来事を、朝日新聞デジタルの記事とAIによる年表・因果関係の解説でつなぎ、社会・政治への関心につなげるサービス",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
