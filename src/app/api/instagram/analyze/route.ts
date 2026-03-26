import { NextRequest, NextResponse } from "next/server";
import { READING_DNA_ANALYSIS_PROMPT, FULL_ANALYSIS_PROMPT } from "@/lib/prompts";
import type { PreAnalysisResult, FullAnalysisResult } from "@/lib/types";
import { getScoreLabel } from "@/lib/types";

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
  // In production, this would first fetch Instagram profile data
  // For now, we pass the Instagram ID to the AI and let it work with the ID
  const userMessage = `인스타그램 ID: @${instagramId}

이 사용자의 인스타그램 프로필을 분석해서 독서 DNA를 진단해주세요.

참고: 실제 인스타그램 데이터에 접근할 수 없으므로, 이 ID의 사용자가 일반적인 한국인 인스타그램 사용자라고 가정하고,
ID에서 유추할 수 있는 정보(직업, 관심사 등)와 일반적인 인스타그램 활동 패턴을 기반으로 분석해주세요.
실감나는 개인화된 분석을 위해, 구체적이고 현실적인 인스타그램 활동을 상상해서 evidence로 활용하세요.

반드시 지정된 JSON 형식으로만 응답하세요.`;

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
