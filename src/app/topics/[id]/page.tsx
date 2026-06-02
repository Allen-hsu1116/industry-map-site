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

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = buildTopicDetail({
    topicId: id,
    canonicalTopics,
    topicMap,
    eventFocus,
    companyTopicRoles: loadCompanyTopicRoles(),
    companySwots: loadCompanySwots(),
  });

  if (!detail) notFound();

  return (
    <main className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              <Link href="/topics" className="text-indigo-300 hover:text-indigo-200">← 回題材總覽</Link>
              <span className="text-slate-600">/</span>
              <Link href={detail.links.dailyReport} className="text-indigo-300 hover:text-indigo-200">Daily analysis filter</Link>
              <span className="text-slate-600">/</span>
              <Link href={detail.links.industryMap} className="text-indigo-300 hover:text-indigo-200">產業地圖 filter</Link>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{detail.type} · {detail.confidence}</div>
            <h1 className="mt-2 text-3xl font-bold text-white">{detail.title}</h1>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">{detail.definition}</p>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-500">{detail.whyItMatters}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <div className="font-semibold text-white">sourceStatus: {detail.sourceStatus.status}</div>
            <div className="mt-1 text-xs text-slate-500">驗證：{formatDate(detail.lastVerified)} · 公司 {detail.companyCount}</div>
            <span className={`mt-3 inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${coverageClass[detail.coverageStatus]}`}>{detail.coverageStatus} coverage</span>
          </div>
        </div>

        <section className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {detail.sourceStatus.sources.map((source) => (
            <div key={`${source.name}-${source.scope}`} className="rounded-2xl border border-white/10 bg-[#12122a] p-4">
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
          <div className="rounded-3xl border border-white/10 bg-[#12122a] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Value-chain stage view</h2>
                <p className="mt-1 text-xs text-slate-500">固定順序：上游 → 中游 → 下游 → 終端需求；缺資料只顯示 empty，不補假公司。</p>
              </div>
            </div>
            <div className="space-y-4">
              {detail.stages.map((stage) => (
                <section key={stage.stage} className={`rounded-2xl border p-4 ${stageStatusClass[stage.status]}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white">{stageLabels[stage.stage]}</h3>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs">{stage.status} · {stage.companyCount} companies</span>
                  </div>
                  {stage.companies.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {stage.companies.map((company) => (
                        <Link key={`${stage.stage}-${company.code}`} href={`/?company=${company.code}&topic=${detail.id}`} className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-indigo-400/40">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-mono text-sm text-indigo-200">{company.code}</div>
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
                    <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-relaxed text-slate-400">{stage.emptyReason}</p>
                  )}
                </section>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-[#12122a] p-5">
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

            <section className="rounded-3xl border border-white/10 bg-[#12122a] p-5">
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

        {detail.recentEvents.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-[#12122a] p-5">
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
