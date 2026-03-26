import { NextRequest, NextResponse } from "next/server";
import { READING_DNA_ANALYSIS_PROMPT, FULL_ANALYSIS_PROMPT } from "@/lib/prompts";
import type { PreAnalysisResult, FullAnalysisResult } from "@/lib/types";
import { getScoreLabel } from "@/lib/types";
import { scrapeInstagramProfile, formatProfileForAI } from "@/lib/instagram";

// POST /api/instagram/analyze
// Body: { instagramId: string, step: "preAnalysis" | "fullAnalysis", preAnalysis?: PreAnalysisResult, answers?: number[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instagramId, step, preAnalysis, answers } = body;

    if (!instagramId) {
      return NextResponse.json(
        { error: "instagramId is required" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    const provider = process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai";

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API key not configured" },
        { status: 500 }
      );
    }

    if (step === "preAnalysis") {
      const result = await runPreAnalysis(instagramId, apiKey, provider);
      return NextResponse.json(result);
    }

    if (step === "fullAnalysis") {
      if (!preAnalysis || !answers) {
        return NextResponse.json(
          { error: "preAnalysis and answers are required for fullAnalysis" },
          { status: 400 }
        );
      }
      const result = await runFullAnalysis(
        instagramId,
        preAnalysis,
        answers,
        apiKey,
        provider
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

async function runPreAnalysis(
  instagramId: string,
  apiKey: string,
  provider: string
): Promise<PreAnalysisResult> {
  // Step 1: Scrape real Instagram profile data
  console.log(`[preAnalysis] Scraping @${instagramId}...`);
  const profile = await scrapeInstagramProfile(instagramId);

  let userMessage: string;

  if (profile && !profile.isPrivate) {
    // Real data available — use it
    const profileData = formatProfileForAI(profile);
    const captionCount = profile.captions.length || profile.recentCaptions.length;
    const hasEngagement = profile.captions.some(
      (c) => c.likeCount !== undefined
    );

    console.log(
      `[preAnalysis] Scraped @${instagramId}: ${captionCount} captions, ${profile.followerCount} followers, engagement: ${hasEngagement}`
    );

    userMessage = `${profileData}

위 인스타그램 프로필과 게시물을 분석해서 독서 DNA를 진단해주세요.
${captionCount > 0
  ? `캡션 ${captionCount}개를 기반으로 이 사람의 관심사, 말투, 가치관을 파악하고 evidence에 구체적 캡션 내용을 인용하세요.${hasEngagement ? "\n좋아요/댓글 수를 참고하여 어떤 콘텐츠에 이 사람의 팔로워가 가장 많이 반응하는지도 분석하세요." : ""}`
  : "캡션을 가져오지 못했지만, 바이오와 프로필 정보를 최대한 활용하세요."}
personalizedQuestions에서 반드시 이 사람의 실제 인스타 활동을 언급하세요.

반드시 지정된 JSON 형식으로만 응답하세요.`;
  } else if (profile?.isPrivate) {
    // Private account
    userMessage = `인스타그램 ID: @${instagramId}
이름: ${profile.fullName || "알 수 없음"}
프로필: 비공개 계정

비공개 계정이라 게시물을 볼 수 없습니다.
이름과 ID에서 유추할 수 있는 정보를 기반으로 분석해주세요.
personalizedQuestions는 일반적이되 자연스러운 질문으로 구성하세요.

반드시 지정된 JSON 형식으로만 응답하세요.`;
  } else {
    // Scraping failed — fallback to ID-only analysis
    console.log(`[preAnalysis] Scraping failed for @${instagramId}, using ID-only analysis`);

    userMessage = `인스타그램 ID: @${instagramId}

인스타그램 프로필 데이터를 가져오지 못했습니다.
ID에서 유추할 수 있는 정보(직업, 관심사 등)를 기반으로 분석해주세요.
personalizedQuestions는 자연스럽고 범용적인 질문으로 구성하되, 가능하면 ID에서 힌트를 얻어 개인화하세요.

반드시 지정된 JSON 형식으로만 응답하세요.`;
  }

  const rawResult = await callAI(
    READING_DNA_ANALYSIS_PROMPT,
    userMessage,
    apiKey,
    provider
  );

  const parsed = parseJSONResponse(rawResult);

  // Add labels to readingDNA scores
  for (const key of Object.keys(parsed.readingDNA)) {
    const dim = parsed.readingDNA[key as keyof typeof parsed.readingDNA];
    dim.label = getScoreLabel(dim.score);
  }

  return {
    instagramId,
    ...parsed,
  };
}

async function runFullAnalysis(
  instagramId: string,
  preAnalysis: PreAnalysisResult,
  answers: number[],
  apiKey: string,
  provider: string
): Promise<FullAnalysisResult> {
  // Apply answer weights to adjust preAnalysis scores
  const adjustedDNA = adjustScoresWithAnswers(preAnalysis, answers);

  const userMessage = `인스타그램 ID: @${instagramId}

## preAnalysis 결과 (독서 DNA 5차원)
${JSON.stringify(adjustedDNA.readingDNA, null, 2)}

## 유저의 특징적 표현
${JSON.stringify(adjustedDNA.cloneFirstWords)}

## 개인화 질문 응답
${preAnalysis.personalizedQuestions
    .map((q, i) => `Q: ${q.question}\nA: ${q.options[answers[i]]} (선택: ${answers[i] + 1}번)`)
    .join("\n\n")}

## preAnalysis에서 이미 추천된 책 (중복 금지)
${JSON.stringify(preAnalysis.instantBook)}

위 분석 결과를 바탕으로 종합 독서 리포트를 생성해주세요.
이미 추천된 책(${preAnalysis.instantBook?.title ?? "없음"})은 제외하고 나머지 4권을 추천하세요.
반드시 지정된 JSON 형식으로만 응답하세요.`;

  const rawResult = await callAI(
    FULL_ANALYSIS_PROMPT,
    userMessage,
    apiKey,
    provider
  );

  const parsed = parseJSONResponse(rawResult);

  // Calculate match percent from DNA scores
  const dnaValues = Object.values(adjustedDNA.readingDNA);
  const avgScore =
    dnaValues.reduce((sum, d) => sum + d.score, 0) / dnaValues.length;
  const matchPercent = (85 + avgScore * 12).toFixed(1);

  return {
    ...preAnalysis,
    readingDNA: adjustedDNA.readingDNA,
    matchPercent,
    ...parsed,
  };
}

function adjustScoresWithAnswers(
  preAnalysis: PreAnalysisResult,
  answers: number[]
) {
  const adjusted = JSON.parse(JSON.stringify(preAnalysis)) as PreAnalysisResult;
  const dimensionKeys = [
    "intellectualCuriosity",
    "emotionalEmpathy",
    "executionDrive",
    "introspectionDepth",
    "creativeIntegration",
  ] as const;

  preAnalysis.personalizedQuestions.forEach((q, i) => {
    if (answers[i] === undefined) return;
    const answerWeight = q.scores[answers[i]] ?? 0.5;
    const dimIndex = dimensionKeys.findIndex(
      (k) =>
        k.charAt(0).toUpperCase() + k.charAt(k.indexOf(k.match(/[A-Z]/g)?.[1] ?? "") || 1) ===
        q.trait
    );

    // Match trait code to dimension key
    const traitToDim: Record<string, (typeof dimensionKeys)[number]> = {
      IC: "intellectualCuriosity",
      EE: "emotionalEmpathy",
      ED: "executionDrive",
      ID: "introspectionDepth",
      CI: "creativeIntegration",
    };

    const dimKey = traitToDim[q.trait];
    if (dimKey && adjusted.readingDNA[dimKey]) {
      const current = adjusted.readingDNA[dimKey].score;
      // Weighted blend: 70% preAnalysis + 30% answer
      adjusted.readingDNA[dimKey].score =
        Math.round((current * 0.7 + answerWeight * 0.3) * 100) / 100;
      // Increase confidence since we now have user confirmation
      adjusted.readingDNA[dimKey].confidence = Math.min(
        adjusted.readingDNA[dimKey].confidence + 0.1,
        1.0
      );
      adjusted.readingDNA[dimKey].label = getScoreLabel(
        adjusted.readingDNA[dimKey].score
      );
    }

    void dimIndex; // unused, using traitToDim mapping instead
  });

  return adjusted;
}

async function callAI(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  provider: string
): Promise<string> {
  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // OpenAI fallback
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseJSONResponse(text: string) {
  // Extract JSON from markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to find JSON object in the text
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    throw new Error("Failed to parse AI response as JSON");
  }
}
