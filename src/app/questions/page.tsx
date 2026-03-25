"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { QUESTIONS_TEMPLATES } from "@/lib/constants";

function QuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instagramId = searchParams.get("id") ?? "";

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const question = QUESTIONS_TEMPLATES[currentQ];

  const handleSelect = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS_TEMPLATES.length - 1) {
      setTimeout(() => setCurrentQ((prev) => prev + 1), 300);
    } else {
      // All questions answered, navigate to DNA card
      const params = new URLSearchParams({
        id: instagramId,
        answers: newAnswers.join(","),
      });
      setTimeout(() => {
        router.push(`/my-reading-dna?${params.toString()}`);
      }, 500);
    }
  };

  if (!instagramId) {
    router.replace("/");
    return null;
  }

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-8 page-transition">
      <Header instagramId={instagramId} status="책장 튜닝 중" />

      {/* Progress dots */}
      <div className="flex gap-2 mt-4 mb-12">
        {QUESTIONS_TEMPLATES.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i < currentQ
                ? "bg-[var(--accent)]"
                : i === currentQ
                ? "bg-[var(--foreground)]"
                : "bg-[var(--border)]"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {/* Question number */}
        <p className="text-xs text-[var(--muted)] mb-2">
          Q{currentQ + 1} / {QUESTIONS_TEMPLATES.length}
        </p>

        {/* Question text */}
        <div key={currentQ} className="animate-fade-in-up text-center mb-10">
          <h2 className="text-xl font-bold leading-relaxed">
            {question.template}
          </h2>
        </div>

        {/* Options */}
        <div className="w-full space-y-3">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full py-4 px-6 bg-white border-2 border-[var(--border)] rounded-xl text-left text-base font-medium hover:border-[var(--accent)] hover:bg-[#F5FFD0] active:scale-[0.98] transition-all"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[var(--muted)]">로딩 중...</p>
        </main>
      }
    >
      <QuestionsContent />
    </Suspense>
  );
}
