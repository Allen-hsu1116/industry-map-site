import type { CompanyTopicRolesKnowledge } from "./companyTopicRoles";
import type { SourceStatusSummary } from "./dailyAnalysisV2";

export interface IndustryChainCompany {
  companyCode: string;
  companyName: string;
  roleSummary: string;
  directness: string;
  confidence: string;
  sourceRefs: string[];
}

export interface IndustryChainStage {
  stageId: string;
  label: string;
  stageKind: "verified_company_roles" | "narrative_only";
  topicIds: string[];
  companies: IndustryChainCompany[];
  companyCount: number;
  emptyReason?: string;
}

export interface IndustryChainMapInput {
  topicId: string;
  topicName: string;
  companyTopicRoles: CompanyTopicRolesKnowledge[];
}

export interface IndustryChainMap {
  topicId: string;
  topicName: string;
  stages: IndustryChainStage[];
  companyCount: number;
  sourceStatus: SourceStatusSummary;
}

const defaultStageLabels: Record<string, string> = {
  upstream: "上游",
  midstream: "中游",
  manufacturing: "製造 / 核心供給",
  downstream: "下游",
  end_market: "終端需求",
  "downstream-demand": "終端需求",
};

const stageOrder = ["upstream", "midstream", "manufacturing", "downstream", "end_market", "downstream-demand"];

function normalizeStage(value: string): string {
  const key = value.trim().toLowerCase().replace(/\s+/g, "-");
  if (key === "end-market" || key === "endmarket") return "end_market";
  return key || "unknown";
}

function stageLabel(stageId: string): string {
  return defaultStageLabels[stageId] ?? stageId;
}

function sourceRefs(items: Array<{ sourceId: string }>): string[] {
  return items.map((item) => item.sourceId).filter(Boolean);
}

function sortStages(a: string, b: string): number {
  const ai = stageOrder.indexOf(a);
  const bi = stageOrder.indexOf(b);
  if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  return a.localeCompare(b);
}

export function buildIndustryChainMap(input: IndustryChainMapInput): IndustryChainMap {
  const byStage = new Map<string, Map<string, IndustryChainCompany>>();
  for (const knowledge of input.companyTopicRoles) {
    for (const role of knowledge.roles) {
      if (role.topicId !== input.topicId || role.status === "rejected") continue;
      const stageId = normalizeStage(role.supplyChainStage);
      const stageCompanies = byStage.get(stageId) ?? new Map<string, IndustryChainCompany>();
      if (!stageCompanies.has(knowledge.companyCode)) {
        stageCompanies.set(knowledge.companyCode, {
          companyCode: knowledge.companyCode,
          companyName: knowledge.companyName,
          roleSummary: role.roleSummary,
          directness: role.directness,
          confidence: role.confidence,
          sourceRefs: sourceRefs(role.evidence),
        });
      }
      byStage.set(stageId, stageCompanies);
    }
  }

  const stages: IndustryChainStage[] = Array.from(byStage.entries())
    .sort(([a], [b]) => sortStages(a, b))
    .map(([stageId, companies]) => ({
      stageId,
      label: stageLabel(stageId),
      stageKind: "verified_company_roles",
      topicIds: [input.topicId],
      companies: Array.from(companies.values()).sort((a, b) => a.companyCode.localeCompare(b.companyCode)),
      companyCount: companies.size,
    }));

  if (stages.length > 0 && !stages.some((stage) => stage.stageId === "downstream-demand" || stage.stageId === "end_market")) {
    stages.push({
      stageId: "downstream-demand",
      label: stageLabel("downstream-demand"),
      stageKind: "narrative_only",
      topicIds: [input.topicId],
      companies: [],
      companyCount: 0,
      emptyReason: "此階段作為需求敘事保留；目前沒有 evidence-backed company-topic-role 綁定。",
    });
  }

  if (stages.length === 0) {
    stages.push({
      stageId: "narrative-only",
      label: input.topicName,
      stageKind: "narrative_only",
      topicIds: [input.topicId],
      companies: [],
      companyCount: 0,
      emptyReason: "目前沒有 verified company-topic-role，不能憑題材敘事發明公司綁定。",
    });
  }

  const companyCodes = new Set(stages.flatMap((stage) => stage.companies.map((company) => company.companyCode)));
  const sourceRefsAll = stages.flatMap((stage) => stage.companies.flatMap((company) => company.sourceRefs));
  return {
    topicId: input.topicId,
    topicName: input.topicName,
    stages,
    companyCount: companyCodes.size,
    sourceStatus: {
      status: companyCodes.size > 0 ? "partial" : "insufficient",
      freshness: sourceRefsAll.length > 0 ? "this_week" : "unknown",
      sourceRefs: sourceRefsAll,
      warnings: companyCodes.size > 0 ? ["Narrative-only stages do not imply company bindings."] : ["No evidence-backed company roles available for industry chain map."],
    },
  };
}
