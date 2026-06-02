import type { CanonicalTopic, CanonicalTopicsFile } from "./canonicalTopics";
import type { CompanySwotItem, CompanySwotKnowledge, SwotConfidence } from "./companySwot";
import { directnessLabel, type CompanyTopicRoleItem, type CompanyTopicRolesKnowledge, type Directness, type RoleConfidence, type RoleStatus } from "./companyTopicRoles";
import type { EventFocusSnapshot } from "./eventFocus";
import type { TopicMapSnapshot, TopicMapTopic, TopicOverviewEvent, TopicStage } from "./topicOverview";

export type TopicDetailStatus = "verified" | "partial" | "empty";
export type TopicDetailCoverageStatus = "verified" | "partial" | "empty";
export type TopicDetailStageStatus = "verified" | "partial" | "empty";

export interface TopicDetailSourceStatus {
  status: TopicDetailStatus;
  sources: Array<{ name: string; updatedAt?: string | null; status: TopicDetailStatus; scope: string }>;
  note: string;
}

export interface TopicDetailCompany {
  code: string;
  name: string;
  groupName: string;
  stage: TopicStage;
  relevanceLabel: string;
  directness?: Directness;
  directnessLabel?: string;
  confidence: RoleConfidence | "unverified";
  status: RoleStatus | "candidate";
  roleSummary: string;
  products: string[];
  risks: string[];
  evidenceCount: number;
  lastVerified: string | null;
}

export interface TopicDetailStage {
  stage: TopicStage;
  label: string;
  status: TopicDetailStageStatus;
  companyCount: number;
  companies: TopicDetailCompany[];
  emptyReason?: string;
}

export interface TopicDetailRisk {
  id: string;
  companyCode: string;
  companyName: string;
  category: CompanySwotItem["category"];
  statement: string;
  rationale: string;
  confidence: SwotConfidence;
  timeHorizon: CompanySwotItem["timeHorizon"];
  sourceLabel: string;
  evidenceCount: number;
  lastVerified: string | null;
}

export interface TopicDetail {
  id: string;
  title: string;
  type: CanonicalTopic["type"];
  canonicalStatus: CanonicalTopic["status"];
  status: TopicDetailStatus;
  coverageStatus: TopicDetailCoverageStatus;
  definition: string;
  whyItMatters: string;
  aliases: string[];
  include: string[];
  exclude: string[];
  activationSignals: string[];
  evidenceCount: number;
  confidence: CanonicalTopic["confidence"];
  lastVerified: string | null;
  companyCount: number;
  stages: TopicDetailStage[];
  commonRisks: TopicDetailRisk[];
  recentEvents: TopicOverviewEvent[];
  sourceStatus: TopicDetailSourceStatus;
  emptyReason?: string;
  links: {
    overview: string;
    dailyReport: string;
    industryMap: string;
  };
}

const stageOrder: TopicStage[] = ["upstream", "midstream", "downstream", "end_market"];
const stageLabels: Record<TopicStage, string> = {
  upstream: "上游",
  midstream: "中游",
  downstream: "下游",
  end_market: "終端需求",
  unknown: "待分層",
};

function normalizeStage(level: unknown): TopicStage {
  const value = String(level ?? "").trim().toLowerCase();
  if (value === "upstream") return "upstream";
  if (value === "midstream") return "midstream";
  if (value === "downstream") return "downstream";
  if (value === "end_market" || value === "end-market" || value === "endmarket") return "end_market";
  return "unknown";
}

function relevanceRank(value: unknown): number {
  const text = String(value ?? "");
  if (text === "高" || text === "high" || text === "高關聯") return 0;
  if (text === "中" || text === "medium" || text === "中關聯") return 1;
  if (text === "低" || text === "low" || text === "低關聯") return 2;
  const numeric = Number(text);
  if (Number.isFinite(numeric)) return numeric >= 80 ? 0 : numeric >= 50 ? 1 : 2;
  return 3;
}

function relevanceLabel(value: unknown): string {
  const rank = relevanceRank(value);
  if (rank === 0) return "高關聯";
  if (rank === 1) return "中關聯";
  if (rank === 2) return "低關聯";
  return "待補證";
}

function combineStatus(statuses: TopicDetailStatus[]): TopicDetailStatus {
  if (statuses.length === 0 || statuses.every((item) => item === "empty")) return "empty";
  if (statuses.every((item) => item === "verified")) return "verified";
  return "partial";
}

function roleKey(companyCode: string, topicId: string): string {
  return `${companyCode}:${topicId}`;
}

