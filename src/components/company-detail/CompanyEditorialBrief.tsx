import { cn } from "@/lib/utils";

export type CompanyEditorialBriefSource = {
  label: string;
  status: string;
  freshness: string;
  source: string;
};

export type CompanyEditorialBriefViewModel = {
  items: Array<{ label: string; value: string; tone: string }>;
  approvedSections: string[];
  sources: CompanyEditorialBriefSource[];
};

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

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/[0.06] bg-black/15 p-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Goal 7 approved sections</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {editorialBrief.approvedSections.map((section) => (
              <span key={section} className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1 text-[11px] font-semibold text-slate-200">
                {section}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-black/15 p-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Sources</div>
          <div className="mt-3 space-y-2">
            {editorialBrief.sources.slice(0, 6).map((source) => (
              <div key={`${source.label}-${source.source}`} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-300">{source.label}</span>
                <span className="text-right text-[var(--color-text-tertiary)]">{source.status} · {source.freshness}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
