import type { CanonicalTopic, CanonicalTopicsFile } from "./canonicalTopics";
import type { EventFocusItem, EventFocusSnapshot } from "./eventFocus";

export type TopicOverviewStatus = "verified" | "partial" | "empty";
export type TopicCoverageStatus = "verified" | "partial" | "empty";
export type TopicStage = "upstream" | "midstream" | "downstream" | "end_market" | "unknown";

export interface TopicMapCompany {
  code: string;
  name: string;
  role?: string;
  relevance?: string | number;
  analysis?: string;
}

export interface TopicMapGroup {
  name: string;
  level?: string;
  companies: TopicMapCompany[];
}

export interface TopicMapTopic {
  slug: string;
  name: string;
  description?: string;
  total?: number;
  groups?: TopicMapGroup[];
}

export interface TopicMapSnapshot {
  generatedAt?: string;
  source?: string;
  topics?: TopicMapTopic[];
}

export interface TopicOverviewCompany {
  code: string;
  name: string;
  role?: string;
  relevanceLabel: string;
  stage: TopicStage;
  groupName: string;
}

export interface TopicOverviewEvent {
  id: string;
  date: string;
  announcedAt: string;
  companyCode: string;
  companyName: string;
  officialSubject: string;
  source: EventFocusItem["source"];
  sourceUrl?: string;
  mappingLabel: "derived topic mapping";
  verificationNote: string;
}

export interface TopicOverviewSourceStatus {
  status: TopicOverviewStatus;
  sources: Array<{ name: string; updatedAt?: string; status: TopicOverviewStatus; scope: string }>;
  note: string;
}

export interface TopicOverviewCard {
  id: string;
  title: string;
  uiLabel?: string;
  type: CanonicalTopic["type"];
  status: CanonicalTopic["status"];
  definition: string;
  whyItMatters: string;
  aliases: string[];
  companyCount: number;
  stageCounts: Record<TopicStage, number>;
  representativeCompanies: TopicOverviewCompany[];
  recentEvents: TopicOverviewEvent[];
  activationSignals: string[];
  evidenceCount: number;
  confidence: CanonicalTopic["confidence"];
  coverageStatus: TopicCoverageStatus;
  lastVerified: string | null;
  updatedAt?: string;
  emptyReason?: string;
  sourceStatus: TopicOverviewSourceStatus;
  links: {
    detail: string;
    industryMap: string;
    dailyReport: string;
  };
}

export interface TopicOverview {
  status: TopicOverviewStatus;
  generatedAt?: string;
  sourceStatus: TopicOverviewSourceStatus;
  cards: TopicOverviewCard[];
}

const stageOrder: TopicStage[] = ["upstream", "midstream", "downstream", "end_market", "unknown"];

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
  if (text === "高" || text === "high") return 0;
  if (text === "中" || text === "medium") return 1;
  if (text === "低" || text === "low") return 2;
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

function sourceStatus(statuses: TopicOverviewStatus[], sources: TopicOverviewSourceStatus["sources"], note: string): TopicOverviewSourceStatus {
  const status: TopicOverviewStatus = statuses.every((item) => item === "empty") ? "empty" : statuses.every((item) => item === "verified") ? "verified" : "partial";
  return { status, sources, note };
}

function eventsForTopic(eventFocus: EventFocusSnapshot | null | undefined, topicId: string): TopicOverviewEvent[] {
  return (eventFocus?.items ?? [])
    .filter((item) => item.derivedTopics.some((topic) => topic.topicId === topicId))
    .slice(0, 3)
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

function companiesForTopic(mapTopic: TopicMapTopic | undefined): { companies: TopicOverviewCompany[]; stageCounts: Record<TopicStage, number> } {
  const stageCounts: Record<TopicStage, number> = { upstream: 0, midstream: 0, downstream: 0, end_market: 0, unknown: 0 };
  const seen = new Set<string>();
  const companies: TopicOverviewCompany[] = [];

  for (const group of mapTopic?.groups ?? []) {
    const stage = normalizeStage(group.level);
    for (const company of group.companies ?? []) {
      if (!company?.code || seen.has(company.code)) continue;
      seen.add(company.code);
      stageCounts[stage] += 1;
      companies.push({
        code: company.code,
        name: company.name,
        role: company.role,
        relevanceLabel: relevanceLabel(company.relevance),
        stage,
        groupName: group.name,
      });
    }
  }

  companies.sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage) || relevanceRank(a.relevanceLabel) - relevanceRank(b.relevanceLabel) || a.code.localeCompare(b.code));
  return { companies, stageCounts };
}

