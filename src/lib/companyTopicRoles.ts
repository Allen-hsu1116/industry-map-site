export type TopicType = "theme" | "technology" | "product" | "process" | "supply_chain_segment" | "end_market";
export type Directness = "core" | "direct_enabler" | "supplier" | "customer_or_channel" | "indirect" | "rejected";
export type RoleConfidence = "high" | "medium" | "low" | "insufficient" | "unverified";
export type RoleStatus = "verified" | "candidate" | "rejected";

export interface CompanyTopicRoleEvidence {
  sourceId: string;
  publisher: string;
  title: string;
  url: string;
  claim: string;
  quote?: string;
}

export interface CompanyTopicRoleItem {
  topicId: string;
  topicName: string;
  topicType: TopicType;
  directness: Directness;
  supplyChainStage: string;
  roleType: string;
  roleSummary: string;
  products: string[];
  customers?: string[];
  competitors?: string[];
  risks?: string[];
  legacy?: {
    topicSlug?: string;
    groupName?: string;
    legacyRole?: string;
  };
  evidence: CompanyTopicRoleEvidence[];
  confidence: RoleConfidence;
  lastVerified: string | null;
  status: RoleStatus;
}

export interface CompanyTopicRolesKnowledge {
  schemaVersion: 1;
  companyCode: string;
  companyName: string;
  updatedAt: string;
  roles: CompanyTopicRoleItem[];
}

const topicTypes = new Set<TopicType>(["theme", "technology", "product", "process", "supply_chain_segment", "end_market"]);
const directnessValues = new Set<Directness>(["core", "direct_enabler", "supplier", "customer_or_channel", "indirect", "rejected"]);
const confidenceValues = new Set<RoleConfidence>(["high", "medium", "low", "insufficient", "unverified"]);
const statusValues = new Set<RoleStatus>(["verified", "candidate", "rejected"]);

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter((item): item is string => Boolean(item)) : [];
}

function normalizeEvidence(value: unknown): CompanyTopicRoleEvidence[] {
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

export function directnessToRelevance(directness: Directness): "high" | "medium" | "low" | "unknown" {
  if (directness === "core" || directness === "direct_enabler") return "high";
  if (directness === "supplier" || directness === "customer_or_channel") return "medium";
  if (directness === "indirect") return "low";
  return "unknown";
}

export function directnessLabel(directness: Directness): string {
  switch (directness) {
    case "core":
      return "核心產品/平台";
    case "direct_enabler":
      return "直接賦能角色";
    case "supplier":
      return "供應商角色";
    case "customer_or_channel":
      return "客戶/通路角色";
    case "indirect":
      return "間接受惠";
    case "rejected":
      return "不納入主要題材";
  }
}

export function normalizeCompanyTopicRoles(raw: unknown): CompanyTopicRolesKnowledge | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (record.schemaVersion !== 1) return null;
  const companyCode = asString(record.companyCode);
  const companyName = asString(record.companyName);
  const updatedAt = asString(record.updatedAt);
  if (!companyCode || !companyName || !updatedAt || !Array.isArray(record.roles)) return null;

  const roles = record.roles.flatMap((role): CompanyTopicRoleItem[] => {
    if (!role || typeof role !== "object") return [];
    const item = role as Record<string, unknown>;
    const topicId = asString(item.topicId);
    const topicName = asString(item.topicName);
    const topicType = asString(item.topicType) as TopicType | undefined;
    const directness = asString(item.directness) as Directness | undefined;
    const confidence = asString(item.confidence) as RoleConfidence | undefined;
    const status = asString(item.status) as RoleStatus | undefined;
    const supplyChainStage = asString(item.supplyChainStage);
    const roleType = asString(item.roleType);
    const roleSummary = asString(item.roleSummary);
    if (!topicId || !topicName || !topicType || !topicTypes.has(topicType) || !directness || !directnessValues.has(directness)) return [];
    if (!confidence || !confidenceValues.has(confidence) || !status || !statusValues.has(status)) return [];
    if (!supplyChainStage || !roleType || !roleSummary) return [];
    const legacy = item.legacy && typeof item.legacy === "object" ? item.legacy as Record<string, unknown> : undefined;
    return [{
      topicId,
      topicName,
      topicType,
      directness,
      supplyChainStage,
      roleType,
      roleSummary,
      products: asStringArray(item.products),
      customers: asStringArray(item.customers),
      competitors: asStringArray(item.competitors),
      risks: asStringArray(item.risks),
      legacy: legacy ? {
        topicSlug: asString(legacy.topicSlug),
        groupName: asString(legacy.groupName),
        legacyRole: asString(legacy.legacyRole),
      } : undefined,
      evidence: normalizeEvidence(item.evidence),
      confidence,
      lastVerified: asString(item.lastVerified) ?? null,
      status,
    }];
  }).sort((a, b) => a.topicId.localeCompare(b.topicId));

  return { schemaVersion: 1, companyCode, companyName, updatedAt, roles };
}
