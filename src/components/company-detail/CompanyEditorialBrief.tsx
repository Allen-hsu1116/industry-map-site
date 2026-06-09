import { CompanySectionInventory } from "@/components/company-detail/CompanySectionInventory";
import type { CompanyEditorialBriefViewModel } from "@/lib/view-models/companyEditorialBrief";
import { cn } from "@/lib/utils";

type CompanyEditorialBriefProps = {
  editorialBrief: CompanyEditorialBriefViewModel;
};

export function CompanyEditorialBrief({ editorialBrief }: CompanyEditorialBriefProps) {
  return (
    <section className="company-detail-editorial-brief app-panel mb-6 rounded-3xl border border-white/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200">Company Detail · Human Editorial UI</div>
          <h2 className="mt-2 text-xl font-bold text-white">Daily AI Analysis 先講人話，再看證據模組</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
            AI-derived 摘要只整理 checked-in evidence、行情與知識檔；不是買賣建議。資料不足會顯示 partial / empty，不讓網站裝懂，也不可用 AI 或短線股價硬補公司角色。
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3 text-xs text-[var(--color-text-tertiary)]">
          Sources · {editorialBrief.sources.length} modules
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {editorialBrief.items.map((item) => (
          <div key={item.label} className="taste-card rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">{item.label}</div>
            <p className={cn("mt-2 text-sm leading-relaxed", item.tone)}>{item.value}</p>
          </div>
        ))}
      </div>

      <CompanySectionInventory
        approvedSections={editorialBrief.approvedSections}
        sources={editorialBrief.sources}
      />
    </section>
  );
}
