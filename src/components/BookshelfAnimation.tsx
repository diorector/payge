"use client";

import { useEffect, useState } from "react";

interface BookshelfAnimationProps {
  totalSlots?: number;
  filledSlots: number;
  className?: string;
}

const BOOK_COLORS = [
  "#C6FF00",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
];

export default function BookshelfAnimation({
  totalSlots = 10,
  filledSlots,
  className = "",
}: BookshelfAnimationProps) {
  const [visibleBooks, setVisibleBooks] = useState(0);

  useEffect(() => {
    if (visibleBooks < filledSlots) {
      const timer = setTimeout(() => {
        setVisibleBooks((prev) => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visibleBooks, filledSlots]);

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Shelf */}
      <div className="relative">
        <div className="flex items-end gap-1 h-32 px-3">
          {Array.from({ length: totalSlots }).map((_, i) => (
            <div
              key={i}
              className="flex-1 flex items-end justify-center"
            >
              {i < visibleBooks ? (
                <div
                  className="w-full rounded-t-sm animate-slide-in-book"
                  style={{
                    height: `${60 + Math.random() * 40}%`,
                    backgroundColor: BOOK_COLORS[i % BOOK_COLORS.length],
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ) : (
                <div className="w-full h-1/2 border-2 border-dashed border-[var(--border)] rounded-t-sm opacity-30" />
              )}
            </div>
          ))}
        </div>
        {/* Shelf board */}
        <div className="h-2 bg-[var(--foreground)] rounded-sm opacity-20" />
      </div>

      {/* Progress text */}
      <div className="mt-3 text-center text-sm text-[var(--muted)]">
        {Math.round((visibleBooks / totalSlots) * 100)}% 채워짐
      </div>
    </div>
  );
}
