import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import canonicalTopicsData from "../../../../public/data/canonical-topics.json";
import eventFocusData from "../../../../public/data/event-focus.json";
import topicMapData from "../../../../public/data/canonical-topic-map.json";
import type { CanonicalTopicsFile } from "@/lib/canonicalTopics";
import { normalizeCompanySwot, type CompanySwotKnowledge } from "@/lib/companySwot";
import { normalizeCompanyTopicRoles, type CompanyTopicRolesKnowledge } from "@/lib/companyTopicRoles";
import type { EventFocusSnapshot } from "@/lib/eventFocus";
import { buildTopicDetail, type TopicDetailCoverageStatus, type TopicDetailStageStatus } from "@/lib/topicDetail";
import type { TopicMapSnapshot, TopicStage } from "@/lib/topicOverview";

const canonicalTopics = canonicalTopicsData as unknown as CanonicalTopicsFile;
const topicMap = topicMapData as unknown as TopicMapSnapshot;
const eventFocus = eventFocusData as unknown as EventFocusSnapshot;

export const dynamicParams = false;

const REPRESENTATIVE_COMPANY_LIMIT = 6;

const stageLabels: Record<TopicStage, string> = {
  upstream: "上游",
  midstream: "中游",
  downstream: "下游",
  end_market: "終端需求",
  unknown: "待分層",
};

const coverageClass: Record<TopicDetailCoverageStatus, string> = {
  verified: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  partial: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  empty: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

const stageStatusClass: Record<TopicDetailStageStatus, string> = {
  verified: "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100",
  partial: "border-amber-400/20 bg-amber-400/[0.06] text-amber-100",
  empty: "border-slate-500/20 bg-slate-500/[0.06] text-slate-300",
};

function formatDate(value?: string | null): string {
  if (!value) return "尚無驗證日";
  return value.slice(0, 10);
}

function loadCompanyTopicRoles(): CompanyTopicRolesKnowledge[] {
  const directory = path.join(process.cwd(), "public", "data", "company-topic-roles");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
      try {
        const raw = JSON.parse(readFileSync(path.join(directory, file), "utf8"));
        const normalized = normalizeCompanyTopicRoles(raw);
        return normalized ? [normalized] : [];
      } catch {
        return [];
      }
    });
}

function loadCompanySwots(): CompanySwotKnowledge[] {
  const directory = path.join(process.cwd(), "public", "data", "company-swot");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
      try {
        const raw = JSON.parse(readFileSync(path.join(directory, file), "utf8"));
        const normalized = normalizeCompanySwot(raw);
        return normalized ? [normalized] : [];
      } catch {
        return [];
      }
    });
}

export function generateStaticParams() {
  return canonicalTopics.topics
    .filter((topic) => topic.status !== "deprecated" && topic.status !== "rejected")
    .map((topic) => ({ id: topic.id }));
}

