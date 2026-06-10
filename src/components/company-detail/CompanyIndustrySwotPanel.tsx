export interface CompanyIndustrySwot {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
}

export interface CompanyIndustrySwotEvidence {
  sourceId: string;
  publisher: string;
  title: string;
  url: string;
}

export interface CompanyIndustryCanonicalSwotItem {
  id: string;
  statement: string;
  rationale: string;
  confidence: string;
  lastVerified?: string | null;
  evidence: CompanyIndustrySwotEvidence[];
}

export type CompanyIndustrySwotKey = "strengths" | "weaknesses" | "opportunities" | "threats";

export type CompanyIndustryCanonicalSwotItemsByKey = Record<CompanyIndustrySwotKey, CompanyIndustryCanonicalSwotItem[]>;

export interface CompanyIndustrySwotPanelProps {
  swot: CompanyIndustrySwot;
  canonicalSwotItemsByKey: CompanyIndustryCanonicalSwotItemsByKey;
  hasCanonicalSwot: boolean;
  isFallbackSwotObservation: boolean;
  swotBadgeLabel?: string;
}

function ExternalIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
}

function PlaceholderSwotPanel() {
  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-lg">🏛️</span>
        <h4 className="text-sm font-bold text-white">SWOT 分析</h4>
      </div>
      <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
        <span className="text-sm">📋 資料準備中</span>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <span className="text-xs text-[var(--color-text-tertiary)] bg-white/[0.03] px-3 py-1.5 rounded-lg">🔒 升級解鎖</span>
      </div>
    </div>
  );
}

export function CompanyIndustrySwotPanel({
  swot,
  canonicalSwotItemsByKey,
  hasCanonicalSwot,
  isFallbackSwotObservation,
  swotBadgeLabel,
}: CompanyIndustrySwotPanelProps) {
  const hasSwotItems = (swot.strengths?.length ?? 0) > 0
    || (swot.weaknesses?.length ?? 0) > 0
    || (swot.opportunities?.length ?? 0) > 0
    || (swot.threats?.length ?? 0) > 0;

  if (!hasSwotItems) {
    return <PlaceholderSwotPanel />;
  }

  const swotSections = [
    { label: "優勢 (S)", items: swot.strengths || [], canonicalItems: canonicalSwotItemsByKey.strengths, color: "#34d399" },
    { label: "劣勢 (W)", items: swot.weaknesses || [], canonicalItems: canonicalSwotItemsByKey.weaknesses, color: "#f87171" },
    { label: "機會 (O)", items: swot.opportunities || [], canonicalItems: canonicalSwotItemsByKey.opportunities, color: "#818cf8" },
    { label: "威脅 (T)", items: swot.threats || [], canonicalItems: canonicalSwotItemsByKey.threats, color: "#fbbf24" },
  ];

  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-bold text-white">🏛️ SWOT 分析</h4>
        {swotBadgeLabel && (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
            {swotBadgeLabel}
          </span>
        )}
      </div>
      {isFallbackSwotObservation && (
        <div className="mb-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-[11px] leading-relaxed text-amber-100/85">
          Fallback SWOT observation：這組 SWOT 尚未 evidence-backed；只能協助觀察，不可升級成推薦或高信心結論。
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {swotSections.map((sw) => (
          <div key={sw.label} className="bg-white/[0.02] rounded-xl p-4">
            <h5 className="text-xs font-bold mb-3" style={{ color: sw.color }}>{sw.label}</h5>
            {hasCanonicalSwot && sw.canonicalItems.length > 0 ? (
              <div className="space-y-3">
                {sw.canonicalItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/[0.05] bg-black/[0.10] p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">Canonical SWOT item</span>
                      <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]">信心：{item.confidence}</span>
                      <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]">驗證：{item.lastVerified ?? "未知"}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">• {item.statement}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">理由：{item.rationale}</p>
                    {item.evidence.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">SWOT evidence</span>
                        {item.evidence.slice(0, 2).map((evidence) => (
                          <a key={evidence.sourceId} href={evidence.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)] hover:text-white">
                            {evidence.publisher}：{evidence.title} <ExternalIcon />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-1">
                {sw.items.map((item, i) => (
                  <li key={i} className="text-xs text-[var(--color-text-secondary)]">• {item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
