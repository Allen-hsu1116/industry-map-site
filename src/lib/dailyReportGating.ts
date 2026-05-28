export type AnalysisQualityGrade = "A" | "B" | "C" | "D" | "F";

export interface DailyReportPickLike {
  code: string;
  rank: number;
}

export interface DailyReportAnalysisLike {
  analysisQuality?: {
    grade?: AnalysisQualityGrade;
    label?: string;
    blockingReasons?: string[];
  };
  scoring?: {
    recommendationState?: "top_candidate" | "watchlist" | "blocked";
    riskGates?: Array<{ id: string; severity: "hard" | "soft"; message: string }>;
  };
}

export interface GatedPick<TPick extends DailyReportPickLike> {
  pick: TPick;
  analysis?: DailyReportAnalysisLike;
  gate: "top_recommendation" | "observation_only";
  reason?: string;
}

export interface DailyReportPickBuckets<TPick extends DailyReportPickLike> {
  topRecommendations: Array<GatedPick<TPick>>;
  observationOnly: Array<GatedPick<TPick>>;
}

const topRecommendationGrades = new Set<AnalysisQualityGrade>(["A", "B", "C"]);

export function isTopRecommendationGrade(grade: AnalysisQualityGrade | undefined): boolean {
  return grade ? topRecommendationGrades.has(grade) : false;
}

function hasHardRiskGate(analysis: DailyReportAnalysisLike | undefined): boolean {
  return Boolean(analysis?.scoring?.riskGates?.some((gate) => gate.severity === "hard") || analysis?.scoring?.recommendationState === "blocked");
}

function observationReason(analysis: DailyReportAnalysisLike | undefined): string {
  const quality = analysis?.analysisQuality;
  const hardGate = analysis?.scoring?.riskGates?.find((gate) => gate.severity === "hard");
  if (hardGate) return `風控硬閘門：${hardGate.message}`;
  if (analysis?.scoring?.recommendationState === "blocked") return "Scoring v3 判定 blocked，不可列入 Top recommendation。";
  if (!quality) return "缺 Daily Analysis 品質分級，先列為觀察/資料不足。";
  if (quality.grade === "D") return "分析品質 D：目前主要是 legacy / 尚未 evidence-backed，只能觀察。";
  if (quality.grade === "F") return "分析品質 F：資料不足，不可列入 Top recommendation。";
  return `分析品質 ${quality.grade} 可列 Top recommendation。`;
}

export function gateDailyReportPicks<TPick extends DailyReportPickLike>(
  picks: TPick[],
  analysesByCode: Record<string, DailyReportAnalysisLike | undefined>,
): DailyReportPickBuckets<TPick> {
  return picks.reduce<DailyReportPickBuckets<TPick>>((buckets, pick) => {
    const analysis = analysesByCode[pick.code];
    const grade = analysis?.analysisQuality?.grade;
    const blockedByRisk = hasHardRiskGate(analysis);
    const gated: GatedPick<TPick> = {
      pick,
      analysis,
      gate: isTopRecommendationGrade(grade) && !blockedByRisk ? "top_recommendation" : "observation_only",
      reason: observationReason(analysis),
    };

    if (gated.gate === "top_recommendation") {
      buckets.topRecommendations.push(gated);
    } else {
      buckets.observationOnly.push(gated);
    }

    return buckets;
  }, { topRecommendations: [], observationOnly: [] });
}
