export type AnalysisQualityGrade = "A" | "B" | "C" | "D" | "F";

export interface DailyReportPickLike {
  code: string;
  rank: number;
}

export interface DailyReportAnalysisLike {
  analysisQuality?: {
    grade: AnalysisQualityGrade;
    label?: string;
    blockingReasons?: string[];
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

function observationReason(analysis: DailyReportAnalysisLike | undefined): string {
  const quality = analysis?.analysisQuality;
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
    const gated: GatedPick<TPick> = {
      pick,
      analysis,
      gate: isTopRecommendationGrade(grade) ? "top_recommendation" : "observation_only",
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
