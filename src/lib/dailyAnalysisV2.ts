export const dailyAnalysisV2Grades = ["A", "B", "C", "D", "F"] as const;
export type DailyAnalysisV2Grade = typeof dailyAnalysisV2Grades[number];

export const dailyAnalysisV2Tiers = ["top_candidate", "strong_watchlist", "observation", "weak_signal", "insufficient_data"] as const;
export type DailyAnalysisV2Tier = typeof dailyAnalysisV2Tiers[number];

export const analysisReasonDomains = ["technical", "chip", "event", "industry", "product_role", "swot", "research", "knowledge_rule"] as const;
export type AnalysisReasonDomain = typeof analysisReasonDomains[number];

export type AnalysisPolarity = "bullish" | "bearish" | "neutral" | "risk";
export type DerivedBy = "rule" | "ai_summary" | "human_curated";
export type ContextConfidence = "high" | "medium" | "low" | "insufficient";
export type SourceStatus = "verified" | "partial" | "insufficient";
export type SourceFreshness = "today" | "this_week" | "stale" | "unknown";

export interface DailyAnalysisV2Score {
  total: number;
  technical: number;
  chip: number;
  event: number;
  industryTopic: number;
  productRole: number;
  swotRisk: number;
  researchDirection: number;
  knowledgeRuleFit: number;
  dataQuality: number;
}

export interface AnalysisReason {
  domain: AnalysisReasonDomain;
  title: string;
  detail: string;
  weight: number;
  polarity: AnalysisPolarity;
  sourceRefs: string[];
  derivedBy: DerivedBy;
}

export interface AnalysisRisk {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  sourceRefs: string[];
}

export interface ProductContext {
  productName: string;
  whatItIs: string;
  whyItMatters: string;
  sourceRefs: string[];
  confidence: ContextConfidence;
  lastVerified?: string;
}

export interface TopicRoleContext {
  topicId: string;
  topicName: string;
  role: string;
  stageId?: string;
  directness: "direct" | "indirect" | "peripheral" | "narrative_only";
  confidence: ContextConfidence;
  sourceRefs: string[];
  lastVerified?: string;
}

export interface SwotContext {
  category: "strength" | "weakness" | "opportunity" | "threat";
  statement: string;
  rationale: string;
  confidence: ContextConfidence;
  sourceRefs: string[];
  lastVerified?: string;
}

export interface ResearchContext {
  researchSignalId: string;
  sourceName: string;
  thesis: string;
  scope: string;
  confidence: ContextConfidence;
  sourceRefs: string[];
}

export interface KnowledgeRuleContext {
  ruleId: string;
  title: string;
  category: string;
  implication: string;
  sourceRefs: string[];
}

export interface SourceStatusSummary {
  status: SourceStatus;
  freshness: SourceFreshness;
  sourceRefs: string[];
  warnings: string[];
}

export interface DailyAnalysisV2 {
  date: string;
  companyCode: string;
  companyName: string;
  grade: DailyAnalysisV2Grade;
  tier: DailyAnalysisV2Tier;
  headline: string;
  summary: string;
  score: DailyAnalysisV2Score;
  reasons: AnalysisReason[];
  risks: AnalysisRisk[];
  productContext: ProductContext[];
  topicRoleContext: TopicRoleContext[];
  swotContext: SwotContext[];
  researchContext: ResearchContext[];
  knowledgeRulesApplied: KnowledgeRuleContext[];
  nextWatchPoints: string[];
  sourceStatus: SourceStatusSummary;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isNonEmptyString).map((item) => item.trim()) : [];
}

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

function numberField(record: Record<string, unknown>, key: keyof DailyAnalysisV2Score): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeScore(value: unknown): DailyAnalysisV2Score | null {
  if (!isRecord(value)) return null;
  const keys: Array<keyof DailyAnalysisV2Score> = [
    "total",
    "technical",
    "chip",
    "event",
    "industryTopic",
    "productRole",
    "swotRisk",
    "researchDirection",
    "knowledgeRuleFit",
    "dataQuality",
  ];
  const entries = keys.map((key) => [key, numberField(value, key)] as const);
  if (entries.some(([, item]) => item === null)) return null;
  return Object.fromEntries(entries) as unknown as DailyAnalysisV2Score;
}

