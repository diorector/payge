"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAnalysis } from "@/lib/analysis-context";
import { DNA_DIMENSIONS, type ReadingDNA } from "@/lib/types";
import Link from "next/link";

function DNACardContent() {
  const searchParams = useSearchParams();
  const instagramId = searchParams.get("id") ?? "";
  const { preAnalysis, fullAnalysis, isLoading } = useAnalysis();

  if (!instagramId) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Link href="/" className="text-[var(--accent)] underline">
          처음부터 시작하기
        </Link>
      </main>
    );
  }

  // Use fullAnalysis if available, otherwise preAnalysis
  const analysis = fullAnalysis ?? preAnalysis;

  if (isLoading || !analysis) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-5">
        <Header instagramId={instagramId} status="분석 중..." />
        <div className="animate-pulse-dot text-lg mt-8">
          AI가 당신의 독서 DNA를 분석하고 있어요...
        </div>
      </main>
    );
  }

  const matchPercent = fullAnalysis?.matchPercent ?? "91.3";
  const typeName =
    fullAnalysis?.readingTypeName ?? deriveTypeName(analysis.readingDNA);
  const typeDescription =
    fullAnalysis?.readingTypeDescription ??
    "인스타그램 분석을 기반으로 당신에게 딱 맞는 독서 DNA를 찾았어요.";
  // instantBook from preAnalysis is always available (free 1 book)
  const mainBook = analysis.instantBook ?? fullAnalysis?.bookRecommendations?.[0] ?? null;

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-8 page-transition">
      <Header instagramId={instagramId} status="분석 완료" />

      <div className="flex-1 flex flex-col items-center w-full max-w-md mt-4">
        {/* Match percentage */}
        <div className="animate-scale-in mb-6">
          <p className="text-xs text-[var(--muted)] text-center mb-1 tracking-widest uppercase">
            Reading DNA Match
          </p>
          <p className="text-5xl font-extrabold text-center text-[var(--foreground)]">
            {matchPercent}
            <span className="text-2xl">%</span>
          </p>
        </div>

        {/* DNA Card */}
        <div className="w-full bg-white rounded-2xl border-2 border-[var(--border)] overflow-hidden shadow-lg animate-fade-in-up mb-6">
          {/* Card header */}
          <div className="bg-[var(--foreground)] text-white px-6 py-4">
            <p className="text-xs opacity-60 mb-1">
              @{instagramId}의 독서 타입
            </p>
            <h2 className="text-xl font-bold">{typeName}</h2>
          </div>

          {/* Description */}
          <div className="px-6 py-5">
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              {typeDescription}
            </p>

            {/* DNA 5-Dimension Chart */}
            <div className="space-y-3 mb-5">
              {(
                Object.entries(DNA_DIMENSIONS) as [
                  keyof typeof DNA_DIMENSIONS,
                  (typeof DNA_DIMENSIONS)[keyof typeof DNA_DIMENSIONS],
                ][]
              ).map(([key, dim]) => {
                const score =
                  analysis.readingDNA[
                    key as keyof typeof analysis.readingDNA
                  ]?.score ?? 0.5;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm w-20 flex-shrink-0">
                      {dim.icon} {dim.name}
                    </span>
                    <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--muted)] w-8 text-right">
                      {Math.round(score * 100)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Evidence snippets */}
            {analysis.readingDNA.intellectualCuriosity?.evidence && (
              <div className="bg-[#FAFAF5] rounded-lg p-3 mb-5">
                <p className="text-xs text-[var(--muted)] mb-1">
                  AI가 인스타에서 찾은 단서
                </p>
                <p className="text-sm leading-relaxed">
                  &ldquo;
                  {analysis.readingDNA.intellectualCuriosity.evidence}
                  &rdquo;
                </p>
              </div>
            )}

            <div className="h-px bg-[var(--border)] mb-5" />

            {/* Book recommendation */}
            <p className="text-xs font-semibold text-[var(--accent-dark)] mb-3">
              지금 필요한 책 1권
            </p>
            {mainBook ? (
              <div className="flex gap-4">
                <div className="w-20 h-28 bg-gradient-to-br from-[var(--accent)] to-[#8BC34A] rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-2xl font-bold text-white">
                    {mainBook.title[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base mb-0.5">
                    {mainBook.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mb-2">
                    {mainBook.author}
                  </p>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed">
                    {mainBook.reason}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="w-20 h-28 bg-gradient-to-br from-[var(--accent)] to-[#8BC34A] rounded-lg flex items-center justify-center flex-shrink-0 shadow-md animate-pulse">
                  <span className="text-sm text-white">...</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--muted)]">
                    AI가 추천 도서를 선정하고 있어요...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card footer */}
          <div className="px-6 py-3 bg-[#FAFAF5] border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">payge.kr</span>
            <span className="text-xs text-[var(--muted)]">PAYGE LAB</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `나의 독서 DNA: ${typeName}`,
                  text: `나의 독서 타입은 "${typeName}"이래! 너도 해봐`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("링크가 복사되었어요!");
              }
            }}
            className="w-full py-4 bg-[var(--accent)] text-[var(--foreground)] font-bold text-base rounded-xl hover:bg-[var(--accent-dark)] active:scale-[0.98] transition-all"
          >
            나의 독서 DNA 공유하기
          </button>

          <Link
            href={`/report?id=${encodeURIComponent(instagramId)}`}
            className="block w-full py-4 bg-[var(--foreground)] text-white font-bold text-base rounded-xl text-center hover:opacity-90 active:scale-[0.98] transition-all"
          >
            4권 더 받기 + 독서 로드맵
          </Link>

          <Link
            href="/"
            className="block w-full py-4 bg-white border-2 border-[var(--border)] text-[var(--foreground)] font-medium text-base rounded-xl text-center hover:border-[var(--accent)] active:scale-[0.98] transition-all"
          >
            친구 독서 DNA 분석해보기
          </Link>

          <a
            href="https://payge.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-[var(--muted)] mt-2 hover:text-[var(--foreground)] transition-colors"
          >
            페이지랩에서 이 책 보기 &rarr;
          </a>
        </div>
      </div>
    </main>
  );
}

function deriveTypeName(dna: ReadingDNA): string {
  const entries = Object.entries(dna) as [string, { score: number }][];
  if (entries.length === 0) return "독서 탐험가";

  const sorted = entries.sort((a, b) => b[1].score - a[1].score);
  const topDim = sorted[0][0];

  const typeNames: Record<string, string> = {
    intellectualCuriosity: "현실을 바꾸는 지적 탐험가",
    emotionalEmpathy: "감성을 채우는 스토리텔러",
    executionDrive: "배움을 실행하는 액션 리더",
    introspectionDepth: "마음을 돌보는 내면 탐색가",
    creativeIntegration: "영감을 수집하는 크리에이터",
  };

  return typeNames[topDim] ?? "독서 탐험가";
}

export default function MyReadingDNAPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[var(--muted)]">분석 결과를 불러오는 중...</p>
        </main>
      }
    >
      <DNACardContent />
    </Suspense>
  );
}
