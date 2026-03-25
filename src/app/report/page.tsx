"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { READING_TYPES, BOOK_RECOMMENDATIONS } from "@/lib/constants";
import Link from "next/link";

const EXTENDED_BOOKS: Record<
  string,
  { title: string; author: string; reason: string }[]
> = {
  explorer: [
    { title: "총, 균, 쇠", author: "재레드 다이아몬드", reason: "인류 문명의 불균형을 지리적 관점으로 풀어낸 책. 탐험가 정신에 불을 붙여줄 거예요." },
    { title: "코스모스", author: "칼 세이건", reason: "지구 밖 우주까지 탐험을 넓혀보세요. 시야가 무한히 확장될 거예요." },
    { title: "넛지", author: "리처드 탈러", reason: "인간 행동의 패턴을 탐험하는 새로운 여정이 될 거예요." },
    { title: "이기적 유전자", author: "리처드 도킨스", reason: "생명의 근본 원리를 탐구하는 여정. 세상을 보는 눈이 달라질 거예요." },
  ],
  storyteller: [
    { title: "나미야 잡화점의 기적", author: "히가시노 게이고", reason: "편지를 통해 이어지는 인연의 이야기. 따뜻한 감동이 오래 남을 거예요." },
    { title: "소년이 온다", author: "한강", reason: "무거운 이야기지만, 이야기의 힘을 믿는 당신이라면 감당할 수 있을 거예요." },
    { title: "작은 아씨들", author: "루이자 메이 올컷", reason: "각자의 꿈을 향해 나아가는 자매의 이야기. 용기를 받을 거예요." },
    { title: "해변의 카프카", author: "무라카미 하루키", reason: "현실과 환상 사이, 이야기의 미로를 함께 걸어보세요." },
  ],
  analyst: [
    { title: "생각에 관한 생각", author: "대니얼 카너먼", reason: "사고의 두 체계를 분석적으로 이해하면 더 나은 판단을 내릴 수 있어요." },
    { title: "블랙스완", author: "나심 탈레브", reason: "예측 불가능한 세상에서 분석가가 알아야 할 겸손함을 배울 수 있어요." },
    { title: "21세기 자본", author: "토마 피케티", reason: "데이터로 자본주의를 해부한 역작. 분석가의 역량을 한 단계 올려줄 거예요." },
    { title: "신호와 소음", author: "네이트 실버", reason: "데이터 속 의미 있는 신호를 찾는 법. 분석가에게 꼭 필요한 책이에요." },
  ],
  healer: [
    { title: "미움받을 용기", author: "기시미 이치로", reason: "타인의 기대에서 자유로워지는 법. 마음의 짐을 내려놓을 수 있을 거예요." },
    { title: "걱정의 95%는 일어나지 않는다", author: "에노모토 와타루", reason: "걱정을 줄이는 구체적인 방법을 알려줘요. 마음이 한결 가벼워질 거예요." },
    { title: "죽고 싶지만 떡볶이는 먹고 싶어", author: "백세희", reason: "솔직한 마음 이야기. 당신의 감정도 괜찮다고 말해주는 책이에요." },
    { title: "마음 챙김의 시", author: "틱낫한", reason: "일상 속 명상의 지혜. 읽는 것만으로도 치유가 시작될 거예요." },
  ],
  creator: [
    { title: "빅 매직", author: "엘리자베스 길버트", reason: "창의성의 비밀을 풀어낸 책. 영감의 원천을 다시 찾을 수 있을 거예요." },
    { title: "훔쳐라, 아티스트처럼", author: "오스틴 클레온", reason: "창작의 부담을 덜어주는 실용적 조언. 바로 뭔가 만들고 싶어질 거예요." },
    { title: "모모", author: "미하엘 엔데", reason: "시간의 의미를 되짚어보는 판타지. 새로운 상상의 문이 열릴 거예요." },
    { title: "나는 왜 쓰는가", author: "조지 오웰", reason: "글쓰기의 본질적 동기를 탐구해요. 표현의 욕구가 불타오를 거예요." },
  ],
};