function normalizeReason(value: unknown): AnalysisReason | null {
  if (!isRecord(value)) return null;
  if (!isOneOf(value.domain, analysisReasonDomains)) return null;
  if (!isNonEmptyString(value.title) || !isNonEmptyString(value.detail)) return null;
  if (typeof value.weight !== "number" || !Number.isFinite(value.weight)) return null;
  if (!isOneOf(value.polarity, ["bullish", "bearish", "neutral", "risk"] as const)) return null;
  if (!isOneOf(value.derivedBy, ["rule", "ai_summary", "human_curated"] as const)) return null;
  return {
    domain: value.domain,
    title: value.title.trim(),
    detail: value.detail.trim(),
    weight: value.weight,
    polarity: value.polarity,
    sourceRefs: asStringArray(value.sourceRefs),
    derivedBy: value.derivedBy,
  };
}

function normalizeRisk(value: unknown): AnalysisRisk | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.title) || !isNonEmptyString(value.detail)) return null;
  if (!isOneOf(value.severity, ["high", "medium", "low"] as const)) return null;
  return { title: value.title.trim(), detail: value.detail.trim(), severity: value.severity, sourceRefs: asStringArray(value.sourceRefs) };
}

function normalizeProductContext(value: unknown): ProductContext | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.productName) || !isNonEmptyString(value.whatItIs) || !isNonEmptyString(value.whyItMatters)) return null;
  if (!isOneOf(value.confidence, ["high", "medium", "low", "insufficient"] as const)) return null;
  return {
    productName: value.productName.trim(),
    whatItIs: value.whatItIs.trim(),
    whyItMatters: value.whyItMatters.trim(),
    sourceRefs: asStringArray(value.sourceRefs),
    confidence: value.confidence,
    lastVerified: isNonEmptyString(value.lastVerified) ? value.lastVerified.trim() : undefined,
  };
}

function normalizeTopicRoleContext(value: unknown): TopicRoleContext | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.topicId) || !isNonEmptyString(value.topicName) || !isNonEmptyString(value.role)) return null;
  if (!isOneOf(value.directness, ["direct", "indirect", "peripheral", "narrative_only"] as const)) return null;
  if (!isOneOf(value.confidence, ["high", "medium", "low", "insufficient"] as const)) return null;
  return {
    topicId: value.topicId.trim(),
    topicName: value.topicName.trim(),
    role: value.role.trim(),
    stageId: isNonEmptyString(value.stageId) ? value.stageId.trim() : undefined,
    directness: value.directness,
    confidence: value.confidence,
    sourceRefs: asStringArray(value.sourceRefs),
    lastVerified: isNonEmptyString(value.lastVerified) ? value.lastVerified.trim() : undefined,
  };
}

function normalizeSwotContext(value: unknown): SwotContext | null {
  if (!isRecord(value)) return null;
  if (!isOneOf(value.category, ["strength", "weakness", "opportunity", "threat"] as const)) return null;
  if (!isNonEmptyString(value.statement) || !isNonEmptyString(value.rationale)) return null;
  if (!isOneOf(value.confidence, ["high", "medium", "low", "insufficient"] as const)) return null;
  return {
    category: value.category,
    statement: value.statement.trim(),
    rationale: value.rationale.trim(),
    confidence: value.confidence,
    sourceRefs: asStringArray(value.sourceRefs),
    lastVerified: isNonEmptyString(value.lastVerified) ? value.lastVerified.trim() : undefined,
  };
}

function normalizeResearchContext(value: unknown): ResearchContext | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.researchSignalId) || !isNonEmptyString(value.sourceName) || !isNonEmptyString(value.thesis) || !isNonEmptyString(value.scope)) return null;
  if (!isOneOf(value.confidence, ["high", "medium", "low", "insufficient"] as const)) return null;
  return {
    researchSignalId: value.researchSignalId.trim(),
    sourceName: value.sourceName.trim(),
    thesis: value.thesis.trim(),
    scope: value.scope.trim(),
    confidence: value.confidence,
    sourceRefs: asStringArray(value.sourceRefs),
  };
}

