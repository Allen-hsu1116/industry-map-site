import type { TopicMapSnapshot } from "./topicOverview";

export type CompanyDatabaseStatus = "verified" | "partial" | "empty";
export type CompanyCoverageGrade = "A" | "B" | "C" | "F";
export type CompanyRoleConfidence = "high" | "medium" | "low" | "insufficient";
export type CompanyMarketFreshness = "fresh" | "stale" | "missing";

export interface CompanyDatabaseCompanyInput {
  code: string;
  name: string;
  topic_count?: number;
  topics: string[];
}

export interface CompanyDatabaseProductStats {
  updatedAt: string;
  productCount: number;
}

export interface CompanyDatabaseTopicRoleStats {
  updatedAt: string;
  verifiedCount: number;
  candidateCount: number;
  rejectedCount: number;
  highestConfidence: Exclude<CompanyRoleConfidence, "insufficient">;
}

export interface CompanyDatabaseSwotStats {
  updatedAt: string;
  verifiedCount: number;
  itemCount: number;
  categories: string[];
}

export interface CompanyDatabaseFinancialStats {
  lastUpdated?: string;
  latestPriceDate?: string;
  latestChipDate?: string;
  latestValuationDate?: string;
}

export interface CompanyDatabaseInput {
  companies: CompanyDatabaseCompanyInput[];
  topicMap: TopicMapSnapshot;
  productKnowledgeByCode: Map<string, CompanyDatabaseProductStats>;
  topicRolesByCode: Map<string, CompanyDatabaseTopicRoleStats>;
  swotByCode: Map<string, CompanyDatabaseSwotStats>;
  financialsByCode: Map<string, CompanyDatabaseFinancialStats>;
  latestMarketDate?: string;
}

export interface CompanyDatabaseFilters {
  search?: string;
  topic?: string;
  roleConfidence?: CompanyRoleConfidence;
  coverageGrade?: CompanyCoverageGrade;
  marketFreshness?: CompanyMarketFreshness;
  sourceStatus?: CompanyDatabaseStatus;
}

export interface CompanyDatabaseTopicRef {
  id: string;
  name: string;
}

export interface CompanyDatabaseSourceStatus {
  status: CompanyDatabaseStatus;
  sources: Array<{ name: string; updatedAt?: string | null; status: CompanyDatabaseStatus; scope: string }>;
  note: string;
}

export interface CompanyDatabaseRow {
  code: string;
  name: string;
  topics: CompanyDatabaseTopicRef[];
  topicCount: number;
  roleConfidence: CompanyRoleConfidence;
  roleCounts: { verified: number; candidate: number; rejected: number };
  productCount: number;
  swotItemCount: number;
  coverageGrade: CompanyCoverageGrade;
  marketFreshness: { status: CompanyMarketFreshness; latestPriceDate: string | null; latestChipDate: string | null; latestValuationDate: string | null; referenceDate: string | null };
  sourceStatus: CompanyDatabaseSourceStatus;
  links: { detail: string; industryTab: string };
  emptyReason?: string;
}

export interface CompanyDatabase {
  status: CompanyDatabaseStatus;
  generatedAt?: string;
  latestMarketDate: string | null;
  summary: {
    totalCompanies: number;
    visibleCompanies: number;
    verifiedSourceCount: number;
    partialSourceCount: number;
    emptyKnowledgeCount: number;
    freshMarketFeedCount: number;
  };
  filters: {
    topics: CompanyDatabaseTopicRef[];
    roleConfidences: CompanyRoleConfidence[];
    coverageGrades: CompanyCoverageGrade[];
    marketFreshness: CompanyMarketFreshness[];
    sourceStatuses: CompanyDatabaseStatus[];
  };
  sourceStatus: CompanyDatabaseSourceStatus;
  rows: CompanyDatabaseRow[];
}

const confidenceRank: Record<CompanyRoleConfidence, number> = { high: 0, medium: 1, low: 2, insufficient: 3 };
const gradeRank: Record<CompanyCoverageGrade, number> = { A: 0, B: 1, C: 2, F: 3 };

function latestDate(values: Array<string | undefined | null>): string | null {
  const valid = values.filter((value): value is string => Boolean(value));
  return valid.length > 0 ? valid.sort().at(-1) ?? null : null;
}

function aggregateStatus(statuses: CompanyDatabaseStatus[]): CompanyDatabaseStatus {
  if (statuses.length === 0 || statuses.every((status) => status === "empty")) return "empty";
  if (statuses.every((status) => status === "verified")) return "verified";
  return "partial";
}

function topicNameMap(topicMap: TopicMapSnapshot): Map<string, string> {
  return new Map((topicMap.topics ?? []).map((topic) => [topic.slug, topic.name]));
}

function hasCompleteSwot(swot: CompanyDatabaseSwotStats | undefined): boolean {
  if (!swot || swot.verifiedCount < 4) return false;
  const categories = new Set(swot.categories);
  return ["strength", "weakness", "opportunity", "threat"].every((category) => categories.has(category));
}

