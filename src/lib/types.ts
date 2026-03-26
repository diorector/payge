// Reading DNA 5-Dimension Model (독서 DNA 5차원)
// Inspired by Big Five personality model, adapted for reading preferences

export interface ReadingDNAScore {
  score: number; // 0-1
  confidence: number; // 0-1
  label: string; // "매우 높음" | "높음" | "보통" | "낮음"
  evidence: string; // 인스타에서 찾은 근거
}

export interface ReadingDNA {
  // 5 dimensions
  intellectualCuriosity: ReadingDNAScore; // 지적 호기심 (Openness → 탐구형 독서)
  emotionalEmpathy: ReadingDNAScore; // 감성 공감 (Agreeableness → 공감형 독서)
  executionDrive: ReadingDNAScore; // 실행력 (Conscientiousness → 실용형 독서)
  introspectionDepth: ReadingDNAScore; // 성찰 깊이 (Neuroticism → 내면 탐색형 독서)
  creativeIntegration: ReadingDNAScore; // 창의 융합 (Extraversion → 영감 수집형 독서)
}

export interface ReadingDNAItem {
  itemId: string; // "IC1", "IC2", "EE1", "EE2", "ED1", ... (차원별 4개)
  score: number; // 1-5
  confidence: number; // 0-1
  evidence: string; // 인스타에서 찾은 근거
}

export interface PersonalizedQuestion {
  trait: "IC" | "EE" | "ED" | "ID" | "CI"; // 어떤 DNA 차원을 측정하는 질문인지
  question: string; // 인스타 기반 개인화된 질문
  options: string[]; // 3개 선택지
  scores: number[]; // 각 선택지의 가중치 [0.8, 0.5, 0.2]
}

export interface BookRecommendation {
  title: string;
  author: string;
  reason: string; // 개인화된 추천 사유
  matchScore: number; // 0-1 매칭 점수
  dimension: string; // 어떤 DNA 차원과 연결되는지
}

export interface ReadingPersonaLayers {
  surface: {
    firstImpression: string; // "주변에서 이런 책 읽을 것 같다고 하죠?"
    readingVibe: string; // 독서 분위기
    socialReading: string; // 독서 소셜 에너지
  };
  behavioral: {
    readingStyle: string; // 독서 습관/스타일
    bookSelectionPattern: string; // 책 선택 패턴
    retentionMethod: string; // 독서 후 지식 활용법
    sharingHabit: string; // 책 나눔 습관
  };
  deep: {
    coreValues: string[]; // 핵심 가치관 (독서를 통해 추구하는 것)
    emotionalNeeds: string; // 감정적 욕구 (독서로 채우는 것)
    growthDirection: string; // 성장 방향
    avoidTopics: string[]; // 이런 책은 피하세요
  };
}

export interface ReadingCompatibility {
  bestMatchTraits: string[]; // 같이 읽으면 좋은 사람 특성
  challengingMatchTraits: string[]; // 독서 궁합 안 맞는 특성
  bookClubRole: string; // 북클럽에서의 역할
  conversationStarters: string[]; // 책 대화 스타터
}

export interface PreAnalysisResult {
  instagramId: string;
  cloneFirstWords: string[]; // 유저 특유의 표현 10개
  readingDNA: ReadingDNA;
  items: ReadingDNAItem[]; // 20개 항목 (차원별 4개)
  personalizedQuestions: PersonalizedQuestion[]; // 5개 개인화 질문
  instantBook: BookRecommendation; // AI가 즉시 추천하는 1권 (무료)
}

export interface FullAnalysisResult extends PreAnalysisResult {
  readingTypeName: string; // "현실을 바꾸는 지적 탐험가"
  readingTypeDescription: string;
  matchPercent: string; // "93.2"
  bookRecommendations: BookRecommendation[]; // 4권 (instantBook 제외 추가분)
  personaLayers: ReadingPersonaLayers;
  readingCompatibility: ReadingCompatibility;
  readingRoadmap: {
    now: { theme: string; books: string[] };
    threeMonths: { theme: string; books: string[] };
    oneYear: { theme: string; books: string[] };
  };
  famousMatch: {
    name: string;
    reason: string;
  }[];
  aiBookFriendPrompt: string; // AI 책 친구 시스템 프롬프트
}

// Dimension labels for display
export const DNA_DIMENSIONS = {
  intellectualCuriosity: {
    code: "IC",
    name: "지적 호기심",
    description: "새로운 지식과 세상을 탐구하려는 욕구",
    icon: "🔍",
  },
  emotionalEmpathy: {
    code: "EE",
    name: "감성 공감",
    description: "이야기와 감정에 깊이 공명하는 능력",
    icon: "💛",
  },
  executionDrive: {
    code: "ED",
    name: "실행력",
    description: "배운 것을 실제 행동으로 옮기는 힘",
    icon: "⚡",
  },
  introspectionDepth: {
    code: "ID",
    name: "성찰 깊이",
    description: "내면을 들여다보고 자기를 이해하려는 성향",
    icon: "🌿",
  },
  creativeIntegration: {
    code: "CI",
    name: "창의 융합",
    description: "다양한 분야를 연결해 새로운 관점을 만드는 능력",
    icon: "✨",
  },
} as const;

export function getScoreLabel(score: number): string {
  if (score >= 0.85) return "매우 높음";
  if (score >= 0.7) return "높음";
  if (score >= 0.5) return "보통";
  if (score >= 0.3) return "낮음";
  return "매우 낮음";
}
