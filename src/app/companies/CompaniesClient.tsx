"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CompanyCoverageGrade, CompanyDatabase, CompanyDatabaseFilters, CompanyDatabaseRow, CompanyDatabaseStatus, CompanyMarketFreshness, CompanyRoleConfidence } from "@/lib/companyDatabase";

const statusClass: Record<CompanyDatabaseStatus, string> = {
  verified: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  partial: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  empty: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

const freshnessClass: Record<CompanyMarketFreshness, string> = {
  fresh: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  stale: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  missing: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

const gradeClass: Record<CompanyCoverageGrade, string> = {
  A: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  B: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  C: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  F: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

function formatDate(value?: string | null): string {
  if (!value) return "尚無資料";
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  return value.slice(0, 10);
}

function filtersFromSearchParams(searchParams: URLSearchParams): CompanyDatabaseFilters {
  return {
    search: searchParams.get("q") ?? undefined,
    topic: searchParams.get("topic") ?? undefined,
    roleConfidence: (searchParams.get("confidence") || undefined) as CompanyRoleConfidence | undefined,
    coverageGrade: (searchParams.get("grade") || undefined) as CompanyCoverageGrade | undefined,
    marketFreshness: (searchParams.get("freshness") || undefined) as CompanyMarketFreshness | undefined,
    sourceStatus: (searchParams.get("status") || undefined) as CompanyDatabaseStatus | undefined,
  };
}

function matchesFilters(row: CompanyDatabaseRow, filters: CompanyDatabaseFilters): boolean {
  const q = filters.search?.trim().toLowerCase();
  if (q && ![
    row.code,
    row.name,
    ...row.topics.flatMap((topic) => [topic.id, topic.name]),
  ].some((value) => value.toLowerCase().includes(q))) return false;
  if (filters.topic && !row.topics.some((topic) => topic.id === filters.topic || topic.name === filters.topic)) return false;
  if (filters.roleConfidence && row.roleConfidence !== filters.roleConfidence) return false;
  if (filters.coverageGrade && row.coverageGrade !== filters.coverageGrade) return false;
  if (filters.marketFreshness && row.marketFreshness.status !== filters.marketFreshness) return false;
  if (filters.sourceStatus && row.sourceStatus.status !== filters.sourceStatus) return false;
  return true;
}

function filterHref(next: Partial<Record<"topic" | "confidence" | "grade" | "freshness" | "status" | "q", string | undefined>>, current: CompanyDatabaseFilters): string {
  const params = new URLSearchParams();
  const merged = {
    q: current.search,
    topic: current.topic,
    confidence: current.roleConfidence,
    grade: current.coverageGrade,
    freshness: current.marketFreshness,
    status: current.sourceStatus,
    ...next,
  };
  for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
  const query = params.toString();
  return query ? `/companies?${query}` : "/companies";
}

function visibleSummary(rows: CompanyDatabaseRow[]) {
  return {
    visibleCompanies: rows.length,
    verifiedSourceCount: rows.filter((row) => row.sourceStatus.status === "verified").length,
    emptyKnowledgeCount: rows.filter((row) => row.coverageGrade === "F" || row.roleConfidence === "insufficient").length,
    freshMarketFeedCount: rows.filter((row) => row.marketFreshness.status === "fresh").length,
  };
}

export function CompaniesClient({ database }: { database: CompanyDatabase }) {
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams);
  const rows = database.rows.filter((row) => matchesFilters(row, filters));
  const summary = visibleSummary(rows);

  return (
    <main className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/" className="mb-3 inline-block text-sm text-indigo-300 hover:text-indigo-200">← 返回首頁產業地圖</Link>
            <h1 className="text-3xl font-bold text-white">公司資料庫</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              Dedicated searchable/filterable database：每一列都從 checked-in financials、product-knowledge、company-topic-roles、company-swot 推導；缺資料就標 partial/empty，不讓網站裝懂。這是 aistockmap-style company database 的 Slice 5，先把證據語義打穩。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <div className="font-semibold text-white">Source status: {database.sourceStatus.status}</div>
            <div className="mt-1 text-xs text-slate-500">Latest market date {formatDate(database.latestMarketDate)}</div>
          </div>
        </div>

        <section className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {database.sourceStatus.sources.map((source) => (
            <div key={`${source.name}-${source.scope}`} className="rounded-2xl border border-white/10 bg-[#12122a] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">{source.name}</div>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusClass[source.status]}`}>{source.status}</span>
              </div>
              <div className="mt-2 text-xs leading-relaxed text-slate-500">{source.scope}</div>
              <div className="mt-2 text-xs text-slate-400">更新：{formatDate(source.updatedAt)}</div>
            </div>
          ))}
        </section>

        <section className="mb-6 grid gap-3 md:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-[#12122a] p-4"><div className="text-2xl font-bold text-white">{database.summary.totalCompanies}</div><div className="text-xs text-slate-500">總公司</div></div>
          <div className="rounded-2xl border border-white/10 bg-[#12122a] p-4"><div className="text-2xl font-bold text-white">{summary.visibleCompanies}</div><div className="text-xs text-slate-500">目前篩選</div></div>
          <div className="rounded-2xl border border-white/10 bg-[#12122a] p-4"><div className="text-2xl font-bold text-emerald-200">{summary.freshMarketFeedCount}</div><div className="text-xs text-slate-500">fresh market feed</div></div>
          <div className="rounded-2xl border border-white/10 bg-[#12122a] p-4"><div className="text-2xl font-bold text-cyan-200">{summary.verifiedSourceCount}</div><div className="text-xs text-slate-500">verified rows</div></div>
          <div className="rounded-2xl border border-white/10 bg-[#12122a] p-4"><div className="text-2xl font-bold text-slate-300">{summary.emptyKnowledgeCount}</div><div className="text-xs text-slate-500">F / insufficient</div></div>
        </section>

        <form action="/companies" className="mb-6 rounded-3xl border border-white/10 bg-[#12122a] p-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <label className="md:col-span-2 xl:col-span-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Search
              <input name="q" defaultValue={filters.search ?? ""} placeholder="公司、代碼、題材" className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-indigo-400/50" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Topic
              <select name="topic" defaultValue={filters.topic ?? ""} className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/80 px-3 text-sm text-white"><option value="">全部</option>{database.filters.topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Confidence
              <select name="confidence" defaultValue={filters.roleConfidence ?? ""} className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/80 px-3 text-sm text-white"><option value="">全部</option>{database.filters.roleConfidences.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Grade
              <select name="grade" defaultValue={filters.coverageGrade ?? ""} className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/80 px-3 text-sm text-white"><option value="">全部</option>{database.filters.coverageGrades.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Freshness
              <select name="freshness" defaultValue={filters.marketFreshness ?? ""} className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/80 px-3 text-sm text-white"><option value="">全部</option>{database.filters.marketFreshness.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button className="rounded-xl border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm font-medium text-indigo-200 hover:bg-indigo-400/15">套用篩選</button>
            <Link href="/companies" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 hover:border-white/20">清除</Link>
            <div className="ml-auto flex flex-wrap gap-2 text-xs">
              {database.filters.sourceStatuses.map((status) => <Link key={status} href={filterHref({ status: filters.sourceStatus === status ? undefined : status }, filters)} className={`rounded-full border px-2.5 py-1 ${filters.sourceStatus === status ? statusClass[status] : "border-white/10 bg-white/[0.03] text-slate-400"}`}>source {status}</Link>)}
            </div>
          </div>
        </form>

        <section className="space-y-3">
          {rows.length === 0 ? (
            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.06] p-8 text-center text-amber-100/90">沒有符合條件的公司；請放寬篩選。不是沒資料就亂編，這點蛇蛇很堅持。</div>
          ) : rows.map((row) => (
            <article key={row.code} className="rounded-3xl border border-white/10 bg-[#12122a] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={row.links.detail} className="font-mono text-lg font-bold text-indigo-200 hover:text-indigo-100">{row.code}</Link>
                    <h2 className="text-lg font-bold text-white">{row.name}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${gradeClass[row.coverageGrade]}`}>Coverage {row.coverageGrade}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass[row.sourceStatus.status]}`}>{row.sourceStatus.status}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${freshnessClass[row.marketFreshness.status]}`}>{row.marketFreshness.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.topics.slice(0, 6).map((topic) => <Link key={`${row.code}-${topic.id}`} href={filterHref({ topic: topic.id }, filters)} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 hover:border-emerald-400/30 hover:text-emerald-100">{topic.name}</Link>)}
                    {row.topics.length > 6 && <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-500">+{row.topics.length - 6}</span>}
                  </div>
                  {row.emptyReason && <p className="mt-3 rounded-xl border border-slate-500/20 bg-slate-500/10 p-3 text-xs leading-relaxed text-slate-300">{row.emptyReason}</p>}
                </div>
                <div className="grid min-w-[320px] grid-cols-2 gap-2 text-xs md:grid-cols-4 lg:max-w-xl">
                  <div className="rounded-2xl bg-black/20 p-3"><div className="text-slate-500">Role confidence</div><div className="mt-1 font-semibold text-white">{row.roleConfidence}</div><div className="mt-1 text-slate-500">{row.roleCounts.verified}V / {row.roleCounts.candidate}C</div></div>
                  <div className="rounded-2xl bg-black/20 p-3"><div className="text-slate-500">Products</div><div className="mt-1 font-semibold text-white">{row.productCount}</div><div className="mt-1 text-slate-500">evidence-backed</div></div>
                  <div className="rounded-2xl bg-black/20 p-3"><div className="text-slate-500">SWOT</div><div className="mt-1 font-semibold text-white">{row.swotItemCount}</div><div className="mt-1 text-slate-500">not daily-derived</div></div>
                  <div className="rounded-2xl bg-black/20 p-3"><div className="text-slate-500">Market feed</div><div className="mt-1 font-semibold text-white">{formatDate(row.marketFreshness.latestPriceDate)}</div><div className="mt-1 text-slate-500">chip {formatDate(row.marketFreshness.latestChipDate)}</div></div>
                </div>
              </div>
              <details className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400">
                <summary className="cursor-pointer font-semibold text-slate-200">來源細節 / source rail</summary>
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  {row.sourceStatus.sources.map((source) => <div key={`${row.code}-${source.name}`} className="rounded-xl bg-white/[0.03] p-3"><div className="flex justify-between gap-2"><span className="font-semibold text-white">{source.name}</span><span className={statusClass[source.status].split(" ").slice(-1).join(" ")}>{source.status}</span></div><div className="mt-1 text-slate-500">{source.scope}</div><div className="mt-1 text-slate-400">{formatDate(source.updatedAt)}</div></div>)}
                </div>
              </details>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