function coverageGrade(args: { product?: CompanyDatabaseProductStats; role?: CompanyDatabaseTopicRoleStats; swot?: CompanyDatabaseSwotStats }): CompanyCoverageGrade {
  const hasProduct = (args.product?.productCount ?? 0) > 0;
  const hasVerifiedRole = (args.role?.verifiedCount ?? 0) > 0;
  const completeSwot = hasCompleteSwot(args.swot);
  const hasAnyKnowledge = hasProduct || (args.role ? args.role.verifiedCount + args.role.candidateCount > 0 : false) || (args.swot?.itemCount ?? 0) > 0;
  if (hasProduct && hasVerifiedRole && completeSwot) return "A";
  if (hasVerifiedRole && (hasProduct || completeSwot)) return "B";
  if (hasAnyKnowledge) return "C";
  return "F";
}

function marketFreshness(financial: CompanyDatabaseFinancialStats | undefined, latestMarketDate: string | null): CompanyDatabaseRow["marketFreshness"] {
  const latestPriceDate = financial?.latestPriceDate ?? null;
  const latestChipDate = financial?.latestChipDate ?? null;
  const latestValuationDate = financial?.latestValuationDate ?? null;
  const hasMarketData = Boolean(latestPriceDate || latestChipDate || latestValuationDate || financial?.lastUpdated);
  const status: CompanyMarketFreshness = !hasMarketData ? "missing" : latestMarketDate && latestPriceDate === latestMarketDate ? "fresh" : "stale";
  return { status, latestPriceDate, latestChipDate, latestValuationDate, referenceDate: latestMarketDate };
}

function rowSourceStatus(args: {
  product?: CompanyDatabaseProductStats;
  role?: CompanyDatabaseTopicRoleStats;
  swot?: CompanyDatabaseSwotStats;
  financial?: CompanyDatabaseFinancialStats;
  marketFreshness: CompanyMarketFreshness;
}): CompanyDatabaseSourceStatus {
  const productStatus: CompanyDatabaseStatus = args.product ? "verified" : "empty";
  const roleStatus: CompanyDatabaseStatus = args.role ? (args.role.verifiedCount > 0 ? "verified" : "partial") : "empty";
  const swotStatus: CompanyDatabaseStatus = args.swot ? (hasCompleteSwot(args.swot) ? "verified" : "partial") : "empty";
  const marketStatus: CompanyDatabaseStatus = args.marketFreshness === "fresh" ? "verified" : args.marketFreshness === "stale" ? "partial" : "empty";
  const sources = [
    { name: "financials", updatedAt: args.financial?.lastUpdated ?? args.financial?.latestPriceDate ?? null, status: marketStatus, scope: "latest price/chip/valuation dates" },
    { name: "product-knowledge", updatedAt: args.product?.updatedAt ?? null, status: productStatus, scope: `${args.product?.productCount ?? 0} product records` },
    { name: "company-topic-roles", updatedAt: args.role?.updatedAt ?? null, status: roleStatus, scope: `${args.role?.verifiedCount ?? 0} verified / ${args.role?.candidateCount ?? 0} candidate / ${args.role?.rejectedCount ?? 0} rejected` },
    { name: "company-swot", updatedAt: args.swot?.updatedAt ?? null, status: swotStatus, scope: `${args.swot?.itemCount ?? 0} SWOT items; not daily price-derived` },
  ];
  return {
    status: aggregateStatus(sources.map((source) => source.status)),
    sources,
    note: "Company database rows are derived from checked-in financials, product-knowledge, company-topic-roles, and company-swot JSON; missing data stays empty instead of AI-filled.",
  };
}

function matchesFilters(row: CompanyDatabaseRow, filters: CompanyDatabaseFilters): boolean {
  const query = filters.search?.trim().toLowerCase();
  if (query && !(`${row.code} ${row.name} ${row.topics.map((topic) => `${topic.id} ${topic.name}`).join(" ")}`.toLowerCase().includes(query))) return false;
  if (filters.topic && !row.topics.some((topic) => topic.id === filters.topic)) return false;
  if (filters.roleConfidence && row.roleConfidence !== filters.roleConfidence) return false;
  if (filters.coverageGrade && row.coverageGrade !== filters.coverageGrade) return false;
  if (filters.marketFreshness && row.marketFreshness.status !== filters.marketFreshness) return false;
  if (filters.sourceStatus && row.sourceStatus.status !== filters.sourceStatus) return false;
  return true;
}

