export type SwotCategory = "strength" | "weakness" | "opportunity" | "threat";
export type SwotConfidence = "high" | "medium" | "low" | "insufficient" | "unverified";
export type SwotStatus = "verified" | "candidate" | "rejected";

export interface CompanySwotEvidence {
  sourceId: string;
  publisher: string;
  title: string;
  url: string;
  claim: string;
  quote?: string;
}

export interface CompanySwotItem {
  id: string;
  category: SwotCategory;
  statement: string;
  rationale: string;
  timeHorizon: "structural" | "medium_term" | "event_driven";
  relatedTopicIds: string[];
  evidence: CompanySwotEvidence[];
  confidence: SwotConfidence;
  lastVerified: string | null;
  status: SwotStatus;
}

export interface CompanySwotKnowledge {
  schemaVersion: 1;
  companyCode: string;
  companyName: string;
  updatedAt: string;
  items: CompanySwotItem[];
}

export type GroupedSwot = Record<"strengths" | "weaknesses" | "opportunities" | "threats", CompanySwotItem[]>;

const categories = new Set<SwotCategory>(["strength", "weakness", "opportunity", "threat"]);
const horizons = new Set<CompanySwotItem["timeHorizon"]>(["structural", "medium_term", "event_driven"]);
const confidences = new Set<SwotConfidence>(["high", "medium", "low", "insufficient", "unverified"]);
const statuses = new Set<SwotStatus>(["verified", "candidate", "rejected"]);

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter((item): item is string => Boolean(item)) : [];
}

function normalizeEvidence(value: unknown): CompanySwotEvidence[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const sourceId = asString(record.sourceId);
    const publisher = asString(record.publisher);
    const title = asString(record.title);
    const url = asString(record.url);
    const claim = asString(record.claim);
    if (!sourceId || !publisher || !title || !url || !claim) return [];
    const quote = asString(record.quote);
    return [{ sourceId, publisher, title, url, claim, ...(quote ? { quote } : {}) }];
  });
}

export function normalizeCompanySwot(raw: unknown): CompanySwotKnowledge | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (record.schemaVersion !== 1) return null;
  const companyCode = asString(record.companyCode);
  const companyName = asString(record.companyName);
  const updatedAt = asString(record.updatedAt);
  if (!companyCode || !companyName || !updatedAt || !Array.isArray(record.items)) return null;

  const items = record.items.flatMap((rawItem): CompanySwotItem[] => {
    if (!rawItem || typeof rawItem !== "object") return [];
    const item = rawItem as Record<string, unknown>;
    const id = asString(item.id);
    const category = asString(item.category) as SwotCategory | undefined;
    const statement = asString(item.statement);
    const rationale = asString(item.rationale);
    const timeHorizon = asString(item.timeHorizon) as CompanySwotItem["timeHorizon"] | undefined;
    const confidence = asString(item.confidence) as SwotConfidence | undefined;
    const status = asString(item.status) as SwotStatus | undefined;
    if (!id || !category || !categories.has(category) || !statement || !rationale) return [];
    if (!timeHorizon || !horizons.has(timeHorizon) || !confidence || !confidences.has(confidence) || !status || !statuses.has(status)) return [];
    return [{
      id,
      category,
      statement,
      rationale,
      timeHorizon,
      relatedTopicIds: asStringArray(item.relatedTopicIds),
      evidence: normalizeEvidence(item.evidence),
      confidence,
      lastVerified: asString(item.lastVerified) ?? null,
      status,
    }];
  }).sort((a, b) => `${a.category}:${a.id}`.localeCompare(`${b.category}:${b.id}`));

  return { schemaVersion: 1, companyCode, companyName, updatedAt, items };
}

export function groupCompanySwot(knowledge: CompanySwotKnowledge | null | undefined): GroupedSwot {
  const grouped: GroupedSwot = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  for (const item of knowledge?.items ?? []) {
    if (item.status === "rejected") continue;
    if (item.category === "strength") grouped.strengths.push(item);
    if (item.category === "weakness") grouped.weaknesses.push(item);
    if (item.category === "opportunity") grouped.opportunities.push(item);
    if (item.category === "threat") grouped.threats.push(item);
  }
  return grouped;
}

export function selectTopicSwotItems(grouped: GroupedSwot, key: keyof GroupedSwot, topicIds: string[]): CompanySwotItem[] {
  const normalizedTopicIds = new Set(topicIds.filter(Boolean));
  const items = grouped[key];
  const selected = items.filter((item) => (
    item.relatedTopicIds.length === 0 || item.relatedTopicIds.some((topicId) => normalizedTopicIds.has(topicId))
  ));
  return selected.length > 0 ? selected : items;
}