export function buildTopicOverview(input: {
  canonicalTopics: CanonicalTopicsFile;
  topicMap: TopicMapSnapshot;
  eventFocus?: EventFocusSnapshot | null;
}): TopicOverview {
  const topicMapBySlug = new Map((input.topicMap.topics ?? []).map((topic) => [topic.slug, topic]));
  const cards = input.canonicalTopics.topics
    .filter((topic) => topic.status !== "deprecated" && topic.status !== "rejected")
    .map((topic): TopicOverviewCard => {
      const mapTopic = topicMapBySlug.get(topic.id);
      const { companies, stageCounts } = companiesForTopic(mapTopic);
      const recentEvents = eventsForTopic(input.eventFocus, topic.id);
      const hasCanonicalEvidence = topic.evidence.length > 0 && Boolean(topic.lastVerified);
      const hasTopicMap = companies.length > 0;
      const coverageStatus: TopicCoverageStatus = hasCanonicalEvidence && hasTopicMap ? "verified" : hasCanonicalEvidence || hasTopicMap ? "partial" : "empty";
      const sourceStatuses: TopicOverviewStatus[] = [hasCanonicalEvidence ? "verified" : "empty", hasTopicMap ? "verified" : "empty"];
      if (input.eventFocus) sourceStatuses.push(recentEvents.length > 0 ? "partial" : "empty");
      const cardSourceStatus = sourceStatus(sourceStatuses, [
        { name: "canonical-topics", updatedAt: input.canonicalTopics.updatedAt, status: hasCanonicalEvidence ? "verified" : "empty", scope: "topic definition/evidence" },
        { name: input.topicMap.source ?? "canonical-topic-map", updatedAt: input.topicMap.generatedAt, status: hasTopicMap ? "verified" : "empty", scope: "company role coverage" },
        ...(input.eventFocus ? [{ name: input.eventFocus.source.name, updatedAt: input.eventFocus.latestDate ?? input.eventFocus.generatedAt, status: recentEvents.length > 0 ? "partial" as const : "empty" as const, scope: "official major news with derived topic mapping" }] : []),
      ], "canonical-topic defines labels/evidence; topic-map supplies checked-in company roles; event-focus preserves official subjects with derived topic mapping.");

      return {
        id: topic.id,
        title: topic.name,
        uiLabel: mapTopic?.name,
        type: topic.type,
        status: topic.status,
        definition: topic.definition,
        whyItMatters: topic.whyItMatters,
        aliases: topic.aliases,
        companyCount: companies.length || mapTopic?.total || 0,
        stageCounts,
        representativeCompanies: companies.slice(0, 6),
        recentEvents,
        activationSignals: topic.activationSignals,
        evidenceCount: topic.evidence.length,
        confidence: topic.confidence,
        coverageStatus,
        lastVerified: topic.lastVerified,
        updatedAt: input.topicMap.generatedAt ?? input.canonicalTopics.updatedAt,
        emptyReason: coverageStatus === "empty" ? "此 canonical topic 尚無 evidence-backed topic-map 公司角色；不可用 AI 補成既定事實。" : undefined,
        sourceStatus: cardSourceStatus,
        links: {
          detail: `/topics/${encodeURIComponent(topic.id)}`,
          industryMap: `/?topic=${encodeURIComponent(topic.id)}`,
          dailyReport: `/daily-report?topic=${encodeURIComponent(topic.id)}`,
        },
      };
    })
    .sort((a, b) => b.companyCount - a.companyCount || a.title.localeCompare(b.title, "zh-TW"));

  const overviewSourceStatus = sourceStatus([
    input.canonicalTopics.topics.length > 0 ? "verified" : "empty",
    (input.topicMap.topics?.length ?? 0) > 0 ? "verified" : "empty",
    input.eventFocus ? "partial" : "empty",
  ], [
    { name: "canonical-topics", updatedAt: input.canonicalTopics.updatedAt, status: input.canonicalTopics.topics.length > 0 ? "verified" : "empty", scope: "topic definition/evidence" },
    { name: input.topicMap.source ?? "canonical-topic-map", updatedAt: input.topicMap.generatedAt, status: (input.topicMap.topics?.length ?? 0) > 0 ? "verified" : "empty", scope: "company role coverage" },
    ...(input.eventFocus ? [{ name: input.eventFocus.source.name, updatedAt: input.eventFocus.latestDate ?? input.eventFocus.generatedAt, status: "partial" as const, scope: input.eventFocus.source.scope }] : []),
  ], "Topic overview is derived from canonical-topic definitions, checked-in topic-map role coverage, and official TWSE event-focus rows where available.");

  return {
    status: cards.length === 0 ? "empty" : overviewSourceStatus.status,
    generatedAt: input.topicMap.generatedAt ?? input.canonicalTopics.updatedAt,
    sourceStatus: overviewSourceStatus,
    cards,
  };
}
