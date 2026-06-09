import { type Dispatch, type ReactNode, type SetStateAction, useState } from "react";

import { cn } from "@/lib/utils";

export type CompanyOverviewProfitTab = "quarterly" | "yearly";

type CompanyOverviewSubTab = "financial" | "news";

interface CompanyOverviewTabProps {
  financialContent: (
    profitTab: CompanyOverviewProfitTab,
    setProfitTab: Dispatch<SetStateAction<CompanyOverviewProfitTab>>
  ) => ReactNode;
  majorNewsContent: ReactNode;
}

export function CompanyOverviewTab({ financialContent, majorNewsContent }: CompanyOverviewTabProps) {
  const [profitTab, setProfitTab] = useState<CompanyOverviewProfitTab>("quarterly");
  const [overviewSubTab, setOverviewSubTab] = useState<CompanyOverviewSubTab>("financial");

  return (
    <div className="space-y-6">
      {/* Sub-tabs: 財務數據 | 重大資訊 */}
      <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1">
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
            overviewSubTab === "financial"
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-gray-400 hover:text-[var(--color-text-secondary)]"
          )}
          onClick={() => setOverviewSubTab("financial")}
        >
          財務數據
        </button>
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
            overviewSubTab === "news"
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-gray-400 hover:text-[var(--color-text-secondary)]"
          )}
          onClick={() => setOverviewSubTab("news")}
        >
          重大資訊
        </button>
      </div>

      {overviewSubTab === "financial" && financialContent(profitTab, setProfitTab)}
      {overviewSubTab === "news" && majorNewsContent}
    </div>
  );
}
