"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/lib/analysis-context";

const ROTATING_WORDS = ["찾아", "골라", "처방해"];

// Dynamic deadline: always 2 days from now at midnight KST
function getDeadline(): Date {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  kst.setDate(kst.getDate() + 2);
  kst.setHours(0, 0, 0, 0);
  return kst;
}

function useCountdown() {
  const deadline = useMemo(() => getDeadline(), []);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calc() {
      const now = new Date();
      const kstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
      const diff = Math.max(0, deadline.getTime() - kstNow.getTime());
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return timeLeft;
}

export default function LandingPage() {
  const router = useRouter();
  const { isLoading, error } = useAnalysis();
  const [inputId, setInputId] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [todayCount, setTodayCount] = useState(2341);
  const countdown = useCountdown();

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTodayCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputId.trim() || isLoading) return;
    const cleanId = inputId.replace("@", "").trim();

    // Navigate to scanning immediately, API call happens there
    router.push(`/scanning?id=${encodeURIComponent(cleanId)}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-5 py-12 page-transition">
      <div className="mb-10">
        <h2 className="text-sm font-semibold tracking-widest text-[var(--muted)] uppercase">
          Payge Lab
        </h2>
      </div>

      <div className="text-center max-w-lg mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-4">
          당신의 인스타를 읽은 AI가,
          <br />
          지금 당신에게 필요한 책 1권을
          <br />
          <span className="relative inline-block">
            <span
              key={wordIndex}
              className="text-[var(--foreground)] border-b-3 border-[var(--accent)] animate-fade-in-up"
            >
              {ROTATING_WORDS[wordIndex]}
            </span>
          </span>{" "}
          드립니다.
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm mb-8">
        <div className="flex items-center bg-white border-2 border-[var(--border)] rounded-xl overflow-hidden focus-within:border-[var(--accent)] transition-colors">
          <span className="pl-4 text-[var(--muted)] text-lg">@</span>
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="인스타그램 ID"
            className="flex-1 px-2 py-4 text-lg bg-transparent outline-none placeholder:text-[var(--border)]"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputId.trim()}
          className="w-full mt-3 py-4 bg-[var(--accent)] text-[var(--foreground)] font-bold text-lg rounded-xl hover:bg-[var(--accent-dark)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "분석 중..." : "내 책 찾으러 가기"}
        </button>
        {error && (
          <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
        )}
      </form>

      <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-6">
        <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse-dot" />
        <span>
          오늘{" "}
          <strong className="text-[var(--foreground)]">
            {todayCount.toLocaleString()}명
          </strong>
          이 책을 찾았어요
        </span>
      </div>

      <div className="w-full max-w-sm space-y-3 mb-8">
        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">
            &ldquo;요즘 뭔가 답답한 느낌이었죠?&rdquo;
          </p>
        </div>
        <div className="bg-[var(--accent)] rounded-2xl rounded-tr-sm px-4 py-3 ml-8">
          <p className="text-sm font-medium">
            &ldquo;이 책 읽어봐. 나를 위해 쓴 것 같았어&rdquo;
          </p>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] text-center max-w-xs mb-8">
        공개 프로필만 분석 · 비밀번호 불필요 · 분석 후 데이터 삭제
      </p>

      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-[var(--muted)]">무료 분석 마감까지</span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2 font-mono text-lg font-bold tabular-nums">
          <span className="bg-[var(--accent)] text-[var(--foreground)] px-2 py-1 rounded-md min-w-[2.5rem] text-center">
            {String(countdown.hours).padStart(2, "0")}
          </span>
          <span className="text-[var(--muted)]">:</span>
          <span className="bg-[var(--accent)] text-[var(--foreground)] px-2 py-1 rounded-md min-w-[2.5rem] text-center">
            {String(countdown.minutes).padStart(2, "0")}
          </span>
          <span className="text-[var(--muted)]">:</span>
          <span className="bg-[var(--accent)] text-[var(--foreground)] px-2 py-1 rounded-md min-w-[2.5rem] text-center">
            {String(countdown.seconds).padStart(2, "0")}
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] text-center mt-2">
          이후 유료 전환 예정
        </p>
      </div>
    </main>
  );
}
