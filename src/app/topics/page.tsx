import Link from "next/link";
import canonicalTopicsData from "../../../public/data/canonical-topics.json";
import topicMapData from "../../../public/data/canonical-topic-map.json";
import eventFocusData from "../../../public/data/event-focus.json";
import type { CanonicalTopicsFile } from "@/lib/canonicalTopics";
import type { EventFocusSnapshot } from "@/lib/eventFocus";
import { buildTopicOverview, type TopicCoverageStatus, type TopicStage } from "@/lib/topicOverview";

const overview = buildTopicOverview({
  canonicalTopics: canonicalTopicsData as unknown as CanonicalTopicsFile,
  topicMap: topicMapData,
  eventFocus: eventFocusData as unknown as EventFocusSnapshot,
});

const stageLabels: Record<TopicStage, string> = {
  upstream: "上游",
  midstream: "中游",
  downstream: "下游",
  end_market: "終端需求",
  unknown: "待分層",
};

const coverageLabels: Record<TopicCoverageStatus, string> = {
  verified: "verified coverage",
  partial: "partial coverage",
  empty: "empty coverage",
};

const coverageClass: Record<TopicCoverageStatus, string> = {
  verified: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  partial: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  empty: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

function formatDate(value?: string | null): string {
  if (!value) return "尚無驗證日";
  return value.slice(0, 10);
}

export default function TopicsPage() {
  return (
    <main className="taste-shell app-page">
      <div className="app-container">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="mb-3 inline-block text-sm app-link">← 返回首頁產業地圖</Link>
            <h1 className="text-3xl font-bold text-white">題材總覽</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              以 canonical-topic 定義作為題材名稱與邊界，topic-map 只提供公司角色覆蓋；重大訊息保留官方主旨，題材標籤為派生 mapping，不當成官方分類。蛇蛇幫你把假裝懂的部分關起來了，省得網站胡說八道。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 app-panel-soft p-4 text-sm text-slate-300">
            <div className="font-semibold text-white">Source status: {overview.sourceStatus.status}</div>
            <div className="mt-1 text-xs text-slate-500">Generated {formatDate(overview.generatedAt)}</div>
          </div>
        </div>

        <section className="mb-8 grid gap-3 md:grid-cols-3">
          {overview.sourceStatus.sources.map((source) => (
            <div key={`${source.name}-${source.scope}`} className="rounded-2xl border border-white/10 app-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">{source.name}</div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300">{source.status}</span>
              </div>
              <div className="mt-2 text-xs leading-relaxed text-slate-500">{source.scope}</div>
              <div className="mt-2 text-xs text-slate-400">更新：{formatDate(source.updatedAt)}</div>
            </div>
          ))}
        </section>

        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">共 <span className="font-semibold text-white">{overview.cards.length}</span> 個 canonical topics</p>
          <Link href="/daily-report" className="rounded-xl app-primary-action px-4 py-2 text-sm font-medium">查看 Daily Report</Link>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {overview.cards.map((card) => (
            <article key={card.id} className="flex min-h-full flex-col rounded-3xl border border-white/10 app-panel p-5 shadow-xl shadow-black/10">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{card.type} · {card.confidence}</div>
                  <h2 className="mt-1 text-lg font-bold leading-snug text-white">{card.title}</h2>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${coverageClass[card.coverageStatus]}`}>
                  {coverageLabels[card.coverageStatus]}
                </span>
              </div>

              <p className="line-clamp-3 text-sm leading-relaxed text-slate-300">{card.definition}</p>
              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-500">{card.whyItMatters}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-white/[0.04] p-3">
                  <div className="text-xl font-bold text-white">{card.companyCount}</div>
                  <div className="text-[11px] text-slate-500">公司</div>
                </div>
                <div className="rounded-2xl bg-white/[0.04] p-3">
                  <div className="text-xl font-bold text-white">{card.recentEvents.length}</div>
                  <div className="text-[11px] text-slate-500">官方事件</div>
                </div>
                <div className="rounded-2xl bg-white/[0.04] p-3">
                  <div className="text-xl font-bold text-white">{card.evidenceCount}</div>
                  <div className="text-[11px] text-slate-500">Evidence</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(card.stageCounts).filter(([, count]) => count > 0).map(([stage, count]) => (
                  <span key={stage} className="rounded-full border border-white/10 app-panel-soft px-2.5 py-1 text-xs text-slate-300">
                    {stageLabels[stage as TopicStage]} {count}
                  </span>
                ))}
                {card.childTopics.length > 0 && (
                  <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-xs text-cyan-200">
                    已合併 {card.childTopics.length} 個子題材
                  </span>
                )}
                {card.companyCount === 0 && <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-1 text-xs text-slate-400">尚無公司角色覆蓋</span>}
              </div>

              {card.childTopics.length > 0 && (
                <div className="mt-3 rounded-2xl border border-sky-400/15 bg-sky-400/[0.05] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">Clustered child topics</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {card.childTopics.map((child) => (
                      <Link key={`${card.id}-${child.id}`} href={`/topics/${child.id}`} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-slate-300 hover:border-sky-400/40 hover:text-white">
                        {child.title} · {child.companyCount}家公司
                      </Link>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">首頁與題材總覽以 parent cluster 顯示，避免同一產業（例如記憶體）拆成多張重複主題；子題材細節仍保留在題材細節頁。</p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">代表公司 / 角色比較</div>
                {card.representativeCompanies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {card.representativeCompanies.map((company) => (
                      <Link key={`${card.id}-${company.code}`} href={`/?company=${company.code}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300 hover:border-sky-400/40 hover:text-white">
                        <span className="font-mono text-cyan-200">{company.code}</span> {company.name} · {company.relevanceLabel}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-3 text-xs leading-relaxed text-amber-100/80">{card.emptyReason}</p>
                )}
              </div>

              {card.recentEvents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">近期重大訊息</div>
                  {card.recentEvents.map((event) => (
                    <div key={event.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-[11px] text-slate-500">{event.date} · {event.companyCode} {event.companyName} · {event.mappingLabel}</div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-300">{event.officialSubject}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 text-xs text-slate-500">
                驗證：{formatDate(card.lastVerified)} · 覆蓋更新：{formatDate(card.updatedAt)} · coverageStatus: {card.coverageStatus}
              </div>

              <div className="mt-auto flex gap-2 pt-5">
                <Link href={card.links.detail} className="flex-1 rounded-xl app-primary-action px-3 py-2 text-center text-sm font-medium">題材細節</Link>
                <Link href={card.links.industryMap} className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-sm text-slate-200 hover:border-white/20">產業地圖</Link>
                <Link href={`/daily-report?topic=${card.id}`} className="flex-1 rounded-xl app-primary-action px-3 py-2 text-center text-sm font-medium">Daily</Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
