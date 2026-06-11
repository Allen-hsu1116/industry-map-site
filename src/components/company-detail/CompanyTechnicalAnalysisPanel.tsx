import { BatchAnalysisPanel } from "@/components/company-detail/BatchAnalysisPanel";

export interface CompanyTechnicalAnalysisPanelProps {
  badge: string;
  score: number;
  summary: string;
  signals: string[];
  risks: string[];
  watch: string[];
  generatedAt?: string;
  description: string;
}

export function CompanyTechnicalAnalysisPanel({
  badge,
  score,
  summary,
  signals,
  risks,
  watch,
  generatedAt,
  description,
}: CompanyTechnicalAnalysisPanelProps) {
  return (
    <BatchAnalysisPanel
      title="📊 技術分析判讀"
      badge={badge}
      score={score}
      summary={summary}
      signals={signals}
      risks={risks}
      watch={watch}
      generatedAt={generatedAt}
      description={description}
    />
  );
}
