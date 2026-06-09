import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CompanyDetailTab = "overview" | "industry" | "chips" | "tech" | "news" | "charts";

export const COMPANY_DETAIL_TABS: { id: CompanyDetailTab; label: string; icon: string }[] = [
  { id: "overview", label: "基本資料", icon: "📋" },
  { id: "industry", label: "產業分析", icon: "🏭" },
  { id: "chips", label: "籌碼分析", icon: "🎰" },
  { id: "tech", label: "技術分析", icon: "📊" },
  { id: "news", label: "相關新聞", icon: "📰" },
  { id: "charts", label: "研究圖表", icon: "📈" },
];

interface CompanyDetailTabsProps {
  activeTab: CompanyDetailTab;
  onTabChange: (tab: CompanyDetailTab) => void;
  children: ReactNode;
}

export function CompanyDetailTabs({ activeTab, onTabChange, children }: CompanyDetailTabsProps) {
  return (
    <>
      {/* ─── Main Tabs (aistockmap pill style) ─── */}
      <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 mb-8 overflow-x-auto">
        {COMPANY_DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all rounded-lg",
              activeTab === tab.id
                ? "bg-indigo-500/20 text-indigo-400"
                : "text-gray-400 hover:text-[var(--color-text-secondary)]"
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {children}
    </>
  );
}
