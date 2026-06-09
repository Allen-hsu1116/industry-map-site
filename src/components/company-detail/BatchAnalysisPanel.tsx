"use client";

import { cn } from "@/lib/utils";

export interface BatchAnalysisPanelProps {
  title: string;
  badge: string;
  score: number;
  summary: string;
  signals: string[];
  risks: string[];
  watch: string[];
  generatedAt?: string;
  description?: string;
}

/* ─── Batch Analysis Panel ─── */
export function BatchAnalysisPanel({
  title,
  badge,
  score,
  summary,
  signals,
  risks,
  watch,
  generatedAt,
  description,
}: BatchAnalysisPanelProps) {
  const scoreTone = score >= 20 ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : score <= -20 ? "text-rose-300 bg-rose-500/10 border-rose-500/20" : "text-slate-300 bg-slate-500/10 border-slate-500/20";
  const generatedLabel = generatedAt ? new Date(generatedAt).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "即時計算";
  const renderList = (items: string[], color: string) => items.length > 0 ? (
    <ul className="space-y-1.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", color)} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  ) : <div className="text-xs text-[var(--color-text-tertiary)]">暫無明顯訊號</div>;

  return (
    <div className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.08] via-white/[0.025] to-indigo-500/[0.06] p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-white">{title}</div>
          <div className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">{description ?? `規則式判讀 · ${generatedLabel}`}</div>
        </div>
        <div className={cn("rounded-full border px-3 py-1 text-xs font-bold", scoreTone)}>
          {badge} · {score > 0 ? "+" : ""}{score}
        </div>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-slate-200">{summary}</p>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-emerald-300">正向訊號</div>
          {renderList(signals, "bg-emerald-400")}
        </div>
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-rose-300">風險訊號</div>
          {renderList(risks, "bg-rose-400")}
        </div>
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-amber-300">觀察重點</div>
          {renderList(watch, "bg-amber-300")}
        </div>
      </div>
    </div>
  );
}