export function buildCompanyDatabase(input: CompanyDatabaseInput, filters: CompanyDatabaseFilters = {}): CompanyDatabase {
  const names = topicNameMap(input.topicMap);
  const latestMarketDate = input.latestMarketDate ?? latestDate([...input.financialsByCode.values()].flatMap((financial) => [financial.latestPriceDate, financial.latestChipDate, financial.latestValuationDate, financial.lastUpdated]));
  const allRows = input.companies.map((company): CompanyDatabaseRow => {
    const product = input.productKnowledgeByCode.get(company.code);
    const role = input.topicRolesByCode.get(company.code);
    const swot = input.swotByCode.get(company.code);
    const financial = input.financialsByCode.get(company.code);
    const freshness = marketFreshness(financial, latestMarketDate);
    const sourceStatus = rowSourceStatus({ product, role, swot, financial, marketFreshness: freshness.status });
    const grade = coverageGrade({ product, role, swot });
    const roleConfidence = role?.highestConfidence ?? "insufficient";
    const topics = [...new Set(company.topics)].map((id) => ({ id, name: names.get(id) ?? id })).sort((a, b) => a.name.localeCompare(b.name, "zh-TW") || a.id.localeCompare(b.id));
    return {
      code: company.code,
      name: company.name,
      topics,
      topicCount: topics.length > 0 ? topics.length : (company.topic_count ?? 0),
      roleConfidence,
      roleCounts: { verified: role?.verifiedCount ?? 0, candidate: role?.candidateCount ?? 0, rejected: role?.rejectedCount ?? 0 },
      productCount: product?.productCount ?? 0,
      swotItemCount: swot?.itemCount ?? 0,
      coverageGrade: grade,
      marketFreshness: freshness,
      sourceStatus,
      links: { detail: `/?company=${encodeURIComponent(company.code)}`, industryTab: `/?company=${encodeURIComponent(company.code)}&tab=industry` },
      ...(sourceStatus.status === "empty" ? { emptyReason: "尚無可驗證 market/knowledge 資料；只能列入公司清單觀察，不可裝成完整分析。" } : {}),
    };
  });

  const rows = allRows
    .filter((row) => matchesFilters(row, filters))
    .sort((a, b) => gradeRank[a.coverageGrade] - gradeRank[b.coverageGrade] || confidenceRank[a.roleConfidence] - confidenceRank[b.roleConfidence] || b.topicCount - a.topicCount || a.code.localeCompare(b.code));

  const topicOptions = Array.from(new Map(allRows.flatMap((row) => row.topics).map((topic) => [topic.id, topic])).values()).sort((a, b) => a.id.localeCompare(b.id));
  const verifiedSourceCount = allRows.filter((row) => row.sourceStatus.status === "verified").length;
  const partialSourceCount = allRows.filter((row) => row.sourceStatus.status === "partial").length;
  const emptyKnowledgeCount = allRows.filter((row) => row.coverageGrade === "F").length;
  const freshMarketFeedCount = allRows.filter((row) => row.marketFreshness.status === "fresh").length;

  const sourceStatus = {
    status: aggregateStatus(allRows.map((row) => row.sourceStatus.status)),
    sources: [
      { name: "financials", updatedAt: latestDate([...input.financialsByCode.values()].map((financial) => financial.lastUpdated ?? financial.latestPriceDate)), status: input.financialsByCode.size === input.companies.length ? "verified" as const : input.financialsByCode.size > 0 ? "partial" as const : "empty" as const, scope: `${input.financialsByCode.size} / ${input.companies.length} companies with market/chip data` },
      { name: "product-knowledge", updatedAt: latestDate([...input.productKnowledgeByCode.values()].map((item) => item.updatedAt)), status: input.productKnowledgeByCode.size === input.companies.length ? "verified" as const : input.productKnowledgeByCode.size > 0 ? "partial" as const : "empty" as const, scope: `${input.productKnowledgeByCode.size} / ${input.companies.length} companies with product files` },
      { name: "company-topic-roles", updatedAt: latestDate([...input.topicRolesByCode.values()].map((item) => item.updatedAt)), status: input.topicRolesByCode.size === input.companies.length ? "verified" as const : input.topicRolesByCode.size > 0 ? "partial" as const : "empty" as const, scope: `${input.topicRolesByCode.size} / ${input.companies.length} companies with role files` },
      { name: "company-swot", updatedAt: latestDate([...input.swotByCode.values()].map((item) => item.updatedAt)), status: input.swotByCode.size === input.companies.length ? "verified" as const : input.swotByCode.size > 0 ? "partial" as const : "empty" as const, scope: `${input.swotByCode.size} / ${input.companies.length} companies with SWOT files` },
    ],
    note: "Dedicated company database aggregates checked-in data only; source status and freshness are derived from actual module presence.",
  } satisfies CompanyDatabaseSourceStatus;

  return {
    status: allRows.length === 0 ? "empty" : sourceStatus.status,
    generatedAt: input.topicMap.generatedAt,
    latestMarketDate,
    summary: { totalCompanies: input.companies.length, visibleCompanies: rows.length, verifiedSourceCount, partialSourceCount, emptyKnowledgeCount, freshMarketFeedCount },
    filters: {
      topics: topicOptions,
      roleConfidences: ["high", "medium", "low", "insufficient"],
      coverageGrades: ["A", "B", "C", "F"],
      marketFreshness: ["fresh", "stale", "missing"],
      sourceStatuses: ["verified", "partial", "empty"],
    },
    sourceStatus,
    rows,
  };
}
