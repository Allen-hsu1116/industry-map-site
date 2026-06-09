export const researchSignalSourceTypes = ["broker_report", "industry_research", "company_report", "news", "official", "internal_knowledge"] as const;
export type ResearchSignalSourceType = typeof researchSignalSourceTypes[number];
export const researchSignalAccessTypes = ["public", "licensed", "manual_note", "unavailable_link_only"] as const;
export type ResearchSignalAccess = typeof researchSignalAccessTypes[number];
export const researchSignalScopes = ["market", "topic", "company", "product", "supply_demand", "pricing_cycle"] as const;
export type ResearchSignalScope = typeof researchSignalScopes[number];
export type ResearchSignalConfidence = "high" | "medium" | "low" | "insufficient";

export interface ResearchSignal {
  id: string;
  sourceName: string;
  sourceType: ResearchSignalSourceType;
  publishedAt: string;
  retrievedAt: string;
  title: string;
  url?: string;
  access: ResearchSignalAccess;
  scope: ResearchSignalScope;
  relatedTopics: string[];
  relatedCompanies: string[];
  thesis: string;
  evidenceQuotes: string[];
  confidence: ResearchSignalConfidence;
  analystNotes: string[];
  reviewTriggers: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isNonEmptyString).map((item) => item.trim()) : [];
}

function normalizeOptionalUrl(value: unknown, access: ResearchSignalAccess): string | undefined | null {
  if (value === undefined || value === null || value === "") {
    return access === "manual_note" || access === "licensed" ? undefined : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.startsWith("https://") || trimmed.startsWith("http://") ? trimmed : null;
}

export function normalizeResearchSignal(value: unknown): ResearchSignal | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.sourceName) || !isNonEmptyString(value.publishedAt) || !isNonEmptyString(value.retrievedAt) || !isNonEmptyString(value.title) || !isNonEmptyString(value.thesis)) return null;
  if (!isOneOf(value.sourceType, researchSignalSourceTypes) || !isOneOf(value.access, researchSignalAccessTypes) || !isOneOf(value.scope, researchSignalScopes)) return null;
  if (!isOneOf(value.confidence, ["high", "medium", "low", "insufficient"] as const)) return null;
  const url = normalizeOptionalUrl(value.url, value.access);
  if (url === null) return null;
  return {
    id: value.id.trim(),
    sourceName: value.sourceName.trim(),
    sourceType: value.sourceType,
    publishedAt: value.publishedAt.trim(),
    retrievedAt: value.retrievedAt.trim(),
    title: value.title.trim(),
    url,
    access: value.access,
    scope: value.scope,
    relatedTopics: asStringArray(value.relatedTopics),
    relatedCompanies: asStringArray(value.relatedCompanies),
    thesis: value.thesis.trim(),
    evidenceQuotes: asStringArray(value.evidenceQuotes),
    confidence: value.confidence,
    analystNotes: asStringArray(value.analystNotes),
    reviewTriggers: asStringArray(value.reviewTriggers),
  };
}

export function researchSignalCreatesVerifiedCompanyRole(_signal: ResearchSignal): false {
  return false;
}
