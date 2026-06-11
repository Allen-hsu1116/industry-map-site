import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TechnicalScope = "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y";
export type TechnicalMaLineKey = "ma5" | "ma10" | "ma20" | "ma60";
export type TechnicalTrendChartMode = "daily" | "monthly" | "empty";

export interface TechnicalScopeOption {
  id: TechnicalScope;
  label: string;
}

export interface TechnicalMaOption {
  key: TechnicalMaLineKey;
  label: string;
  color: string;
  enabled: boolean;
}

export interface CompanyTechnicalTrendPanelProps {
  code: string;
  chartMode: TechnicalTrendChartMode;
  chartContent: ReactNode;
  latestKLineDate: string | null;
  scopeOptions: TechnicalScopeOption[];
  activeScope: TechnicalScope;
  onScopeChange: (scope: TechnicalScope) => void;
  maOptions: TechnicalMaOption[];
  onMaToggle: (key: TechnicalMaLineKey) => void;
}

export function CompanyTechnicalTrendPanel({
  code,
  chartMode,
  chartContent,
  latestKLineDate,
  scopeOptions,
  activeScope,
  onScopeChange,
  maOptions,
  onMaToggle,
}: CompanyTechnicalTrendPanelProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-white">📈 技術走勢圖</h4>
        <a
          href={`https://www.tradingview.com/symbols/TWSE-${code}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all"
        >
          在 TradingView 開啟完整圖表 ↗
        </a>
      </div>

      {chartMode === "daily" && (
        <>
          <div className="flex items-center gap-1 mb-3">
            {scopeOptions.map((option) => (
              <button
                key={option.id}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                  activeScope === option.id
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    : "text-gray-400 hover:text-[var(--color-text-secondary)] border border-transparent",
                )}
                onClick={() => onScopeChange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-3 text-xs">
            <span className="text-[#22ab94]">● 漲</span>
            <span className="text-[#f7525f]">● 跌</span>
            {maOptions.map((option) => (
              <button
                key={option.key}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded transition-all",
                  option.enabled ? "opacity-100" : "opacity-30 line-through",
                )}
                onClick={() => onMaToggle(option.key)}
              >
                <span style={{ color: option.color }}>━</span>
                <span style={{ color: option.enabled ? option.color : "#9ca3af" }}>{option.label}</span>
              </button>
            ))}
          </div>
          {latestKLineDate && (
            <div className="mb-3 rounded-xl border border-cyan-500/20 bg-cyan-500/8 px-3 py-2 text-xs text-cyan-100/85">
              K 線最新日期：<span className="font-semibold text-white">{latestKLineDate}</span> · Source: FinMind TaiwanStockPrice checked-in OHLCV；只更新官方/FinMind 日 K，不用 AI 補 K 線。
            </div>
          )}
          {chartContent}
        </>
      )}

      {chartMode === "monthly" && (
        <>
          {chartContent}
          <p className="text-xs text-[var(--color-text-tertiary)] mt-3 text-center">
            💡 每日 K 線資料累積中（需 ≥5 個交易日），目前顯示月均價趨勢圖
          </p>
        </>
      )}

      {chartMode === "empty" && (
        <div className="text-center py-12 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-sm text-[var(--color-text-tertiary)]">股價走勢資料累積中</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">需要更多歷史資料才能生成走勢圖</p>
        </div>
      )}
    </div>
  );
}
