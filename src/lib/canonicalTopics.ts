export type CanonicalTopicType = "theme" | "technology" | "product" | "process" | "supply_chain_segment" | "end_market";
export type CanonicalTopicStatus = "active" | "watchlist" | "legacy_candidate" | "deprecated" | "rejected";
export type CanonicalTopicConfidence = "high" | "medium" | "low" | "insufficient" | "unverified";

export interface TopicEvidence {
  sourceId: string;
  publisher?: string;
  title?: string;
  url?: string;
  claim: string;
}

export interface CanonicalTopic {
  id: string;
  name: string;
  type: CanonicalTopicType;
  status: CanonicalTopicStatus;
  definition: string;
  whyItMatters: string;
  aliases: string[];
  parentId?: string;
  childIds: string[];
  legacyTopicIds: string[];
  include: string[];
  exclude: string[];
  activationSignals: string[];
  evidence: TopicEvidence[];
  confidence: CanonicalTopicConfidence;
  lastVerified: string | null;
}

export interface CanonicalTopicsFile {
  schemaVersion: 1;
  updatedAt: string;
  topicDefinition: {
    rule: string;
    notTopic: string[];
  };
  topics: CanonicalTopic[];
}

export interface LegacyTopicRef {
  slug?: unknown;
  name?: unknown;
}

export interface TopicCoverageReport {
  canonicalTopics: number;
  activeTopics: number;
  watchlistTopics: number;
  legacyTopics: number;
  mappedLegacyTopics: number;
  unmappedLegacyTopics: string[];
  duplicateLegacyMappings: Array<{ legacyTopicId: string; canonicalTopicIds: string[] }>;
}

const topicTypes = new Set<CanonicalTopicType>(["theme", "technology", "product", "process", "supply_chain_segment", "end_market"]);
const topicStatuses = new Set<CanonicalTopicStatus>(["active", "watchlist", "legacy_candidate", "deprecated", "rejected"]);
const topicConfidences = new Set<CanonicalTopicConfidence>(["high", "medium", "low", "insufficient", "unverified"]);

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : [];
}

function asEvidence(value: unknown): TopicEvidence[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
    if (!obj) return [];
    const sourceId = asString(obj.sourceId);
    const claim = asString(obj.claim);
    if (!sourceId || !claim) return [];
    return [{
      sourceId,
      publisher: asString(obj.publisher) || undefined,
      title: asString(obj.title) || undefined,
      url: asString(obj.url) || undefined,
      claim,
    }];
  });
}

function rankStatus(status: CanonicalTopicStatus): number {
  if (status === "active") return 0;
  if (status === "watchlist") return 1;
  if (status === "legacy_candidate") return 2;
  if (status === "deprecated") return 3;
  return 4;
}

export function normalizeCanonicalTopics(raw: unknown): CanonicalTopicsFile | null {
  const file = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!file || file.schemaVersion !== 1) return null;

  const updatedAt = asString(file.updatedAt);
  const rawDefinition = file.topicDefinition && typeof file.topicDefinition === "object" ? (file.topicDefinition as Record<string, unknown>) : {};
  const topicDefinition = {
    rule: asString(rawDefinition.rule),
    notTopic: asStringArray(rawDefinition.notTopic),
  };

  const topics = (Array.isArray(file.topics) ? file.topics : []).flatMap((item): CanonicalTopic[] => {
    const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
    if (!obj) return [];
    const id = asString(obj.id);
    const name = asString(obj.name);
    const type = asString(obj.type) as CanonicalTopicType;
    const status = asString(obj.status) as CanonicalTopicStatus;
    const confidence = asString(obj.confidence) as CanonicalTopicConfidence;
    const definition = asString(obj.definition);
    const whyItMatters = asString(obj.whyItMatters);
    if (!id || !name || !definition || !whyItMatters) return [];
    if (!topicTypes.has(type) || !topicStatuses.has(status) || !topicConfidences.has(confidence)) return [];

    return [{
      id,
      name,
      type,
      status,
      definition,
      whyItMatters,
      aliases: asStringArray(obj.aliases),
      parentId: asString(obj.parentId) || undefined,
      childIds: asStringArray(obj.childIds),
      legacyTopicIds: asStringArray(obj.legacyTopicIds),
      include: asStringArray(obj.include),
      exclude: asStringArray(obj.exclude),
      activationSignals: asStringArray(obj.activationSignals),
      evidence: asEvidence(obj.evidence),
      confidence,
      lastVerified: asString(obj.lastVerified) || null,
    }];
  }).sort((a, b) => rankStatus(a.status) - rankStatus(b.status) || a.id.localeCompare(b.id));

  return {
    schemaVersion: 1,
    updatedAt,
    topicDefinition,
    topics,
  };
}

export function buildTopicCoverageReport(legacyTopics: LegacyTopicRef[], canonicalTopics: CanonicalTopic[]): TopicCoverageReport {
  const legacyIds = new Set(legacyTopics.map((topic) => asString(topic.slug)).filter(Boolean));
  const legacyToCanonical = new Map<string, string[]>();

  for (const topic of canonicalTopics) {
    for (const legacyTopicId of topic.legacyTopicIds) {
      if (!legacyTopicId) continue;
      const existing = legacyToCanonical.get(legacyTopicId) ?? [];
      existing.push(topic.id);
      legacyToCanonical.set(legacyTopicId, existing);
    }
  }

  const mappedLegacyTopics = Array.from(legacyIds).filter((id) => legacyToCanonical.has(id));
  const unmappedLegacyTopics = Array.from(legacyIds).filter((id) => !legacyToCanonical.has(id)).sort();
  const duplicateLegacyMappings = Array.from(legacyToCanonical.entries())
    .filter(([legacyTopicId, canonicalTopicIds]) => legacyIds.has(legacyTopicId) && canonicalTopicIds.length > 1)
    .map(([legacyTopicId, canonicalTopicIds]) => ({ legacyTopicId, canonicalTopicIds: canonicalTopicIds.sort() }))
    .sort((a, b) => a.legacyTopicId.localeCompare(b.legacyTopicId));

  return {
    canonicalTopics: canonicalTopics.length,
    activeTopics: canonicalTopics.filter((topic) => topic.status === "active").length,
    watchlistTopics: canonicalTopics.filter((topic) => topic.status === "watchlist").length,
    legacyTopics: legacyIds.size,
    mappedLegacyTopics: mappedLegacyTopics.length,
    unmappedLegacyTopics,
    duplicateLegacyMappings,
  };
}