const FAMOUS_MATCHES: Record<string, string[]> = {
  explorer: ["일론 머스크", "유시민", "김영하"],
  storyteller: ["BTS RM", "이석영", "공지영"],
  analyst: ["빌 게이츠", "손석희", "유발 하라리"],
  healer: ["혜민 스님", "이나영", "무라카미 하루키"],
  creator: ["스티브 잡스", "정세랑", "봉준호"],
};

function ReportContent() {
  const searchParams = useSearchParams();
  const instagramId = searchParams.get("id") ?? "";
  const typeId = searchParams.get("type") ?? "explorer";

  const readingType = useMemo(
    () => READING_TYPES.find((t) => t.id === typeId) ?? READING_TYPES[0],
    [typeId]
  );
  const mainBook = BOOK_RECOMMENDATIONS[typeId] ?? BOOK_RECOMMENDATIONS["explorer"];
  const extraBooks = EXTENDED_BOOKS[typeId] ?? EXTENDED_BOOKS["explorer"];
  const famousMatches = FAMOUS_MATCHES[typeId] ?? FAMOUS_MATCHES["explorer"];

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

        {/* Preview: Section 01 - Reading personality */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold bg-[var(--accent)] px-2 py-0.5 rounded">
              01
            </span>
            <h3 className="font-bold">나의 독서 성격 상세</h3>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5">
            <h4 className="text-lg font-bold mb-2">{readingType.name}</h4>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              {readingType.description}
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[var(--accent-dark)] mb-1">
                  강점
                </p>
                <div className="flex flex-wrap gap-1">
                  {readingType.strengths.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-[#F0FFB0] px-2 py-0.5 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] mb-1">
                  블라인드스팟
                </p>
                <div className="flex flex-wrap gap-1">
                  {readingType.blindspots.map((b) => (
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
          </div>
        </section>

        {/* Section 02 - AI 추천 5권 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold bg-[var(--accent)] px-2 py-0.5 rounded">
              02
            </span>
            <h3 className="font-bold">AI 추천 책 5권</h3>
          </div>

          {/* Main book (free preview) */}
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-3">
            <div className="flex gap-4">
              <div className="w-16 h-22 bg-gradient-to-br from-[var(--accent)] to-[#8BC34A] rounded-lg flex items-center justify-center flex-shrink-0 shadow">
                <span className="text-xl font-bold text-white">
                  {mainBook.title[0]}
                </span>
              </div>
              <div>
                <h4 className="font-bold">{mainBook.title}</h4>
                <p className="text-xs text-[var(--muted)]">{mainBook.author}</p>
                <p className="text-sm mt-1 leading-relaxed">{mainBook.reason}</p>
              </div>
            </div>
          </div>

          {/* Locked books */}
          {extraBooks.map((book, i) => (
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-sm">
                  지금
                </div>
                <div>
                  <p className="font-medium">시야 확장 단계</p>
                  <p className="text-xs text-[var(--muted)]">
                    새로운 관점을 열어줄 기초 도서 2권
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center font-bold text-sm">
                  3M
                </div>
                <div>
                  <p className="font-medium">깊이 파고들기 단계</p>
                  <p className="text-xs text-[var(--muted)]">
                    핵심 분야 전문 도서 2권
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center font-bold text-sm">
                  1Y
                </div>
                <div>
                  <p className="font-medium">통합 성장 단계</p>
                  <p className="text-xs text-[var(--muted)]">
                    인사이트를 연결하는 종합 도서 1권
                  </p>
                </div>
              </div>
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
                {famousMatches.map((name) => (
                  <div key={name} className="text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-200 mx-auto mb-1" />
                    <p className="text-xs font-medium">{name}</p>
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
                {[mainBook, ...extraBooks].map((book, i) => (
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
