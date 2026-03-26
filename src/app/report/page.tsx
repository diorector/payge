"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAnalysis } from "@/lib/analysis-context";
import { DNA_DIMENSIONS } from "@/lib/types";
import Link from "next/link";

function ReportContent() {
  const searchParams = useSearchParams();
  const instagramId = searchParams.get("id") ?? "";
  const { fullAnalysis, preAnalysis } = useAnalysis();

  const analysis = fullAnalysis;
  const dna = analysis?.readingDNA ?? preAnalysis?.readingDNA;

  if (!instagramId) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Link href="/" className="text-[var(--accent)] underline">
          처음부터 시작하기
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-8 page-transition">
      <Header instagramId={instagramId} status="상세 리포트" />

      <div className="w-full max-w-md mt-4 space-y-8">
        {/* Paywall banner */}
        <div className="bg-gradient-to-r from-[var(--foreground)] to-[#333] rounded-2xl p-6 text-white text-center">
          <p className="text-sm opacity-70 mb-1">상세 독서 리포트</p>
          <p className="text-3xl font-extrabold mb-2">
            3,900<span className="text-base font-normal">원</span>
          </p>
          <p className="text-xs opacity-60 mb-4">
            AI 추천 5권 + 독서 로드맵 + 유명인 비교 + 책장 카드
          </p>
          <button className="w-full py-3 bg-[var(--accent)] text-[var(--foreground)] font-bold rounded-xl hover:bg-[var(--accent-dark)] active:scale-[0.98] transition-all">
            결제하고 전체 리포트 열기
          </button>
        </div>

        {/* Section 01 - Reading DNA Detail */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold bg-[var(--accent)] px-2 py-0.5 rounded">
              01
            </span>
            <h3 className="font-bold">나의 독서 성격 상세</h3>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5">
            <h4 className="text-lg font-bold mb-2">
              {analysis?.readingTypeName ?? "독서 탐험가"}
            </h4>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              {analysis?.readingTypeDescription ??
                "AI 분석 결과를 기반으로 한 당신의 독서 성격입니다."}
            </p>

            {/* DNA Bars */}
            {dna && (
              <div className="space-y-2 mb-4">
                {(
                  Object.entries(DNA_DIMENSIONS) as [
                    keyof typeof DNA_DIMENSIONS,
                    (typeof DNA_DIMENSIONS)[keyof typeof DNA_DIMENSIONS],
                  ][]
                ).map(([key, dim]) => {
                  const score =
                    dna[key as keyof typeof dna]?.score ?? 0.5;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs w-16 flex-shrink-0">
                        {dim.icon} {dim.name}
                      </span>
                      <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full"
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Persona layers (free preview) */}
            {analysis?.personaLayers && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--accent-dark)] mb-1">
                    독서 스타일
                  </p>
                  <p className="text-sm">
                    {analysis.personaLayers.behavioral.readingStyle}
                  </p>
                </div>
                {analysis.personaLayers.deep.avoidTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)] mb-1">
                      이런 책은 피하세요
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.personaLayers.deep.avoidTopics.map((t) => (
                        <span
                          key={t}
                          className="text-xs bg-red-50 text-red-400 px-2 py-0.5 rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section 02 - Book Recommendations */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold bg-[var(--accent)] px-2 py-0.5 rounded">
              02
            </span>
            <h3 className="font-bold">AI 추천 책 5권</h3>
          </div>

          {/* First book (free - from instantBook) */}
          {(preAnalysis?.instantBook ?? analysis?.bookRecommendations?.[0]) && (() => {
            const freeBook = preAnalysis?.instantBook ?? analysis?.bookRecommendations?.[0];
            if (!freeBook) return null;
            return (
              <div className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-[var(--accent)] text-[var(--foreground)] font-bold px-2 py-0.5 rounded">무료</span>
                  <span className="text-xs text-[var(--muted)]">지금 필요한 책 1권</span>
                </div>
                <div className="flex gap-4">
                  <div className="w-16 h-22 bg-gradient-to-br from-[var(--accent)] to-[#8BC34A] rounded-lg flex items-center justify-center flex-shrink-0 shadow">
                    <span className="text-xl font-bold text-white">
                      {freeBook.title[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold">{freeBook.title}</h4>
                    <p className="text-xs text-[var(--muted)]">{freeBook.author}</p>
                    <p className="text-sm mt-1 leading-relaxed">{freeBook.reason}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Remaining 4 books (locked) */}
          {(analysis?.bookRecommendations ?? [
            { title: "추천 도서 2", author: "저자", reason: "개인화된 추천 사유가 여기에 표시됩니다." },
            { title: "추천 도서 3", author: "저자", reason: "개인화된 추천 사유가 여기에 표시됩니다." },
            { title: "추천 도서 4", author: "저자", reason: "개인화된 추천 사유가 여기에 표시됩니다." },
            { title: "추천 도서 5", author: "저자", reason: "개인화된 추천 사유가 여기에 표시됩니다." },
          ]).map((book, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-3 relative overflow-hidden"
            >
              <div className="flex gap-4 blur-sm select-none">
                <div className="w-16 h-22 bg-gray-200 rounded-lg flex-shrink-0" />
                <div>
                  <h4 className="font-bold">{book.title}</h4>
                  <p className="text-xs text-[var(--muted)]">{book.author}</p>
                  <p className="text-sm mt-1 leading-relaxed">{book.reason}</p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <span className="text-sm font-medium text-[var(--muted)]">
                  결제 후 열람 가능
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Section 03 - Reading Roadmap (locked) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold bg-[var(--accent)] px-2 py-0.5 rounded">
              03
            </span>
            <h3 className="font-bold">나의 독서 로드맵</h3>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 relative overflow-hidden">
            <div className="blur-sm select-none space-y-4">
              {[
                {
                  label: "지금",
                  theme: analysis?.readingRoadmap?.now?.theme ?? "시야 확장 단계",
                  desc: "새로운 관점을 열어줄 기초 도서 2권",
                },
                {
                  label: "3M",
                  theme: analysis?.readingRoadmap?.threeMonths?.theme ?? "깊이 파고들기 단계",
                  desc: "핵심 분야 전문 도서 2권",
                },
                {
                  label: "1Y",
                  theme: analysis?.readingRoadmap?.oneYear?.theme ?? "통합 성장 단계",
                  desc: "인사이트를 연결하는 종합 도서 1권",
                },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0
                        ? "bg-[var(--accent)]"
                        : "bg-[var(--border)]"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div>
                    <p className="font-medium">{step.theme}</p>
                    <p className="text-xs text-[var(--muted)]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <span className="text-sm font-medium text-[var(--muted)]">
                결제 후 열람 가능
              </span>
            </div>
          </div>
        </section>

        {/* Section 04 - Famous matches (locked) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold bg-[var(--accent)] px-2 py-0.5 rounded">
              04
            </span>
            <h3 className="font-bold">비슷한 취향의 유명인</h3>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 relative overflow-hidden">
            <div className="blur-sm select-none">
              <p className="text-sm mb-3">당신과 비슷한 독서 DNA:</p>
              <div className="flex gap-3">
                {(analysis?.famousMatch ?? [
                  { name: "유명인 1" },
                  { name: "유명인 2" },
                  { name: "유명인 3" },
                ]).map((match) => (
                  <div key={match.name} className="text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-200 mx-auto mb-1" />
                    <p className="text-xs font-medium">{match.name}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <span className="text-sm font-medium text-[var(--muted)]">
                결제 후 열람 가능
              </span>
            </div>
          </div>
        </section>

        {/* Section 05 - Bookshelf card (locked) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold bg-[var(--accent)] px-2 py-0.5 rounded">
              05
            </span>
            <h3 className="font-bold">나만의 책장 카드</h3>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 relative overflow-hidden">
            <div className="blur-sm select-none">
              <div className="flex items-end gap-2 h-32 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-14 rounded-t-sm bg-gradient-to-b from-[var(--accent)] to-[#8BC34A]"
                    style={{ height: `${50 + i * 10}%` }}
                  />
                ))}
              </div>
              <p className="text-center text-sm mt-3">
                인스타 스토리용 책장 카드
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <span className="text-sm font-medium text-[var(--muted)]">
                결제 후 열람 가능
              </span>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="space-y-3 pb-8">
          <button className="w-full py-4 bg-[var(--accent)] text-[var(--foreground)] font-bold text-base rounded-xl hover:bg-[var(--accent-dark)] active:scale-[0.98] transition-all">
            3,900원으로 전체 리포트 열기
          </button>
          <Link
            href="/"
            className="block w-full py-4 bg-white border-2 border-[var(--border)] text-[var(--foreground)] font-medium text-base rounded-xl text-center hover:border-[var(--accent)] active:scale-[0.98] transition-all"
          >
            친구의 독서 DNA도 분석해보기
          </Link>
          <a
            href="https://payge.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-[var(--muted)] mt-2 hover:text-[var(--foreground)] transition-colors"
          >
            페이지랩에서 추천 책 모아보기 &rarr;
          </a>
        </div>
      </div>
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[var(--muted)]">리포트를 불러오는 중...</p>
        </main>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
