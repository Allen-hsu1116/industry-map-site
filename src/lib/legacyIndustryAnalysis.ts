import { buildLegacyKnowledgeInventory, type LegacyIndustriesData } from "./legacyKnowledgeInventory";
import type { CompanyKnowledgeInput, KnowledgeSWOT, TopicIndustryAnalysis } from "./companyKnowledge";

export interface LegacyCompanyAnalysisFallback {
  products: string[];
  customers: string[];
  industry_analysis: NonNullable<CompanyKnowledgeInput["industry_analysis"]>;
}

function uniquePush(target: string[], value: string) {
  const trimmed = value.trim();
  if (trimmed && !target.includes(trimmed)) target.push(trimmed);
}

function mergeSwot(target: KnowledgeSWOT, source: KnowledgeSWOT | undefined) {
  if (!source) return;
  for (const key of ["strengths", "weaknesses", "opportunities", "threats"] as const) {
    const list = (target[key] ??= []);
    for (const item of source[key] ?? []) uniquePush(list, item);
  }
}

function mergeTopicAnalysis(existing: TopicIndustryAnalysis | undefined, incoming: TopicIndustryAnalysis): TopicIndustryAnalysis {
  const products = [...(existing?.products ?? [])];
  for (const item of incoming.products ?? []) uniquePush(products, item);

  const customers = [...(existing?.customers ?? [])];
  for (const item of incoming.customers ?? []) uniquePush(customers, item);

  const swot: KnowledgeSWOT = {
    strengths: [...(existing?.swot?.strengths ?? [])],
    weaknesses: [...(existing?.swot?.weaknesses ?? [])],
    opportunities: [...(existing?.swot?.opportunities ?? [])],
    threats: [...(existing?.swot?.threats ?? [])],
  };
  mergeSwot(swot, incoming.swot);

  return {
    ai_summary: existing?.ai_summary ?? incoming.ai_summary,
    market_position: existing?.market_position ?? incoming.market_position,
    market_position_detail: existing?.market_position_detail ?? incoming.market_position_detail,
    focus: existing?.focus ?? incoming.focus,
    products,
    customers,
    swot,
  };
}

export function buildLegacyCompanyAnalysisFallbacks(raw: unknown): Map<string, LegacyCompanyAnalysisFallback> {
  const inventory = buildLegacyKnowledgeInventory((raw ?? { topics: [] }) as LegacyIndustriesData, "legacy-industries-json");
  const byCompany = new Map<string, LegacyCompanyAnalysisFallback>();

  for (const role of inventory.roleCandidates) {
    const fallback = byCompany.get(role.companyCode) ?? { products: [], customers: [], industry_analysis: {} };
    for (const product of role.products) uniquePush(fallback.products, product);
    for (const customer of role.customers) uniquePush(fallback.customers, customer);

    const incoming: TopicIndustryAnalysis = {
      ai_summary: `${role.companyName}在「${role.topicName}」題材的「${role.groupName}」中扮演${role.role || "待驗證參與者"}角色。`,
      market_position: role.relevance || undefined,
      market_position_detail: role.role || undefined,
      focus: role.techFocus.length ? role.techFocus.join("\n\n") : role.groupName,
      products: role.products,
      customers: role.customers,
      swot: role.swot,
    };
    fallback.industry_analysis[role.topicId] = mergeTopicAnalysis(fallback.industry_analysis[role.topicId], incoming);
    byCompany.set(role.companyCode, fallback);
  }

  return byCompany;
}

export function mergeLegacyCompanyAnalysisFallback<T extends CompanyKnowledgeInput>(input: T, fallback: LegacyCompanyAnalysisFallback | undefined): T {
  if (!fallback) return input;

  const products = [...(input.products ?? [])];
  for (const product of fallback.products) uniquePush(products, product);

  const customers = [...(input.customers ?? [])];
  for (const customer of fallback.customers) uniquePush(customers, customer);

  return {
    ...input,
    products,
    customers,
    industry_analysis: {
      ...fallback.industry_analysis,
      ...(input.industry_analysis ?? {}),
    },
  } as T;
}
