"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAnalysis } from "@/lib/analysis-context";

// Fallback questions with urgency prefixes (Zeigarnik effect)
const FALLBACK_QUESTIONS = [
  {
    trait: "IC" as const,
    prefix: "이 패턴만 직접 확인이 필요해요",
    question: "혼자만의 시간에 주로 뭘 하세요?",
    options: ["새로운 거 배우기", "생각 정리", "그냥 쉬기"],
    scores: [0.85, 0.5, 0.2],
  },
  {
    trait: "EE" as const,
    prefix: "분석 데이터가 살짝 갈려요",
    question: "누군가 힘들다고 하면 먼저 드는 생각은?",
    options: ["마음이 같이 아파요", "어떻게 도와줄지 생각해요", "일단 들어줘요"],
    scores: [0.85, 0.5, 0.2],
  },
  {
    trait: "ED" as const,
    prefix: "추천 정밀도를 높일 수 있어요",
    question: "새해 목표를 세우면 보통 어떻게 되나요?",
    options: ["체계적으로 실행", "시작은 하는데 흐지부지", "목표 안 세움"],
    scores: [0.85, 0.5, 0.2],
  },
  {
    trait: "ID" as const,
    prefix: "거의 다 읽었어요, 이것만 알려주세요",
    question: "밤에 잠이 안 올 때 뭘 해요?",
    options: ["이런저런 생각에 빠져요", "영상이나 SNS 봐요", "그냥 바로 자요"],
    scores: [0.85, 0.5, 0.2],
  },
  {
    trait: "CI" as const,
    prefix: "이것만 대답하면 책이 나와요",
    question: "관심 분야가 여러 개인 편인가요?",
    options: ["네, 다양하게 넘나들어요", "한 분야에 깊게 파요", "때에 따라 달라요"],
    scores: [0.85, 0.5, 0.2],
  },
];

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
  const [selected, setSelected] = useState<number | null>(null);

  const hasPersonalized = (preAnalysis?.personalizedQuestions?.length ?? 0) > 0;
  const questions = hasPersonalized
    ? preAnalysis!.personalizedQuestions
    : FALLBACK_QUESTIONS;

  const question = questions[currentQ];
  // Prefix: from AI question or from fallback
  const prefix = hasPersonalized
    ? (currentQ === 0
        ? "인스타를 읽었어요, 확인만 할게요"
        : currentQ === questions.length - 1
          ? "마지막! 이것만 대답하면 끝"
          : undefined)
    : (question as typeof FALLBACK_QUESTIONS[number]).prefix;

  const handleSelect = async (optionIndex: number) => {
    setSelected(optionIndex);
    const newAnswers = [...localAnswers, optionIndex];
    setLocalAnswers(newAnswers);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ((prev) => prev + 1);
        setSelected(null);
      } else {
        // All questions answered
        setAnswers(newAnswers);
        runFullAnalysis();
        router.push(`/my-reading-dna?id=${encodeURIComponent(instagramId)}`);
      }
    }, 350);
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
        {/* Urgency prefix */}
        {prefix && (
          <p className="text-xs text-[var(--accent-dark)] mb-3 text-center tracking-wide">
            {prefix}
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
              className={`w-full py-4 px-6 border-2 rounded-xl text-left text-base font-medium active:scale-[0.98] transition-all ${
                selected === i
                  ? "bg-[#F5FFD0] border-[var(--accent)]"
                  : "bg-white border-[var(--border)] hover:border-[var(--accent)] hover:bg-[#F5FFD0]"
              }`}
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
