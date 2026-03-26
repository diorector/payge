import type { Metadata } from "next";
import { AnalysisProvider } from "@/lib/analysis-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAYGE LAB | 인스타 분석 독서 큐레이션",
  description:
    "당신의 인스타를 읽은 AI가, 지금 당신에게 필요한 책 1권을 찾아드립니다.",
  openGraph: {
    title: "PAYGE LAB | 인스타 분석 독서 큐레이션",
    description:
      "당신의 인스타를 읽은 AI가, 지금 당신에게 필요한 책 1권을 찾아드립니다.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AnalysisProvider>{children}</AnalysisProvider>
      </body>
    </html>
  );
}
