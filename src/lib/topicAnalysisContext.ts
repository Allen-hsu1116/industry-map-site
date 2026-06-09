import type { CanonicalTopicsFile } from "./canonicalTopics";
import type { CompanyTopicRolesKnowledge } from "./companyTopicRoles";
import type { CompanySwotKnowledge } from "./companySwot";
import type { EventFocusSnapshot } from "./eventFocus";
import { normalizeResearchSignal, type ResearchSignal } from "./researchSignals";
import type { ResearchContext, SourceStatusSummary } from "./dailyAnalysisV2";

export interface TopicAnalysisCompanyRole {
  companyCode: string;
  companyName: string;
  topicId: string;
  topicName: string;
  stageId: string;
  directness: string;
  confidence: string;
  roleSummary: string;
  sourceRefs: string[];
}

export interface TopicAnalysisEvent {
  id: string;
  date: string;
  companyCode: string;
  companyName: string;
  officialSubject: string;
  mappingLabel: "derived topic mapping";
  verificationNote: string;
}

export interface TopicAnalysisRisk {
  id: string;
  companyCode: string;
  companyName: string;
  category: "weakness" | "threat";
  statement: string;
  rationale: string;
  confidence: string;
  sourceRefs: string[];
}

export interface TopicAnalysisContextInput {
  topicId: string;
  canonicalTopics?: CanonicalTopicsFile | null;
  companyTopicRoles?: CompanyTopicRolesKnowledge[];
  companySwots?: CompanySwotKnowledge[];
  eventFocus?: EventFocusSnapshot | null;
  researchSignals?: unknown[];
}

export interface TopicAnalysisContext {
  topicId: string;
  topicName: string;
  parentTopicId?: string;
  childTopicIds: string[];
  verifiedDirectCompanies: TopicAnalysisCompanyRole[];
  peripheralCompanies: TopicAnalysisCompanyRole[];
  researchDirection: ResearchContext[];
  events: TopicAnalysisEvent[];
  commonSwotRisks: TopicAnalysisRisk[];
  sourceStatus: SourceStatusSummary;
}

function sourceRefs(items: Array<{ sourceId: string }>): string[] {
  return items.map((item) => item.sourceId).filter(Boolean);
}

function acceptedTopicIds(file: CanonicalTopicsFile | null | undefined, topicId: string): Set<string> {
  const topic = file?.topics.find((item) => item.id === topicId || item.legacyTopicIds.includes(topicId));
  return new Set([topicId, topic?.id, ...(topic?.legacyTopicIds ?? [])].filter((item): item is string => Boolean(item)));
}

function directnessRank(value: string): number {
  if (value === "core" || value === "direct_enabler") return 0;
  if (value === "supplier" || value === "customer_or_channel") return 1;
  return 2;
}

function isDirect(value: string): boolean {
  return value === "core" || value === "direct_enabler" || value === "supplier" || value === "customer_or_channel";
}

function freshnessFromEventFocus(eventFocus: EventFocusSnapshot | null | undefined): SourceStatusSummary["freshness"] {
  const candidates = [eventFocus?.latestDate, eventFocus?.generatedAt].filter((item): item is string => Boolean(item));
  const newest = Math.max(...candidates.map((value) => Date.parse(value)).filter((timestamp) => Number.isFinite(timestamp)));
  if (!Number.isFinite(newest)) return "unknown";
  const ageDays = (Date.now() - newest) / (1000 * 60 * 60 * 24);
  if (ageDays <= 1) return "today";
  if (ageDays <= 7) return "this_week";
  return "stale";
}

