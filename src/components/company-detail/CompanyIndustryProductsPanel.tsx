export interface CompanyIndustryProductNarrativeRow {
  name: string;
  description: string;
  confidence?: string;
  lastVerified?: string;
  topicFit?: string;
  whyItMatters?: string;
  businessImpact?: string;
  sourceLabels?: string[];
  sourceUrls?: string[];
}

export interface CompanyIndustryProductsPanelProps {
  products: CompanyIndustryProductNarrativeRow[];
}

function ExternalIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
}

export function CompanyIndustryProductsPanel({ products }: CompanyIndustryProductsPanelProps) {
  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <h4 className="text-sm font-bold text-white mb-3">📦 主要產品</h4>
      <div className="space-y-3">
        {products.map((item, i) => (
          <div key={i} className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">{item.name}</p>
              {item.confidence && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">{item.confidence}</span>}
              {item.lastVerified && <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">驗證 {item.lastVerified}</span>}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.description}</p>
            {item.topicFit && (
              <p className="mt-2 text-xs leading-relaxed text-violet-200/80">題材角色：{item.topicFit}</p>
            )}
            {item.whyItMatters && (
              <p className="mt-2 text-xs leading-relaxed text-cyan-200/80">為什麼重要：{item.whyItMatters}</p>
            )}
            {item.businessImpact && (
              <p className="mt-2 text-xs leading-relaxed text-amber-100/80">營運影響：{item.businessImpact}</p>
            )}
            {item.sourceLabels && item.sourceLabels.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.sourceLabels.slice(0, 2).map((label, sourceIndex) => {
                  const url = item.sourceUrls?.[sourceIndex];
                  return url ? (
                    <a key={sourceIndex} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[var(--color-text-tertiary)] hover:text-white">
                      來源：{label} <ExternalIcon />
                    </a>
                  ) : (
                    <span key={sourceIndex} className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[var(--color-text-tertiary)]">來源：{label}</span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
