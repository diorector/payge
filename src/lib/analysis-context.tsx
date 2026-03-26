"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { PreAnalysisResult, FullAnalysisResult } from "./types";

interface AnalysisState {
  instagramId: string;
  setInstagramId: (id: string) => void;
  preAnalysis: PreAnalysisResult | null;
  setPreAnalysis: (result: PreAnalysisResult) => void;
  fullAnalysis: FullAnalysisResult | null;
  setFullAnalysis: (result: FullAnalysisResult) => void;
  answers: number[];
  setAnswers: (answers: number[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  runPreAnalysis: (id: string) => Promise<PreAnalysisResult | null>;
  runFullAnalysis: () => Promise<FullAnalysisResult | null>;
}

const AnalysisContext = createContext<AnalysisState | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [instagramId, setInstagramId] = useState("");
  const [preAnalysis, setPreAnalysis] = useState<PreAnalysisResult | null>(
    null
  );
  const [fullAnalysis, setFullAnalysis] = useState<FullAnalysisResult | null>(
    null
  );
  const [answers, setAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPreAnalysis = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/instagram/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagramId: id, step: "preAnalysis" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "분석에 실패했어요");
      }

      const result: PreAnalysisResult = await res.json();
      setPreAnalysis(result);
      setInstagramId(id);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const runFullAnalysisAction = async () => {
    if (!preAnalysis) return null;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/instagram/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagramId,
          step: "fullAnalysis",
          preAnalysis,
          answers,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "분석에 실패했어요");
      }

      const result: FullAnalysisResult = await res.json();
      setFullAnalysis(result);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        instagramId,
        setInstagramId,
        preAnalysis,
        setPreAnalysis,
        fullAnalysis,
        setFullAnalysis,
        answers,
        setAnswers,
        isLoading,
        setIsLoading,
        error,
        setError,
        runPreAnalysis,
        runFullAnalysis: runFullAnalysisAction,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysis must be used within AnalysisProvider");
  }
  return context;
}
