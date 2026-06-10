import { cn } from "@/lib/utils";
import type { CompanyIndustryInsights } from "@/lib/companyIndustryInsights";

export interface CompanyIndustryKnowledgeOverviewProps {
  industryInsights: CompanyIndustryInsights;
}

function ExternalIcon() {
  return (
    <svg className="ml-1 inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

export function CompanyIndustryKnowledgeOverview({ industryInsights }: CompanyIndustryKnowledgeOverviewProps) {
  const swotItemCount = Object.values(industryInsights.panels.swot.groups).flat().length;

  return (
    <>
      <div className="rounded-2xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/[0.08] via-sky-500/[0.04] to-emerald-500/[0.04] p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-200">Industrial analysis knowledge base</div>
            <h3 className="mt-1 text-lg font-bold text-white">產品 / 題材角色 / SWOT 產業知識總覽</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              這一區只呈現 checked-in evidence-backed 知識；資料不足會標成 partial/empty，不用 AI 或短線股價硬補結論。
            </p>
          </div>
          <span className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
            industryInsights.status === "verified" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" :
              industryInsights.status === "partial" ? "border-amber-300/20 bg-amber-300/10 text-amber-100" :
                "border-white/[0.06] bg-white/[0.03] text-[var(--color-text-tertiary)]"
          )}>
            {industryInsights.status}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {industryInsights.sourceStatus.map((source) => (
            <div key={source.module} className="rounded-xl border border-white/[0.06] bg-black/[0.14] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">{source.label}</span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  source.status === "verified" ? "bg-emerald-400/10 text-emerald-200" :
                    source.status === "partial" ? "bg-amber-300/10 text-amber-100" :
                      "bg-white/[0.04] text-[var(--color-text-tertiary)]"
                )}>{source.status}</span>
              </div>
              <div className="text-sm font-semibold text-white">{source.scope}</div>
              <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">最近驗證：{source.latestVerifiedAt ?? "尚無"}</div>
              <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">來源：{source.source}</div>
              {source.warning && <p className="mt-2 text-xs leading-relaxed text-amber-100/85">{source.warning}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white">📦 產品知識</h4>
            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
              {industryInsights.panels.products.items.length} products
            </span>
          </div>
          {industryInsights.panels.products.items.length > 0 ? (
            <div className="space-y-3">
              {industryInsights.panels.products.items.slice(0, 4).map((item) => (
                <div key={`${item.name}-${item.category}`} className="rounded-xl border border-white/[0.05] bg-black/[0.10] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-200">{item.confidence}</span>
                    <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">{item.lastVerified}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">{item.description}</p>
                  {item.sourceLabels[0] && (
                    <a href={item.sourceUrls[0]} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-[11px] text-emerald-100/80 hover:text-white">
                      來源：{item.sourceLabels[0]} <ExternalIcon />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-amber-100/85">{industryInsights.panels.products.emptyReason}</p>
          )}
        </div>

        <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white">🧭 題材角色</h4>
            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
              {industryInsights.panels.topicRoles.counts.verified} verified / {industryInsights.panels.topicRoles.counts.candidate} candidate
            </span>
          </div>
          {industryInsights.panels.topicRoles.items.length > 0 ? (
            <div className="space-y-3">
              {industryInsights.panels.topicRoles.items.slice(0, 4).map((item) => (
                <div key={item.topicId} className="rounded-xl border border-white/[0.05] bg-black/[0.10] p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-white">{item.topicName}</div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", item.status === "verified" ? "bg-cyan-300/10 text-cyan-100" : "bg-amber-300/10 text-amber-100")}>{item.status}</span>
                    <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">{item.confidence}</span>
                  </div>
                  <div className="text-[11px] text-cyan-100/80">{item.directnessLabel} · {item.supplyChainStage}</div>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">{item.roleSummary}</p>
                  {item.sourceLabels[0] && <div className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">來源：{item.sourceLabels[0]}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-amber-100/85">{industryInsights.panels.topicRoles.emptyReason}</p>
          )}
        </div>

        <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white">🏛️ SWOT</h4>
            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
              {swotItemCount} items
            </span>
          </div>
          {industryInsights.panels.swot.warning && (
            <p className="mb-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-xs leading-relaxed text-amber-100/85">{industryInsights.panels.swot.warning}</p>
          )}
          {swotItemCount > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {[
                ["S", "strengths", "text-emerald-200"],
                ["W", "weaknesses", "text-rose-200"],
                ["O", "opportunities", "text-indigo-200"],
                ["T", "threats", "text-amber-200"],
              ].map(([label, key, tone]) => {
                const items = industryInsights.panels.swot.groups[key as keyof typeof industryInsights.panels.swot.groups];
                return (
                  <div key={key} className="rounded-xl border border-white/[0.05] bg-black/[0.10] p-3">
                    <div className={cn("mb-2 text-xs font-bold", tone)}>{label} · {items.length}</div>
                    {items[0] ? (
                      <p className="line-clamp-4 text-xs leading-relaxed text-[var(--color-text-secondary)]">{items[0].statement}</p>
                    ) : (
                      <p className="text-xs text-[var(--color-text-tertiary)]">尚未驗證</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-amber-100/85">{industryInsights.panels.swot.emptyReason}</p>
          )}
        </div>
      </div>
    </>
  );
}