export default async function TopicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ stage?: string; view?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const detail = buildTopicDetail({
    topicId: id,
    canonicalTopics,
    topicMap,
    eventFocus,
    companyTopicRoles: loadCompanyTopicRoles(),
    companySwots: loadCompanySwots(),
  });

  if (!detail) notFound();

  const selectedStage = detail.stages.find((stage) => stage.stage === query?.stage) ?? detail.stages.find((stage) => stage.companies.length > 0) ?? detail.stages[0];
  const selectedStageCompanies = selectedStage?.companies ?? [];
  const showAllTable = query?.view === "all" && selectedStageCompanies.length > 0;

  return (
    <main className="taste-shell app-page">
      <div className="app-container">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              <Link href="/topics" className="app-link">← 回題材總覽</Link>
              <span className="text-slate-600">/</span>
              <Link href={detail.links.dailyReport} className="app-link">Daily analysis filter</Link>
              <span className="text-slate-600">/</span>
              <Link href={detail.links.industryMap} className="app-link">產業地圖 filter</Link>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{detail.type} · {detail.confidence}</div>
            <h1 className="mt-2 text-3xl font-bold text-white">{detail.title}</h1>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">{detail.definition}</p>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-500">{detail.whyItMatters}</p>
          </div>
          <div className="rounded-2xl border border-white/10 app-panel-soft p-4 text-sm text-slate-300">
            <div className="font-semibold text-white">sourceStatus: {detail.sourceStatus.status}</div>
            <div className="mt-1 text-xs text-slate-500">驗證：{formatDate(detail.lastVerified)} · 公司 {detail.companyCount}</div>
            <span className={`mt-3 inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${coverageClass[detail.coverageStatus]}`}>{detail.coverageStatus} coverage</span>
          </div>
        </div>

        <section className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {detail.sourceStatus.sources.map((source) => (
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

        {detail.emptyReason && (
          <div className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-relaxed text-amber-100/90">
            {detail.emptyReason}
          </div>
        )}

        <section className="mb-8 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-white/10 app-panel p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Value-chain stage view</h2>
                <p className="mt-1 text-xs text-slate-500">固定順序：上游 → 中游 → 下游 → 終端需求；缺資料只顯示 empty，不補假公司。</p>
              </div>
            </div>
            <div className="space-y-4">
              {detail.stages.map((stage) => {
                const representativeCompanies = stage.companies.slice(0, REPRESENTATIVE_COMPANY_LIMIT);
                return (
                  <section key={stage.stage} className={`rounded-2xl border p-4 ${stageStatusClass[stage.status]}`}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-white">{stageLabels[stage.stage]}</h3>
                        <div className="mt-1 text-[11px] text-slate-500">代表公司優先顯示 verified / partial 角色；完整清單用 URL state 開啟。</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs">{stage.status} · {stage.companyCount} companies</span>
                        {stage.companies.length > REPRESENTATIVE_COMPANY_LIMIT && (
                          <Link href={`/topics/${detail.id}?stage=${stage.stage}&view=all`} className="app-link rounded-full border border-sky-400/30 px-2.5 py-1 text-xs">show all</Link>
                        )}
                      </div>
                    </div>
                    {stage.companies.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {representativeCompanies.map((company) => (
                          <Link key={`${stage.stage}-${company.code}`} href={`/?company=${company.code}&topic=${detail.id}`} className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-sky-400/40">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-mono text-sm text-cyan-200">{company.code}</div>
                                <div className="mt-1 text-base font-semibold text-white">{company.name}</div>
                              </div>
                              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300">{company.confidence}</span>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">{company.groupName} · {company.directnessLabel ?? company.relevanceLabel} · {company.status}</div>
                            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-300">{company.roleSummary}</p>
                            {company.products.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {company.products.slice(0, 3).map((product) => <span key={product} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-slate-300">{product}</span>)}
                              </div>
                            )}
                            <div className="mt-3 text-[11px] text-slate-500">evidence {company.evidenceCount} · lastVerified {formatDate(company.lastVerified)}</div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-relaxed text-slate-400"><span className="mr-2 rounded-full border border-white/10 px-2 py-0.5 text-[11px]">narrative-only</span>{stage.emptyReason}</p>
                    )}
                  </section>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/10 app-panel p-5">
              <h2 className="text-lg font-bold text-white">題材邊界</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/80">Include</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-400">{detail.include.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-300/80">Exclude</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-400">{detail.exclude.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 app-panel p-5">
              <h2 className="text-lg font-bold text-white">Common risks / SWOT</h2>
              <p className="mt-1 text-xs text-slate-500">來自 company-swot 的 weakness/threat；不是每日短線股價反應。</p>
              <div className="mt-4 space-y-3">
                {detail.commonRisks.length > 0 ? detail.commonRisks.map((risk) => (
                  <div key={`${risk.companyCode}-${risk.id}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-[11px] text-slate-500">{risk.companyCode} {risk.companyName} · {risk.category} · {risk.confidence}</div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{risk.statement}</p>
                    <div className="mt-2 text-[11px] text-slate-500">source {risk.sourceLabel} · evidence {risk.evidenceCount} · {formatDate(risk.lastVerified)}</div>
                  </div>
                )) : <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-400">尚無 topic-related SWOT weakness/threat；不可用每日行情補 SWOT。</p>}
              </div>
            </section>
          </aside>
        </section>

        {showAllTable && selectedStage && (
          <section className="industry-chain-show-all-table mb-8 rounded-3xl border border-white/10 app-panel p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">完整清單 · {stageLabels[selectedStage.stage]}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">URL state：stage={selectedStage.stage} & view=all。此表只展開已存在的 checked-in company-role / topic-map 資料，不補假公司。</p>
              </div>
              <Link href={`/topics/${detail.id}`} className="app-link text-sm">回代表公司 view</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm text-slate-300">
                <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr className="border-b border-white/10">
                    <th className="py-3 pr-4">公司</th>
                    <th className="py-3 pr-4">角色</th>
                    <th className="py-3 pr-4">信心</th>
                    <th className="py-3 pr-4">來源狀態</th>
                    <th className="py-3 pr-4">驗證日</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStageCompanies.map((company) => (
                    <tr key={`${selectedStage.stage}-all-${company.code}`} className="border-b border-white/10 last:border-0">
                      <td className="py-3 pr-4"><Link href={`/?company=${company.code}&topic=${detail.id}`} className="app-link font-mono">{company.code} {company.name}</Link></td>
                      <td className="py-3 pr-4">{company.roleSummary}</td>
                      <td className="py-3 pr-4">{company.confidence}</td>
                      <td className="py-3 pr-4">{company.status} · evidence {company.evidenceCount}</td>
                      <td className="py-3 pr-4">{formatDate(company.lastVerified)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {detail.recentEvents.length > 0 && (
          <section className="rounded-3xl border border-white/10 app-panel p-5">
            <h2 className="text-xl font-bold text-white">近期官方重大訊息</h2>
            <p className="mt-1 text-xs text-slate-500">官方主旨原文保留；topic tag 是 derived topic mapping，不是 TWSE 官方分類。</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {detail.recentEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] text-slate-500">{event.date} · {event.companyCode} {event.companyName} · {event.mappingLabel}</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{event.officialSubject}</p>
                  <div className="mt-2 text-[11px] text-slate-500">{event.verificationNote}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