function topicIdSet(topic: CanonicalTopic): Set<string> {
  return new Set([topic.id, ...topic.legacyTopicIds].filter(Boolean));
}

function buildRoleIndex(companyTopicRoles: CompanyTopicRolesKnowledge[], acceptedTopicIds: Set<string>): Map<string, CompanyTopicRoleItem> {
  const byCompany = new Map<string, CompanyTopicRoleItem>();
  for (const knowledge of companyTopicRoles) {
    const roles = knowledge.roles
      .filter((role) => acceptedTopicIds.has(role.topicId) && role.status !== "rejected")
      .sort((a, b) => relevanceRank(a.confidence) - relevanceRank(b.confidence) || a.topicId.localeCompare(b.topicId));
    const selected = roles.find((role) => role.topicId === Array.from(acceptedTopicIds)[0]) ?? roles[0];
    if (selected) byCompany.set(roleKey(knowledge.companyCode, selected.topicId), selected);
    if (selected) byCompany.set(knowledge.companyCode, selected);
  }
  return byCompany;
}

function eventsForTopic(eventFocus: EventFocusSnapshot | null | undefined, topicId: string): TopicOverviewEvent[] {
  return (eventFocus?.items ?? [])
    .filter((item) => item.derivedTopics.some((topic) => topic.topicId === topicId))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      date: item.date,
      announcedAt: item.announcedAt,
      companyCode: item.companyCode,
      companyName: item.companyName,
      officialSubject: item.officialSubject,
      source: item.source,
      sourceUrl: item.sourceUrl,
      mappingLabel: "derived topic mapping",
      verificationNote: item.verificationNote,
    }));
}

function firstSourceLabel(item: CompanySwotItem): string {
  const first = item.evidence[0];
  return first?.publisher || first?.sourceId || "source unavailable";
}

function risksForTopic(companySwots: CompanySwotKnowledge[], acceptedTopicIds: Set<string>): TopicDetailRisk[] {
  return companySwots.flatMap((knowledge) => knowledge.items
    .filter((item) => item.status !== "rejected")
    .filter((item) => item.category === "threat" || item.category === "weakness")
    .filter((item) => item.relatedTopicIds.length === 0 || item.relatedTopicIds.some((topicId) => acceptedTopicIds.has(topicId)))
    .map((item) => ({
      id: item.id,
      companyCode: knowledge.companyCode,
      companyName: knowledge.companyName,
      category: item.category,
      statement: item.statement,
      rationale: item.rationale,
      confidence: item.confidence,
      timeHorizon: item.timeHorizon,
      sourceLabel: firstSourceLabel(item),
      evidenceCount: item.evidence.length,
      lastVerified: item.lastVerified,
    })))
    .sort((a, b) => relevanceRank(a.confidence) - relevanceRank(b.confidence) || a.companyCode.localeCompare(b.companyCode))
    .slice(0, 8);
}

function companiesByStage(mapTopic: TopicMapTopic | undefined, roleIndex: Map<string, CompanyTopicRoleItem>): Record<TopicStage, TopicDetailCompany[]> {
  const result: Record<TopicStage, TopicDetailCompany[]> = { upstream: [], midstream: [], downstream: [], end_market: [], unknown: [] };
  const seen = new Set<string>();
  for (const group of mapTopic?.groups ?? []) {
    const stage = normalizeStage(group.level);
    for (const company of group.companies ?? []) {
      if (!company?.code || seen.has(company.code)) continue;
      seen.add(company.code);
      const role = roleIndex.get(company.code);
      result[stage].push({
        code: company.code,
        name: company.name,
        groupName: group.name,
        stage,
        relevanceLabel: relevanceLabel(company.relevance),
        directness: role?.directness,
        directnessLabel: role ? directnessLabel(role.directness) : undefined,
        confidence: role?.confidence ?? "unverified",
        status: role?.status ?? "candidate",
        roleSummary: role?.roleSummary || company.analysis || company.role || "此公司在本題材的角色摘要尚未補齊 evidence-backed company-topic-role。",
        products: role?.products ?? [],
        risks: role?.risks ?? [],
        evidenceCount: role?.evidence.length ?? 0,
        lastVerified: role?.lastVerified ?? null,
      });
    }
  }
  for (const stage of Object.keys(result) as TopicStage[]) {
    result[stage].sort((a, b) => relevanceRank(a.relevanceLabel) - relevanceRank(b.relevanceLabel) || relevanceRank(a.confidence) - relevanceRank(b.confidence) || a.code.localeCompare(b.code));
  }
  return result;
}

