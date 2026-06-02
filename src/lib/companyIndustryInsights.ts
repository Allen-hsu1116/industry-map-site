import { directnessLabel, type CompanyTopicRolesKnowledge, type CompanyTopicRoleItem } from "./companyTopicRoles";
import { groupCompanySwot, type CompanySwotItem, type CompanySwotKnowledge, type GroupedSwot } from "./companySwot";
import { productKnowledgeToNarrative, type CompanyProductKnowledge, type ProductKnowledgeItem } from "./productKnowledge";

export type IndustryInsightStatus = "verified" | "partial" | "empty";

export interface IndustryInsightSourceStatus {
  module: "products" | "topicRoles" | "swot";
  label: string;
  status: IndustryInsightStatus;
  source: string;
  latestVerifiedAt: string | null;
  scope: string;
  warning?: string;
}

export interface IndustryInsightProductItem {
  name: string;
  category: string;
  description: string;
  whyItMatters: string;
  businessImpact?: string;
  topicFits: Record<string, string>;
  sourceLabels: string[];
  sourceUrls: string[];
  lastVerified: string;
  confidence: ProductKnowledgeItem["confidence"];
}

export interface IndustryInsightProductsPanel {
  status: IndustryInsightStatus;
  updatedAt: string | null;
  items: IndustryInsightProductItem[];
  emptyReason?: string;
}

export interface IndustryInsightTopicRoleItem {
  topicId: string;
  topicName: string;
  topicType: CompanyTopicRoleItem["topicType"];
  directness: CompanyTopicRoleItem["directness"];
  directnessLabel: string;
  supplyChainStage: string;
  roleType: string;
  roleSummary: string;
  products: string[];
  customers: string[];
  competitors: string[];
  risks: string[];
  confidence: CompanyTopicRoleItem["confidence"];
  status: CompanyTopicRoleItem["status"];
  lastVerified: string | null;
  sourceLabels: string[];
  sourceUrls: string[];
}

export interface IndustryInsightTopicRolesPanel {
  status: IndustryInsightStatus;
  updatedAt: string | null;
  counts: Record<CompanyTopicRoleItem["status"], number>;
  items: IndustryInsightTopicRoleItem[];
  emptyReason?: string;
}

export interface IndustryInsightSwotItem {
  id: string;
  statement: string;
  rationale: string;
  timeHorizon: CompanySwotItem["timeHorizon"];
  relatedTopicIds: string[];
  confidence: CompanySwotItem["confidence"];
  status: CompanySwotItem["status"];
  lastVerified: string | null;
  sourceLabels: string[];
  sourceUrls: string[];
}

export interface IndustryInsightSwotPanel {
  status: IndustryInsightStatus;
  updatedAt: string | null;
  groups: Record<keyof GroupedSwot, IndustryInsightSwotItem[]>;
  warning?: string;
  emptyReason?: string;
}

export interface CompanyIndustryInsights {
  companyCode: string;
  companyName: string;
  status: IndustryInsightStatus;
  panels: {
    products: IndustryInsightProductsPanel;
    topicRoles: IndustryInsightTopicRolesPanel;
    swot: IndustryInsightSwotPanel;
  };
  sourceStatus: IndustryInsightSourceStatus[];
}

export interface BuildCompanyIndustryInsightsInput {
  companyCode: string;
  companyName: string;
  productKnowledge?: CompanyProductKnowledge | null;
  topicRoles?: CompanyTopicRolesKnowledge | null;
  swot?: CompanySwotKnowledge | null;
}

function sourceLabel(source: { publisher: string; title: string }): string {
  return `${source.publisher}：${source.title}`;
}

function latestDate(dates: Array<string | null | undefined>): string | null {
  const valid = dates.filter((date): date is string => Boolean(date));
  return valid.length > 0 ? valid.sort().at(-1) ?? null : null;
}

function panelStatus(args: { total: number; verified: number; complete?: boolean }): IndustryInsightStatus {
  if (args.total === 0) return "empty";
  if (args.complete === false) return "partial";
  return args.verified === args.total ? "verified" : "partial";
}

function buildProductsPanel(productKnowledge: CompanyProductKnowledge | null | undefined): IndustryInsightProductsPanel {
  const products = productKnowledge?.products ?? [];
  const items = products.map((product): IndustryInsightProductItem => {
    const narrative = productKnowledgeToNarrative(product);
    return {
      name: narrative.name,
      category: product.category,
      description: narrative.description,
      whyItMatters: narrative.whyItMatters ?? product.whyItMatters,
      businessImpact: narrative.businessImpact,
      topicFits: product.topicFit ?? {},
      sourceLabels: narrative.sourceLabels ?? [],
      sourceUrls: narrative.sourceUrls ?? [],
      lastVerified: product.lastVerified,
      confidence: product.confidence,
    };
  });

  return {
    status: panelStatus({ total: items.length, verified: items.filter((item) => item.sourceLabels.length > 0 && item.lastVerified && item.confidence !== "low").length }),
    updatedAt: productKnowledge?.updatedAt ?? null,
    items,
    ...(items.length === 0 ? { emptyReason: "尚未建立產品知識檔；不可用 AI 補成既定事實" } : {}),
  };
}