export function buildTopicAnalysisContext(input: TopicAnalysisContextInput): TopicAnalysisContext {
  const topic = input.canonicalTopics?.topics.find((item) => item.id === input.topicId || item.legacyTopicIds.includes(input.topicId));
  const topicIds = acceptedTopicIds(input.canonicalTopics, input.topicId);

  const roles = (input.companyTopicRoles ?? []).flatMap((knowledge) => knowledge.roles
    .filter((role) => topicIds.has(role.topicId) && role.status !== "rejected")
    .map((role) => ({
      companyCode: knowledge.companyCode,
      companyName: knowledge.companyName,
      topicId: role.topicId,
      topicName: role.topicName,
      stageId: role.supplyChainStage,
      directness: role.directness,
      confidence: role.confidence,
      roleSummary: role.roleSummary,
      sourceRefs: sourceRefs(role.evidence),
    })));

  const verifiedDirectCompanies = roles
    .filter((role) => isDirect(role.directness) && role.confidence !== "low" && role.confidence !== "insufficient" && role.confidence !== "unverified")
    .sort((a, b) => directnessRank(a.directness) - directnessRank(b.directness) || a.companyCode.localeCompare(b.companyCode));
  const directCodes = new Set(verifiedDirectCompanies.map((role) => role.companyCode));
  const peripheralCompanies = roles
    .filter((role) => !directCodes.has(role.companyCode))
    .sort((a, b) => directnessRank(a.directness) - directnessRank(b.directness) || a.companyCode.localeCompare(b.companyCode));

  const normalizedSignals = (input.researchSignals ?? []).map(normalizeResearchSignal).filter((signal): signal is ResearchSignal => Boolean(signal));
  const researchDirection = normalizedSignals
    .filter((signal) => signal.relatedTopics.some((id) => topicIds.has(id)))
    .map((signal) => ({ researchSignalId: signal.id, sourceName: signal.sourceName, thesis: signal.thesis, scope: signal.scope, confidence: signal.confidence, sourceRefs: [signal.id] }));

  const events = (input.eventFocus?.items ?? [])
    .filter((item) => item.derivedTopics.some((derivedTopic) => topicIds.has(derivedTopic.topicId)))
    .map((item) => ({
      id: item.id,
      date: item.date,
      companyCode: item.companyCode,
      companyName: item.companyName,
      officialSubject: item.officialSubject,
      mappingLabel: "derived topic mapping" as const,
      verificationNote: item.verificationNote,
    }));

  const commonSwotRisks = (input.companySwots ?? []).flatMap((knowledge) => knowledge.items
    .filter((item) => item.status !== "rejected" && (item.category === "weakness" || item.category === "threat"))
    .filter((item) => item.relatedTopicIds.length === 0 || item.relatedTopicIds.some((id) => topicIds.has(id)))
    .map((item) => ({
      id: item.id,
      companyCode: knowledge.companyCode,
      companyName: knowledge.companyName,
      category: item.category as "weakness" | "threat",
      statement: item.statement,
      rationale: item.rationale,
      confidence: item.confidence,
      sourceRefs: sourceRefs(item.evidence),
    })));

  const warnings: string[] = [];
  if (verifiedDirectCompanies.length === 0) warnings.push("No verified direct companies for topic");
  if (researchDirection.length === 0) warnings.push("No research direction for topic");
  if (events.length === 0) warnings.push("No derived event mappings for topic");

  return {
    topicId: topic?.id ?? input.topicId,
    topicName: topic?.name ?? input.topicId,
    parentTopicId: topic?.parentId,
    childTopicIds: topic?.childIds ?? [],
    verifiedDirectCompanies,
    peripheralCompanies,
    researchDirection,
    events,
    commonSwotRisks,
    sourceStatus: {
      status: warnings.length === 0 ? "verified" : (roles.length > 0 || researchDirection.length > 0 || events.length > 0 ? "partial" : "insufficient"),
      freshness: freshnessFromEventFocus(input.eventFocus),
      sourceRefs: [...roles.flatMap((role) => role.sourceRefs), ...researchDirection.flatMap((item) => item.sourceRefs), ...commonSwotRisks.flatMap((item) => item.sourceRefs)],
      warnings,
    },
  };
}
