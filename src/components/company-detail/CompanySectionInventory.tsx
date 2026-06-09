import type { CompanyEditorialBriefSource } from "@/lib/view-models/companyEditorialBrief";

export type CompanySectionInventoryProps = {
  approvedSections: string[];
  sources: CompanyEditorialBriefSource[];
};

export function CompanySectionInventory({ approvedSections, sources }: CompanySectionInventoryProps) {
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-white/[0.06] bg-black/15 p-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Goal 7 approved sections</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {approvedSections.map((section) => (
            <span key={section} className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1 text-[11px] font-semibold text-slate-200">
              {section}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-black/15 p-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Sources</div>
        <div className="mt-3 space-y-2">
          {sources.slice(0, 6).map((source) => (
            <div key={`${source.label}-${source.source}`} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">{source.label}</span>
              <span className="text-right text-[var(--color-text-tertiary)]">{source.status} · {source.freshness}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
