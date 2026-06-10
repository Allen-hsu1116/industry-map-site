import type { ReactNode } from "react";

import { BatchAnalysisPanel } from "@/components/company-detail/BatchAnalysisPanel";
import { ChipValuationSnapshotPanel, type ChipValuationSnapshotPanelProps } from "@/components/company-detail/ChipValuationSnapshotPanel";

interface CompanyChipsDailyAnalysis {
  generatedAt: string;
  chips: {
    label: string;
    score: number;
    summary: string;
    signals: string[];
    risks: string[];
    watch: string[];
  };
}

export interface CompanyChipsTabShellProps {
  data: ChipValuationSnapshotPanelProps["data"];
  dailyAnalysis?: CompanyChipsDailyAnalysis;
  children: ReactNode;
}

export function CompanyChipsTabShell({
  data,
  dailyAnalysis,
  children,
}: CompanyChipsTabShellProps) {
  return (
    <div className="space-y-6">
      <ChipValuationSnapshotPanel data={data} />
      {dailyAnalysis && (
        <BatchAnalysisPanel
          title="🧠 籌碼收盤後判讀"
          badge={dailyAnalysis.chips.label}
          score={dailyAnalysis.chips.score}
          summary={dailyAnalysis.chips.summary}
          signals={dailyAnalysis.chips.signals}
          risks={dailyAnalysis.chips.risks}
          watch={dailyAnalysis.chips.watch}
          generatedAt={dailyAnalysis.generatedAt}
        />
      )}
      {children}
    </div>
  );
}