function buildTopicRolesPanel(topicRoles: CompanyTopicRolesKnowledge | null | undefined): IndustryInsightTopicRolesPanel {
  const roles = topicRoles?.roles ?? [];
  const counts: IndustryInsightTopicRolesPanel["counts"] = { verified: 0, candidate: 0, rejected: 0 };
  for (const role of roles) counts[role.status] += 1;

  const visibleRoles = roles.filter((role) => role.status !== "rejected");
  const items = visibleRoles.map((role): IndustryInsightTopicRoleItem => ({
    topicId: role.topicId,
    topicName: role.topicName,
    topicType: role.topicType,
    directness: role.directness,
    directnessLabel: directnessLabel(role.directness),
    supplyChainStage: role.supplyChainStage,
    roleType: role.roleType,
    roleSummary: role.roleSummary,
    products: role.products,
    customers: role.customers ?? [],
    competitors: role.competitors ?? [],
    risks: role.risks ?? [],
    confidence: role.confidence,
    status: role.status,
    lastVerified: role.lastVerified,
    sourceLabels: role.evidence.map(sourceLabel),
    sourceUrls: role.evidence.map((source) => source.url),
  }));

  return {
    status: panelStatus({ total: visibleRoles.length, verified: visibleRoles.filter((role) => role.status === "verified" && role.evidence.length > 0 && role.lastVerified).length }),
    updatedAt: topicRoles?.updatedAt ?? null,
    counts,
    items,
    ...(items.length === 0 ? { emptyReason: "尚未建立題材角色知識檔；不可把股價同漲視為產業角色" } : {}),
  };
}

function swotItemToInsight(item: CompanySwotItem): IndustryInsightSwotItem {
  return {
    id: item.id,
    statement: item.statement,
    rationale: item.rationale,
    timeHorizon: item.timeHorizon,
    relatedTopicIds: item.relatedTopicIds,
    confidence: item.confidence,
    status: item.status,
    lastVerified: item.lastVerified,
    sourceLabels: item.evidence.map(sourceLabel),
    sourceUrls: item.evidence.map((source) => source.url),
  };
}

function buildSwotPanel(swot: CompanySwotKnowledge | null | undefined): IndustryInsightSwotPanel {
  const grouped = groupCompanySwot(swot);
  const groups: IndustryInsightSwotPanel["groups"] = {
    strengths: grouped.strengths.map(swotItemToInsight),
    weaknesses: grouped.weaknesses.map(swotItemToInsight),
    opportunities: grouped.opportunities.map(swotItemToInsight),
    threats: grouped.threats.map(swotItemToInsight),
  };
  const activeItems = Object.values(groups).flat();
  const complete = groups.strengths.length > 0 && groups.weaknesses.length > 0 && groups.opportunities.length > 0 && groups.threats.length > 0;
  const status = panelStatus({
    total: activeItems.length,
    verified: activeItems.filter((item) => item.status === "verified" && item.sourceLabels.length > 0 && item.lastVerified).length,
    complete,
  });

  return {
    status,
    updatedAt: swot?.updatedAt ?? null,
    groups,
    ...(activeItems.length === 0 ? { emptyReason: "尚未建立 SWOT 知識檔；不可用短線股價變動補成結論" } : {}),
    ...(!complete && activeItems.length > 0 ? { warning: "SWOT 尚未涵蓋完整 S/W/O/T；不可視為完整投資結論" } : {}),
  };
}

function buildSourceStatus(input: BuildCompanyIndustryInsightsInput, panels: CompanyIndustryInsights["panels"]): IndustryInsightSourceStatus[] {
  const swotItems = Object.values(panels.swot.groups).flat();
  return [
    {
      module: "products",
      label: "產品知識",
      status: panels.products.status,
      source: input.productKnowledge ? "product-knowledge checked-in JSON" : "not available",
      latestVerifiedAt: latestDate(panels.products.items.map((item) => item.lastVerified)),
      scope: `${panels.products.items.length} products`,
      ...(panels.products.emptyReason ? { warning: panels.products.emptyReason } : {}),
    },
    {
      module: "topicRoles",
      label: "題材角色",
      status: panels.topicRoles.status,
      source: input.topicRoles ? "company-topic-roles checked-in JSON" : "not available",
      latestVerifiedAt: latestDate(panels.topicRoles.items.map((item) => item.lastVerified)),
      scope: `${panels.topicRoles.counts.verified} verified / ${panels.topicRoles.counts.candidate} candidate / ${panels.topicRoles.counts.rejected} rejected`,
      ...(panels.topicRoles.emptyReason ? { warning: panels.topicRoles.emptyReason } : {}),
    },
    {
      module: "swot",
      label: "SWOT",
      status: panels.swot.status,
      source: input.swot ? "company-swot checked-in JSON" : "not available",
      latestVerifiedAt: latestDate(swotItems.map((item) => item.lastVerified)),
      scope: `${swotItems.length} active SWOT items`,
      ...(panels.swot.warning || panels.swot.emptyReason ? { warning: panels.swot.warning ?? panels.swot.emptyReason } : {}),
    },
  ];
}

export function buildCompanyIndustryInsights(input: BuildCompanyIndustryInsightsInput): CompanyIndustryInsights {
  const panels: CompanyIndustryInsights["panels"] = {
    products: buildProductsPanel(input.productKnowledge),
    topicRoles: buildTopicRolesPanel(input.topicRoles),
    swot: buildSwotPanel(input.swot),
  };
  const sourceStatus = buildSourceStatus(input, panels);
  const status: IndustryInsightStatus = sourceStatus.every((item) => item.status === "empty")
    ? "empty"
    : sourceStatus.every((item) => item.status === "verified")
      ? "verified"
      : "partial";

  return {
    companyCode: input.companyCode,
    companyName: input.companyName,
    status,
    panels,
    sourceStatus,
  };
}
