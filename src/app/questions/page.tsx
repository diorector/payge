"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAnalysis } from "@/lib/analysis-context";

function QuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instagramId = searchParams.get("id") ?? "";
  const {
    preAnalysis,
    setAnswers,
    runFullAnalysis,
  } = useAnalysis();

  const [currentQ, setCurrentQ] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<number[]>([]);

  // Use AI-generated personalized questions if available, fallback to defaults
  const questions = preAnalysis?.personalizedQuestions ?? [
    {
      trait: "IC" as const,
      question: "혼자만의 시간에 주로 뭘 하세요?",
      options: ["새로운 거 배우기", "생각 정리", "그냥 멍때리기"],
      scores: [0.8, 0.5, 0.2],
    },
    {
      trait: "EE" as const,
      question: "여행에서 가장 기억에 남는 건?",
      options: ["현지인 대화", "예상 못한 발견", "그 나라 음식"],
      scores: [0.8, 0.5, 0.2],
    },
    {
      trait: "ED" as const,
      question: "새해 목표를 세우면 보통 어떻게 되나요?",
      options: ["체계적으로 실행", "시작은 하는데 흐지부지", "목표 안 세움"],
      scores: [0.8, 0.5, 0.2],
    },
    {
      trait: "ID" as const,
      question: "힘들 때 충전하는 방법은?",
      options: ["혼자 조용히", "사람들 만나기", "몸 움직이기"],
      scores: [0.8, 0.5, 0.2],
    },
    {
      trait: "CI" as const,
      question: "관심 분야가 여러 개인 편인가요?",
      options: ["네, 다양하게", "한 분야에 집중", "때에 따라 다름"],
      scores: [0.8, 0.5, 0.2],
    },
  ];

  const question = questions[currentQ];

  const handleSelect = async (optionIndex: number) => {
    const newAnswers = [...localAnswers, optionIndex];
    setLocalAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ((prev) => prev + 1), 300);
    } else {
      // All questions answered
      setAnswers(newAnswers);
      // Trigger full analysis
      runFullAnalysis();
      // Navigate to DNA card
      setTimeout(() => {
        router.push(`/my-reading-dna?id=${encodeURIComponent(instagramId)}`);
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
        {questions.map((_, i) => (
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
        {/* Personalization hint */}
        {preAnalysis && (
          <p className="text-xs text-[var(--accent-dark)] mb-3 text-center">
            인스타 분석 기반 맞춤 질문
          </p>
        )}

        <p className="text-xs text-[var(--muted)] mb-2">
          Q{currentQ + 1} / {questions.length}
        </p>

        <div key={currentQ} className="animate-fade-in-up text-center mb-10">
          <h2 className="text-xl font-bold leading-relaxed">
            {question.question}
          </h2>
        </div>

        <div className="w-full space-y-3">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className="w-full py-4 px-6 bg-white border-2 border-[var(--border)] rounded-xl text-left text-base font-medium hover:border-[var(--accent)] hover:bg-[#F5FFD0] active:scale-[0.98] transition-all"
            >
              {option}
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