export function buildTopicDetail(input: {
  topicId: string;
  canonicalTopics: CanonicalTopicsFile;
  topicMap: TopicMapSnapshot;
  eventFocus?: EventFocusSnapshot | null;
  companyTopicRoles?: CompanyTopicRolesKnowledge[];
  companySwots?: CompanySwotKnowledge[];
}): TopicDetail | null {
  const topic = input.canonicalTopics.topics.find((item) => item.id === input.topicId && item.status !== "deprecated" && item.status !== "rejected");
  if (!topic) return null;

  const mapTopic = (input.topicMap.topics ?? []).find((item) => item.slug === topic.id);
  const acceptedTopicIds = topicIdSet(topic);
  const roleIndex = buildRoleIndex(input.companyTopicRoles ?? [], acceptedTopicIds);
  const companies = companiesByStage(mapTopic, roleIndex);
  const stages: TopicDetailStage[] = stageOrder.map((stage) => {
    const stageCompanies = companies[stage];
    return {
      stage,
      label: stageLabels[stage],
      status: stageCompanies.length > 0 ? "verified" : "empty",
      companyCount: stageCompanies.length,
      companies: stageCompanies,
      emptyReason: stageCompanies.length === 0 ? `${stageLabels[stage]}尚無 evidence-backed 公司角色；不可用 AI 補公司。` : undefined,
    };
  });

  const companyCount = new Set(stageOrder.flatMap((stage) => companies[stage].map((company) => company.code))).size;
  const hasCanonicalEvidence = topic.evidence.length > 0 && Boolean(topic.lastVerified);
  const hasTopicMap = companyCount > 0;
  const hasRoleDetails = roleIndex.size > 0;
  const commonRisks = risksForTopic(input.companySwots ?? [], acceptedTopicIds);
  const recentEvents = eventsForTopic(input.eventFocus, topic.id);
  const coverageStatus: TopicDetailCoverageStatus = hasCanonicalEvidence && hasTopicMap ? "verified" : hasCanonicalEvidence || hasTopicMap ? "partial" : "empty";

  const sources: TopicDetailSourceStatus["sources"] = [
    { name: "canonical-topics", updatedAt: input.canonicalTopics.updatedAt, status: hasCanonicalEvidence ? "verified" : "empty", scope: "topic definition/evidence" },
    { name: input.topicMap.source ?? "canonical-topic-map", updatedAt: input.topicMap.generatedAt, status: hasTopicMap ? "verified" : "empty", scope: "value-chain stage company coverage" },
    { name: "company-topic-roles", updatedAt: input.companyTopicRoles?.map((item) => item.updatedAt).sort().at(-1), status: hasRoleDetails ? "verified" : "empty", scope: "role summary/confidence/products/risks" },
    { name: "company-swot", updatedAt: input.companySwots?.map((item) => item.updatedAt).sort().at(-1), status: commonRisks.length > 0 ? "partial" : "empty", scope: "topic-related weakness/threat extraction; not daily regenerated" },
    ...(input.eventFocus ? [{ name: input.eventFocus.source.name, updatedAt: input.eventFocus.latestDate ?? input.eventFocus.generatedAt, status: recentEvents.length > 0 ? "partial" as const : "empty" as const, scope: "official major news with derived topic mapping" }] : []),
  ];
  const sourceStatus: TopicDetailSourceStatus = {
    status: combineStatus(sources.map((source) => source.status)),
    sources,
    note: "Topic detail is derived from canonical topic definitions, checked-in value-chain roles, company-topic-role confidence, company SWOT risks, and official TWSE event rows where available. Missing stages remain empty instead of AI-filled.",
  };

  return {
    id: topic.id,
    title: topic.name,
    type: topic.type,
    canonicalStatus: topic.status,
    status: sourceStatus.status,
    coverageStatus,
    definition: topic.definition,
    whyItMatters: topic.whyItMatters,
    aliases: topic.aliases,
    include: topic.include,
    exclude: topic.exclude,
    activationSignals: topic.activationSignals,
    evidenceCount: topic.evidence.length,
    confidence: topic.confidence,
    lastVerified: topic.lastVerified,
    companyCount,
    stages,
    commonRisks,
    recentEvents,
    sourceStatus,
    emptyReason: companyCount === 0 ? "此 topic 尚無 evidence-backed value-chain 公司角色；只能觀察，不可推論成投資結論。" : undefined,
    links: {
      overview: "/topics",
      dailyReport: `/daily-report?topic=${encodeURIComponent(topic.id)}`,
      industryMap: `/?topic=${encodeURIComponent(topic.id)}`,
    },
  };
}