function normalizeKnowledgeRuleContext(value: unknown): KnowledgeRuleContext | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.ruleId) || !isNonEmptyString(value.title) || !isNonEmptyString(value.category) || !isNonEmptyString(value.implication)) return null;
  return {
    ruleId: value.ruleId.trim(),
    title: value.title.trim(),
    category: value.category.trim(),
    implication: value.implication.trim(),
    sourceRefs: asStringArray(value.sourceRefs),
  };
}

function normalizeArray<T>(value: unknown, normalize: (item: unknown) => T | null): T[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const normalized = value.map(normalize);
  return normalized.every((item): item is T => item !== null) ? normalized : null;
}

function normalizeSourceStatus(value: unknown): SourceStatusSummary | null {
  if (!isRecord(value)) return null;
  if (!isOneOf(value.status, ["verified", "partial", "insufficient"] as const)) return null;
  if (!isOneOf(value.freshness, ["today", "this_week", "stale", "unknown"] as const)) return null;
  return { status: value.status, freshness: value.freshness, sourceRefs: asStringArray(value.sourceRefs), warnings: asStringArray(value.warnings) };
}

export type DailyAnalysisV2GateId =
  | "recommendation_grade_floor"
  | "missing_core_sources"
  | "stale_core_sources"
  | "missing_product_context"
  | "missing_verified_topic_role"
  | "technical_only"
  | "blocking_risk";

export interface DailyAnalysisV2Gate {
  id: DailyAnalysisV2GateId;
  severity: "hard" | "soft";
  message: string;
  capsGradeAt: DailyAnalysisV2Grade;
}

export interface DailyAnalysisV2GateInput {
  proposedGrade: DailyAnalysisV2Grade;
  proposedTier: DailyAnalysisV2Tier;
  score: DailyAnalysisV2Score;
  productContext?: ProductContext[];
  topicRoleContext?: TopicRoleContext[];
  reasons?: AnalysisReason[];
  risks?: AnalysisRisk[];
  sourceStatus: SourceStatusSummary;
}

export interface DailyAnalysisV2GateDecision {
  grade: DailyAnalysisV2Grade;
  tier: DailyAnalysisV2Tier;
  gates: DailyAnalysisV2Gate[];
}

const gradeRank: Record<DailyAnalysisV2Grade, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 };
const rankToGrade: DailyAnalysisV2Grade[] = ["A", "B", "C", "D", "F"];

function capGrade(current: DailyAnalysisV2Grade, cap: DailyAnalysisV2Grade): DailyAnalysisV2Grade {
  return rankToGrade[Math.max(gradeRank[current], gradeRank[cap])];
}

function tierForGrade(grade: DailyAnalysisV2Grade): DailyAnalysisV2Tier {
  if (grade === "A") return "top_candidate";
  if (grade === "B") return "strong_watchlist";
  if (grade === "C") return "observation";
  if (grade === "D") return "weak_signal";
  return "insufficient_data";
}

function hasEvidenceBackedProduct(products: ProductContext[] | undefined): boolean {
  return Boolean(products?.some((item) => item.confidence !== "insufficient" && item.sourceRefs.length > 0));
}

function hasVerifiedDirectTopicRole(roles: TopicRoleContext[] | undefined): boolean {
  return Boolean(roles?.some((role) => role.directness === "direct" && (role.confidence === "high" || role.confidence === "medium") && role.sourceRefs.length > 0));
}

function isTechnicalOnly(input: DailyAnalysisV2GateInput): boolean {
  const hasOnlyTechnicalBullishReasons = (input.reasons ?? []).length > 0
    && (input.reasons ?? []).every((reason) => reason.domain === "technical" || reason.polarity !== "bullish");
  const supportingScore = input.score.chip + input.score.event + input.score.industryTopic + input.score.productRole + input.score.researchDirection;
  return input.score.technical > 0 && supportingScore <= 0 && (hasOnlyTechnicalBullishReasons || input.proposedGrade === "A");
}

