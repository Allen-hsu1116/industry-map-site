import { Badge } from "@/components/ui/badge";

export interface CompanyIndustryRoleSummaryCoverageCard {
  label: string;
  value: string;
  note: string;
  tone: string;
}

export interface CompanyIndustryRoleSummaryDailyIndustry {
  score?: number;
  scoringFactors?: string[];
}

export interface CompanyIndustryRoleSummaryRoleBadge {
  color: string;
  bg: string;
}

export interface CompanyIndustryRoleSummaryRelevanceInfo {
  emoji: string;
  label: string;
}

export interface CompanyIndustryRoleSummaryPanelProps {
  summary: string;
  integratedDailyNote: string;
  dailyIndustry?: CompanyIndustryRoleSummaryDailyIndustry;
  evidenceCoverageCards: CompanyIndustryRoleSummaryCoverageCard[];
  displayRoleBadge: CompanyIndustryRoleSummaryRoleBadge;
  displayRelInfo: CompanyIndustryRoleSummaryRelevanceInfo;
  canonicalRoleLabel?: string;
  v2Directness?: string;
  v2Confidence?: string;
  topicName: string;
  category: string;
}

function AiIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>;
}

export function CompanyIndustryRoleSummaryPanel({
  summary,
  integratedDailyNote,
  dailyIndustry,
  evidenceCoverageCards,
  displayRoleBadge,
  displayRelInfo,
  canonicalRoleLabel,
  v2Directness,
  v2Confidence,
  topicName,
  category,
}: CompanyIndustryRoleSummaryPanelProps) {
  return (
    <>
      {/* 產業統整 Summary */}
      <div className="bg-gradient-to-br from-indigo-500/[0.08] to-purple-600/[0.06] border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <AiIcon />
          </div>
          <h4 className="text-sm font-bold text-white">題材角色統整摘要</h4>
          <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[10px]">來源整合</Badge>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {summary}{integratedDailyNote}
        </p>
        {dailyIndustry && typeof dailyIndustry.score === "number" && (
          <div className="mt-4 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-200">Daily industry score</div>
                <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">由直接度、題材狀態、證據信心、催化與 SWOT 風險加權</div>
              </div>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-100">
                {dailyIndustry.score}/100
              </span>
            </div>
            {(dailyIndustry.scoringFactors?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {dailyIndustry.scoringFactors?.slice(0, 6).map((factor, factorIndex) => (
                  <span key={factorIndex} className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[var(--color-text-secondary)]">
                    {factor}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold whitespace-nowrap px-2.5 py-1 rounded-full" style={{ color: displayRoleBadge.color, backgroundColor: displayRoleBadge.bg }}>
            {displayRelInfo.emoji} {canonicalRoleLabel ?? displayRelInfo.label}
          </span>
          {(v2Directness || v2Confidence) && (
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
              V2 {v2Directness} · {v2Confidence}
            </span>
          )}
          <span className="text-sm font-semibold text-white">{topicName}</span>
          <span className="text-xs text-[var(--color-text-tertiary)]">— {category}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-300/15 bg-sky-300/[0.04] p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-sky-200">Evidence-backed coverage</div>
            <h4 className="mt-1 text-sm font-bold text-white">證據覆蓋與資料信心水位</h4>
          </div>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold text-amber-100">
            資料不足項目只做觀察，不升級成推薦
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {evidenceCoverageCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-white/[0.06] bg-black/[0.12] p-4">
              <div className="text-[11px] text-[var(--color-text-tertiary)]">{card.label}</div>
              <div className={`mt-1 text-lg font-bold ${card.tone}`}>{card.value}</div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">{card.note}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
