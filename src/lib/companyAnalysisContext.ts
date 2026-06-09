import type { CompanyProductKnowledge } from "./productKnowledge";
import type { CompanyTopicRolesKnowledge, Directness, RoleConfidence } from "./companyTopicRoles";
import type { CompanySwotKnowledge, SwotConfidence } from "./companySwot";
import { normalizeResearchSignal, type ResearchSignal } from "./researchSignals";
import { adaptStockKnowledgeRuleContract, summarizeStockKnowledgeRuleStatus, type StockKnowledgeRulesFile } from "./stockKnowledgeRules";
import type { ContextConfidence, KnowledgeRuleContext, ProductContext, ResearchContext, SourceStatusSummary, SwotContext, TopicRoleContext } from "./dailyAnalysisV2";

export interface CompanyAnalysisContextInput {
  companyCode: string;
  companyName: string;
  productKnowledge?: CompanyProductKnowledge | null;
  topicRoles?: CompanyTopicRolesKnowledge | null;
  swot?: CompanySwotKnowledge | null;
  researchSignals?: unknown[];
  stockKnowledgeRules?: StockKnowledgeRulesFile[];
}

export interface CompanyAnalysisContext {
  companyCode: string;
  companyName: string;
  productContext: ProductContext[];
  topicRoleContext: TopicRoleContext[];
  swotContext: SwotContext[];
  researchContext: ResearchContext[];
  knowledgeRulesApplied: KnowledgeRuleContext[];
  sourceStatus: SourceStatusSummary;
}

function sourceRefsFromEvidence(items: Array<{ sourceId: string }>): string[] {
  return items.map((item) => item.sourceId).filter(Boolean);
}

function contextConfidence(value: RoleConfidence | SwotConfidence | string): ContextConfidence {
  if (value === "high" || value === "medium" || value === "low" || value === "insufficient") return value;
  return "insufficient";
}

function roleDirectness(value: Directness): TopicRoleContext["directness"] {
  if (value === "core" || value === "direct_enabler") return "direct";
  if (value === "supplier" || value === "customer_or_channel") return "indirect";
  if (value === "indirect") return "peripheral";
  return "narrative_only";
}

function parseDate(value: string): number | null {
  const timestamp = Date.parse(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function freshnessFromDates(dates: string[], now = Date.now()): SourceStatusSummary["freshness"] {
  const timestamps = dates.map(parseDate).filter((item): item is number => item !== null);
  if (timestamps.length === 0) return "unknown";
  const newest = Math.max(...timestamps);
  const ageDays = (now - newest) / (1000 * 60 * 60 * 24);
  if (ageDays <= 1) return "today";
  if (ageDays <= 7) return "this_week";
  return "stale";
}

function combineStatus(parts: boolean[], warnings: string[]): SourceStatusSummary["status"] {
  if (parts.length === 0 || parts.every((item) => !item)) return "insufficient";
  if (warnings.length === 0 && parts.every(Boolean)) return "verified";
  return "partial";
}

export function buildCompanyAnalysisContext(input: CompanyAnalysisContextInput): CompanyAnalysisContext {
  const productContext: ProductContext[] = (input.productKnowledge?.products ?? []).map((item) => ({
    productName: item.name,
    whatItIs: item.plainLanguage,
    whyItMatters: item.whyItMatters,
    sourceRefs: sourceRefsFromEvidence(item.evidence),
    confidence: contextConfidence(item.confidence),
    lastVerified: item.lastVerified,
  }));

  const topicRoleContext: TopicRoleContext[] = (input.topicRoles?.roles ?? [])
    .filter((role) => role.status !== "rejected")
    .map((role) => ({
      topicId: role.topicId,
      topicName: role.topicName,
      role: role.roleSummary,
      stageId: role.supplyChainStage,
      directness: roleDirectness(role.directness),
      confidence: contextConfidence(role.confidence),
      sourceRefs: sourceRefsFromEvidence(role.evidence),
      lastVerified: role.lastVerified ?? undefined,
    }));

  const swotContext: SwotContext[] = (input.swot?.items ?? [])
    .filter((item) => item.status !== "rejected")
    .map((item) => ({
      category: item.category,
      statement: item.statement,
      rationale: item.rationale,
      confidence: contextConfidence(item.confidence),
      sourceRefs: sourceRefsFromEvidence(item.evidence),
      lastVerified: item.lastVerified ?? undefined,
    }));

  const normalizedSignals = (input.researchSignals ?? []).map(normalizeResearchSignal).filter((signal): signal is ResearchSignal => Boolean(signal));
  const companyTopicIds = new Set(topicRoleContext.map((role) => role.topicId));
  const researchContext: ResearchContext[] = normalizedSignals
    .filter((signal) => signal.relatedCompanies.includes(input.companyCode) || signal.relatedTopics.some((topicId) => companyTopicIds.has(topicId)))
    .map((signal) => ({
      researchSignalId: signal.id,
      sourceName: signal.sourceName,
      thesis: signal.thesis,
      scope: signal.scope,
      confidence: contextConfidence(signal.confidence),
      sourceRefs: [signal.id],
    }));

  const knowledgeRulesApplied: KnowledgeRuleContext[] = (input.stockKnowledgeRules ?? [])
    .flatMap((file) => file.rules.map(adaptStockKnowledgeRuleContract))
    .filter((rule): rule is NonNullable<typeof rule> => Boolean(rule))
    .slice(0, 4)
    .map((rule) => ({
      ruleId: rule.id,
      title: rule.title,
      category: rule.category,
      implication: rule.summary,
      sourceRefs: rule.evidenceBasis,
    }));

  const warnings: string[] = [];
  if (productContext.length === 0) warnings.push("Missing product context");
  if (topicRoleContext.length === 0) warnings.push("Missing topic role context");
  if (swotContext.length === 0) warnings.push("Missing SWOT context");
  const ruleStatus = summarizeStockKnowledgeRuleStatus(input.stockKnowledgeRules ?? []);
  if (ruleStatus.status === "insufficient" && ruleStatus.warning) warnings.push(ruleStatus.warning);

  const sourceRefs = [
    ...productContext.flatMap((item) => item.sourceRefs),
    ...topicRoleContext.flatMap((item) => item.sourceRefs),
    ...swotContext.flatMap((item) => item.sourceRefs),
    ...researchContext.flatMap((item) => item.sourceRefs),
  ];
  const dates = [
    input.productKnowledge?.updatedAt,
    input.topicRoles?.updatedAt,
    input.swot?.updatedAt,
  ].filter((item): item is string => Boolean(item));

  return {
    companyCode: input.companyCode,
    companyName: input.companyName,
    productContext,
    topicRoleContext,
    swotContext,
    researchContext,
    knowledgeRulesApplied,
    sourceStatus: {
      status: combineStatus([productContext.length > 0, topicRoleContext.length > 0, swotContext.length > 0], warnings),
      freshness: freshnessFromDates(dates),
      sourceRefs,
      warnings,
    },
  };
}
