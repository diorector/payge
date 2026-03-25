"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { determineReadingType } from "@/lib/analysis";
import Link from "next/link";

function DNACardContent() {
  const searchParams = useSearchParams();
  const instagramId = searchParams.get("id") ?? "";
  const answersStr = searchParams.get("answers") ?? "";
  const answers = answersStr.split(",").filter(Boolean);

  const result = useMemo(() => determineReadingType(answers), [answers]);

  if (!instagramId || answers.length === 0) {
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
      <Header instagramId={instagramId} status="분석 완료" />

      <div className="flex-1 flex flex-col items-center w-full max-w-md mt-4">
        {/* Match percentage */}
        <div className="animate-scale-in mb-6">
          <p className="text-xs text-[var(--muted)] text-center mb-1 tracking-widest uppercase">
            Reading DNA Match
          </p>
          <p className="text-5xl font-extrabold text-center text-[var(--foreground)]">
            {result.matchPercent}
            <span className="text-2xl">%</span>
          </p>
        </div>

        {/* DNA Card */}
        <div className="w-full bg-white rounded-2xl border-2 border-[var(--border)] overflow-hidden shadow-lg animate-fade-in-up mb-6">
          {/* Card header */}
          <div className="bg-[var(--foreground)] text-white px-6 py-4">
            <p className="text-xs opacity-60 mb-1">@{instagramId}의 독서 타입</p>
            <h2 className="text-xl font-bold">{result.type.name}</h2>
          </div>

          {/* Description */}
          <div className="px-6 py-5">
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              {result.type.description}
            </p>

            {/* Strengths & Blindspots */}
            <div className="flex gap-4 mb-5">
              <div className="flex-1">
                <p className="text-xs font-semibold text-[var(--accent-dark)] mb-1">
                  강점
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.type.strengths.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-[#F0FFB0] text-[var(--foreground)] px-2 py-0.5 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[var(--muted)] mb-1">
                  블라인드스팟
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.type.blindspots.map((b) => (
                    <span
                      key={b}
                      className="text-xs bg-gray-100 text-[var(--muted)] px-2 py-0.5 rounded-full"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--border)] mb-5" />

            {/* Book recommendation */}
            <p className="text-xs font-semibold text-[var(--accent-dark)] mb-3">
              지금 필요한 책 1권
            </p>
            <div className="flex gap-4">
              {/* Book cover placeholder */}
              <div className="w-20 h-28 bg-gradient-to-br from-[var(--accent)] to-[#8BC34A] rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-2xl font-bold text-white">
                  {result.book.title[0]}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-0.5">
                  {result.book.title}
                </h3>
                <p className="text-xs text-[var(--muted)] mb-2">
                  {result.book.author}
                </p>
                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                  {result.book.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Card footer */}
          <div className="px-6 py-3 bg-[#FAFAF5] border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">payge.kr</span>
            <span className="text-xs text-[var(--muted)]">
              PAYGE LAB
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="w-full space-y-3">
          {/* Share DNA card */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `나의 독서 DNA: ${result.type.name}`,
                  text: `나의 독서 타입은 "${result.type.name}"이래! 너도 해봐`,
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

          {/* Get more recommendations (paid) */}
          <Link
            href={`/report?id=${encodeURIComponent(instagramId)}&type=${result.type.id}`}
            className="block w-full py-4 bg-[var(--foreground)] text-white font-bold text-base rounded-xl text-center hover:opacity-90 active:scale-[0.98] transition-all"
          >
            4권 더 받기 + 독서 로드맵
          </Link>

          {/* Analyze friend */}
          <Link
            href="/"
            className="block w-full py-4 bg-white border-2 border-[var(--border)] text-[var(--foreground)] font-medium text-base rounded-xl text-center hover:border-[var(--accent)] active:scale-[0.98] transition-all"
          >
            친구 독서 DNA 분석해보기
          </Link>

          {/* Payge.kr link */}
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
