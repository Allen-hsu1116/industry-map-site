import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ChipValuationSnapshotData {
  valuation: {
    pe: string;
    pb: string;
    dividendYield: string;
  };
  balance: {
    totalAssets: string;
    totalLiabilities: string;
  };
}

export interface ChipValuationSnapshotPanelProps {
  data: ChipValuationSnapshotData;
}

function StatItem({
  label,
  value,
  sub,
  className = "",
  trend,
}: {
  label: string;
  value: string | ReactNode;
  sub?: string;
  className?: string;
  trend?: ReactNode;
}) {
  return (
    <div className={cn("bg-white/[0.02] rounded-xl p-4", className)}>
      <div className="text-xs text-[var(--color-text-tertiary)] mb-1.5 flex items-center gap-1.5">{label}{trend}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-[var(--color-text-tertiary)] mt-1">{sub}</div>}
    </div>
  );
}

/* ─── Chip valuation snapshot ─── */
export function ChipValuationSnapshotPanel({ data }: ChipValuationSnapshotPanelProps) {
  const assets = parseFloat(data.balance.totalAssets);
  const liabilities = parseFloat(data.balance.totalLiabilities);
  const debtRatio = assets > 0 && liabilities > 0 ? ((liabilities / assets) * 100).toFixed(1) + "%" : "-";

  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <h4 className="text-sm font-bold text-white mb-4">🎰 籌碼分析</h4>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatItem label="本益比 (P/E)" value={data.valuation.pe || "-"} sub={data.valuation.pe ? "倍" : undefined} />
        <StatItem label="股價淨值比 (P/B)" value={data.valuation.pb || "-"} sub={data.valuation.pb ? "倍" : undefined} />
        <StatItem label="現金殖利率" value={data.valuation.dividendYield ? `${data.valuation.dividendYield}%` : "-"} />
        <StatItem label="負債比" value={debtRatio} />
      </div>
    </div>
  );
}