function gradeGatesForInput(input: DailyAnalysisV2GateInput): DailyAnalysisV2Gate[] {
  const gates: DailyAnalysisV2Gate[] = [];
  if ((input.proposedGrade === "D" || input.proposedGrade === "F") && (input.proposedTier === "top_candidate" || input.proposedTier === "strong_watchlist")) {
    gates.push({ id: "recommendation_grade_floor", severity: "hard", capsGradeAt: input.proposedGrade, message: "D/F grades cannot render as candidate or watchlist tiers." });
  }
  if (input.sourceStatus.status === "insufficient" || input.sourceStatus.freshness === "unknown") {
    gates.push({ id: "missing_core_sources", severity: "hard", capsGradeAt: "F", message: "Missing core source status prevents recommendation framing." });
  } else if (input.sourceStatus.freshness === "stale") {
    gates.push({ id: "stale_core_sources", severity: "hard", capsGradeAt: "D", message: "Stale core source data caps the analysis at weak signal." });
  }
  if (!hasEvidenceBackedProduct(input.productContext)) {
    gates.push({ id: "missing_product_context", severity: "soft", capsGradeAt: "C", message: "Missing evidence-backed product context caps the analysis at observation." });
  }
  if (!hasVerifiedDirectTopicRole(input.topicRoleContext)) {
    gates.push({ id: "missing_verified_topic_role", severity: "soft", capsGradeAt: "C", message: "Missing verified direct topic role caps the analysis at observation." });
  }
  if (isTechnicalOnly(input)) {
    gates.push({ id: "technical_only", severity: "soft", capsGradeAt: "B", message: "Strong technical signal alone cannot produce A without chip/event/industry/product confirmation." });
  }
  if ((input.risks ?? []).some((risk) => risk.severity === "high")) {
    gates.push({ id: "blocking_risk", severity: "hard", capsGradeAt: "D", message: "High-severity risk caps the analysis at weak signal." });
  }
  return gates;
}

export function buildDailyAnalysisV2GateDecision(input: DailyAnalysisV2GateInput): DailyAnalysisV2GateDecision {
  const gates = gradeGatesForInput(input);
  const grade = gates.reduce((current, gate) => capGrade(current, gate.capsGradeAt), input.proposedGrade);
  return { grade, tier: tierForGrade(grade), gates };
}

export function normalizeDailyAnalysisV2(value: unknown): DailyAnalysisV2 | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.date) || !isNonEmptyString(value.companyCode) || !isNonEmptyString(value.companyName)) return null;
  if (!isOneOf(value.grade, dailyAnalysisV2Grades) || !isOneOf(value.tier, dailyAnalysisV2Tiers)) return null;
  if (!isNonEmptyString(value.headline) || !isNonEmptyString(value.summary)) return null;

  const score = normalizeScore(value.score);
  const reasons = normalizeArray(value.reasons, normalizeReason);
  const risks = normalizeArray(value.risks, normalizeRisk);
  const productContext = normalizeArray(value.productContext, normalizeProductContext);
  const topicRoleContext = normalizeArray(value.topicRoleContext, normalizeTopicRoleContext);
  const swotContext = normalizeArray(value.swotContext, normalizeSwotContext);
  const researchContext = normalizeArray(value.researchContext, normalizeResearchContext);
  const knowledgeRulesApplied = normalizeArray(value.knowledgeRulesApplied, normalizeKnowledgeRuleContext);
  const sourceStatus = normalizeSourceStatus(value.sourceStatus);

  if (!score || !reasons || !risks || !productContext || !topicRoleContext || !swotContext || !researchContext || !knowledgeRulesApplied || !sourceStatus) return null;

  return {
    date: value.date.trim(),
    companyCode: value.companyCode.trim(),
    companyName: value.companyName.trim(),
    grade: value.grade,
    tier: value.tier,
    headline: value.headline.trim(),
    summary: value.summary.trim(),
    score,
    reasons,
    risks,
    productContext,
    topicRoleContext,
    swotContext,
    researchContext,
    knowledgeRulesApplied,
    nextWatchPoints: asStringArray(value.nextWatchPoints),
    sourceStatus,
  };
}
