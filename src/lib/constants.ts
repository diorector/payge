export const BRAND = {
  name: "PAYGE LAB",
  tagline: "당신의 인스타를 읽은 AI가, 지금 당신에게 필요한 책 1권을 찾아드립니다.",
  siteUrl: "https://payge.kr",
} as const;

export const READING_TYPES = [
  {
    id: "explorer",
    name: "현실을 바꾸는 지적 탐험가",
    emoji: "compass",
    description:
      "새로운 세상을 탐색하며, 지식을 통해 현실을 바꾸는 힘을 얻는 타입이에요. 다양한 분야에 관심이 많고, 깊이 파고들기를 좋아해요.",
    strengths: ["넓은 시야", "빠른 학습력", "통찰력"],
    blindspots: ["한 곳에 깊이 머물기 어려움", "정보 과부하 위험"],
  },
  {
    id: "storyteller",
    name: "감성을 채우는 스토리텔러",
    emoji: "book",
    description:
      "이야기 속에서 삶의 의미를 찾는 타입이에요. 공감 능력이 뛰어나고, 글을 통해 감정을 정리하는 걸 좋아해요.",
    strengths: ["공감 능력", "감수성", "표현력"],
    blindspots: ["감정에 치우칠 수 있음", "현실적 분석 부족할 수 있음"],
  },
  {
    id: "analyst",
    name: "세상을 해독하는 분석가",
    emoji: "magnifier",
    description:
      "데이터와 논리로 세상을 이해하는 타입이에요. 구조를 파악하고, 패턴을 찾아내는 걸 좋아해요.",
    strengths: ["논리적 사고", "체계적 접근", "문제 해결력"],
    blindspots: ["감정적 맥락 놓칠 수 있음", "분석 마비 위험"],
  },
  {
    id: "healer",
    name: "마음을 돌보는 힐러",
    emoji: "leaf",
    description:
      "책을 통해 마음의 안정과 치유를 찾는 타입이에요. 자기 성찰을 중요하게 여기고, 내면의 성장에 관심이 많아요.",
    strengths: ["자기 인식", "정서적 안정감", "회복력"],
    blindspots: ["외부 세계와 거리를 둘 수 있음", "변화에 대한 저항"],
  },
  {
    id: "creator",
    name: "영감을 수집하는 크리에이터",
    emoji: "sparkle",
    description:
      "책에서 영감을 받아 새로운 것을 만드는 타입이에요. 창의적이고, 다양한 분야를 넘나들며 아이디어를 조합해요.",
    strengths: ["창의력", "융합적 사고", "실행력"],
    blindspots: ["완성보다 시작을 좋아함", "집중력 분산 위험"],
  },
] as const;

export const BOOK_RECOMMENDATIONS: Record<
  string,
  {
    title: string;
    author: string;
    cover: string;
    reason: string;
  }
> = {
  explorer: {
    title: "사피엔스",
    author: "유발 하라리",
    cover: "/books/sapiens.jpg",
    reason:
      "끊임없이 새로운 세계를 탐험하는 당신에게, 인류 전체를 조망하는 이 책이 지금 필요해요. 큰 그림을 보면 작은 일상도 달라 보일 거예요.",
  },
  storyteller: {
    title: "아몬드",
    author: "손원평",
    cover: "/books/almond.jpg",
    reason:
      "감정을 깊이 느끼는 당신이기에, 감정을 느끼지 못하는 소년의 이야기가 더 깊이 와닿을 거예요. 읽고 나면 마음이 한 뼘 더 넓어질 거예요.",
  },
  analyst: {
    title: "팩트풀니스",
    author: "한스 로슬링",
    cover: "/books/factfulness.jpg",
    reason:
      "데이터로 세상을 읽는 당신에게, 데이터의 함정을 알려주는 이 책이 딱이에요. 분석가의 눈을 한 단계 업그레이드해줄 거예요.",
  },
  healer: {
    title: "지금 이대로 좋다",
    author: "혜민",
    cover: "/books/its-okay.jpg",
    reason:
      "늘 마음을 돌보는 당신에게, 잠시 쉬어도 괜찮다고 말해주는 책이에요. 읽는 동안 마음이 가벼워질 거예요.",
  },
  creator: {
    title: "스틸 라이프",
    author: "은유",
    cover: "/books/still-life.jpg",
    reason:
      "영감의 원천을 찾는 당신에게, 일상의 정물에서 삶의 의미를 발견하는 이 책이 새로운 시선을 선물할 거예요.",
  },
};

export const SCANNING_STEPS = [
  { label: "피드 키워드 추출 중", duration: 1500 },
  { label: "관심사 클러스터링", duration: 1200 },
  { label: "감정 톤 분석", duration: 1800 },
  { label: "스트레스 요인 탐지", duration: 1400 },
  { label: "성장 욕구 벡터 생성", duration: 1600 },
] as const;

export const QUESTIONS_TEMPLATES = [
  {
    id: "q1",
    template: "혼자만의 시간에 주로 뭘 하세요?",
    options: [
      { label: "생각 정리", value: "thinking" },
      { label: "새로운 거 배우기", value: "learning" },
      { label: "그냥 멍때리기", value: "resting" },
    ],
  },
  {
    id: "q2",
    template: "여행에서 가장 기억에 남는 건?",
    options: [
      { label: "현지인 대화", value: "connection" },
      { label: "예상 못한 발견", value: "discovery" },
      { label: "그 나라 음식", value: "experience" },
    ],
  },
  {
    id: "q3",
    template: "힘들 때 충전하는 방법은?",
    options: [
      { label: "몸 움직이기", value: "physical" },
      { label: "혼자 조용히", value: "solitude" },
      { label: "사람들 만나기", value: "social" },
    ],
  },
] as const;
