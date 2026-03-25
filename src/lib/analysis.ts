import { READING_TYPES, BOOK_RECOMMENDATIONS } from "./constants";

type AnswerValue = string;

export function determineReadingType(answers: AnswerValue[]) {
  const scoreMap: Record<string, number> = {
    explorer: 0,
    storyteller: 0,
    analyst: 0,
    healer: 0,
    creator: 0,
  };

  // Q1: 혼자만의 시간
  if (answers[0] === "thinking") {
    scoreMap.analyst += 2;
    scoreMap.healer += 1;
  } else if (answers[0] === "learning") {
    scoreMap.explorer += 2;
    scoreMap.creator += 1;
  } else if (answers[0] === "resting") {
    scoreMap.healer += 2;
    scoreMap.storyteller += 1;
  }

  // Q2: 여행에서 기억에 남는 것
  if (answers[1] === "connection") {
    scoreMap.storyteller += 2;
    scoreMap.healer += 1;
  } else if (answers[1] === "discovery") {
    scoreMap.explorer += 2;
    scoreMap.creator += 1;
  } else if (answers[1] === "experience") {
    scoreMap.creator += 2;
    scoreMap.storyteller += 1;
  }

  // Q3: 충전 방법
  if (answers[2] === "physical") {
    scoreMap.creator += 2;
    scoreMap.explorer += 1;
  } else if (answers[2] === "solitude") {
    scoreMap.healer += 2;
    scoreMap.analyst += 1;
  } else if (answers[2] === "social") {
    scoreMap.storyteller += 2;
    scoreMap.explorer += 1;
  }

  const topType = Object.entries(scoreMap).sort((a, b) => b[1] - a[1])[0][0];
  const readingType = READING_TYPES.find((t) => t.id === topType) ?? READING_TYPES[0];
  const book = BOOK_RECOMMENDATIONS[topType] ?? BOOK_RECOMMENDATIONS["explorer"];

  // Generate a fake match percentage between 88-97% for engagement
  const matchPercent = (88 + Math.random() * 9).toFixed(1);

  return {
    type: readingType,
    book,
    matchPercent,
  };
}
