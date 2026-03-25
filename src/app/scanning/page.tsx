"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BookshelfAnimation from "@/components/BookshelfAnimation";
import { SCANNING_STEPS } from "@/lib/constants";

function ScanningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instagramId = searchParams.get("id") ?? "";

  const [currentStep, setCurrentStep] = useState(0);
  const [filledBooks, setFilledBooks] = useState(0);
  const totalBooks = 10;
  const booksPerStep = Math.floor(totalBooks / SCANNING_STEPS.length);

  const goToQuestions = useCallback(() => {
    router.push(`/questions?id=${encodeURIComponent(instagramId)}`);
  }, [router, instagramId]);

  useEffect(() => {
    if (!instagramId) {
      router.replace("/");
      return;
    }

    if (currentStep < SCANNING_STEPS.length) {
      const timer = setTimeout(() => {
        setFilledBooks((prev) =>
          Math.min(prev + booksPerStep, Math.floor(totalBooks * 0.82))
        );
        setCurrentStep((prev) => prev + 1);
      }, SCANNING_STEPS[currentStep].duration);
      return () => clearTimeout(timer);
    }
  }, [currentStep, instagramId, router, booksPerStep]);

  // When scanning reaches ~82%, pause and redirect to questions
  useEffect(() => {
    if (currentStep >= SCANNING_STEPS.length) {
      const timer = setTimeout(() => {
        goToQuestions();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, goToQuestions]);

  const progress = Math.min(
    Math.round((currentStep / SCANNING_STEPS.length) * 82),
    82
  );

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-8 page-transition">
      <Header
        instagramId={instagramId}
        status="책장을 채우는 중 ···"
      />

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {/* Bookshelf */}
        <BookshelfAnimation
          totalSlots={totalBooks}
          filledSlots={filledBooks}
          className="mb-8"
        />

        {/* Progress bar */}
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

        {/* Scanning steps */}
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

        {/* Pause message when at 82% */}
        {currentStep >= SCANNING_STEPS.length && (
          <div className="mt-8 text-center animate-fade-in-up">
            <p className="text-base font-medium">
              책장을 완성하려면
              <br />
              몇 가지만 더 여쭤볼게요
            </p>
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
