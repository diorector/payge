"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BookshelfAnimation from "@/components/BookshelfAnimation";
import { useAnalysis } from "@/lib/analysis-context";

const SCANNING_STEPS = [
  { label: "피드 키워드 추출 중", duration: 2000 },
  { label: "관심사 클러스터링", duration: 1800 },
  { label: "감정 톤 분석", duration: 2200 },
  { label: "스트레스 요인 탐지", duration: 2000 },
  { label: "독서 DNA 벡터 생성", duration: 2400 },
];

function ScanningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instagramId = searchParams.get("id") ?? "";
  const { runPreAnalysis, preAnalysis, error } = useAnalysis();

  const [currentStep, setCurrentStep] = useState(0);
  const [filledBooks, setFilledBooks] = useState(0);
  const [apiDone, setApiDone] = useState(!!preAnalysis);
  const totalBooks = 10;

  // Start API call immediately
  useEffect(() => {
    if (!instagramId) {
      router.replace("/");
      return;
    }

    // Only call if we don't already have results
    if (!preAnalysis) {
      runPreAnalysis(instagramId).then((result) => {
        if (result) setApiDone(true);
      });
    }
  }, [instagramId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate scanning steps (runs regardless of API status)
  useEffect(() => {
    if (currentStep < SCANNING_STEPS.length) {
      const timer = setTimeout(() => {
        setFilledBooks((prev) => Math.min(prev + 2, 8)); // Fill to ~80%
        setCurrentStep((prev) => prev + 1);
      }, SCANNING_STEPS[currentStep].duration);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const goToQuestions = useCallback(() => {
    router.push(`/questions?id=${encodeURIComponent(instagramId)}`);
  }, [router, instagramId]);

  // When both animation and API are done, go to questions
  useEffect(() => {
    if (currentStep >= SCANNING_STEPS.length && apiDone) {
      const timer = setTimeout(goToQuestions, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, apiDone, goToQuestions]);

  const progress = Math.min(
    Math.round((currentStep / SCANNING_STEPS.length) * 82),
    82
  );

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-8 page-transition">
      <Header instagramId={instagramId} status="책장을 채우는 중 ···" />

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <BookshelfAnimation
          totalSlots={totalBooks}
          filledSlots={filledBooks}
          className="mb-8"
        />

        <div className="w-full mb-6">
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-xs text-[var(--muted)] mt-1">
            {progress}%
          </p>
        </div>

        <div className="w-full space-y-3">
          {SCANNING_STEPS.map((step, i) => (
            <div
              key={step.label}
              className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                i < currentStep
                  ? "text-[var(--foreground)]"
                  : i === currentStep
                  ? "text-[var(--foreground)] font-medium"
                  : "text-[var(--border)]"
              }`}
            >
              <span className="w-5 text-center">
                {i < currentStep ? (
                  <span className="text-[var(--accent)]">&#10003;</span>
                ) : i === currentStep ? (
                  <span className="animate-pulse-dot">&#9679;</span>
                ) : (
                  <span>&#9675;</span>
                )}
              </span>
              <span>{step.label}</span>
            </div>
          ))}
        </div>

        {currentStep >= SCANNING_STEPS.length && (
          <div className="mt-8 text-center animate-fade-in-up">
            {apiDone ? (
              <p className="text-base font-medium">
                책장을 완성하려면
                <br />
                몇 가지만 더 여쭤볼게요
              </p>
            ) : error ? (
              <div>
                <p className="text-base font-medium text-red-500 mb-2">
                  분석 중 오류가 발생했어요
                </p>
                <button
                  onClick={() => router.replace("/")}
                  className="text-sm text-[var(--accent)] underline"
                >
                  다시 시도하기
                </button>
              </div>
            ) : (
              <p className="text-base font-medium">
                AI가 분석을 마무리하고 있어요...
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ScanningPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[var(--muted)]">로딩 중...</p>
        </main>
      }
    >
      <ScanningContent />
    </Suspense>
  );
}
