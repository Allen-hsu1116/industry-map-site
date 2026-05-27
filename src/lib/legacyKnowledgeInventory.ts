export type LegacyRelevance = "高" | "中" | "低" | string;

export interface LegacyCompanyRole {
  code?: unknown;
  name?: unknown;
  role?: unknown;
  relevance?: unknown;
  products?: unknown;
  customers?: unknown;
  tech_focus?: unknown;
  swot?: unknown;
}

export interface LegacyGroup {
  name?: unknown;
  companies?: unknown;
}

export interface LegacyTopic {
  slug?: unknown;
  name?: unknown;
  groups?: unknown;
}

export interface LegacyIndustriesData {
  topics?: unknown;
  stats?: unknown;
}

export interface LegacyRoleCandidate {
  source: "legacy_industries_json";
  status: "candidate";
  needsVerification: true;
  confidence: "unverified";
  topicId: string;
  topicName: string;
  groupName: string;
  companyCode: string;
  companyName: string;
  role: string;
  relevance: string;
  products: string[];
  customers: string[];
  techFocus: string[];
  swot: Record<"strengths" | "weaknesses" | "opportunities" | "threats", string[]>;
}

export interface ProductCandidate {
  raw: string;
  normalized: string;
  mentions: number;
  topics: string[];
}

export interface CompanyInventoryItem {
  code: string;
  name: string;
  topicCount: number;
  roleCount: number;
  productMentionCount: number;
  customerMentionCount: number;
  techFocusMentionCount: number;
  swotMentionCount: number;
  productCandidates: ProductCandidate[];
  priorityScore: number;
  priorityReasons: string[];
  topics: string[];
}

export interface TopicInventoryItem {
  id: string;
  name: string;
  groupCount: number;
  roleCount: number;
  uniqueCompanyCount: number;
  productMentionCount: number;
}

export interface LegacyKnowledgeInventory {
  generatedAt: string;
  summary: {
    topics: number;
    groups: number;
    companyRoles: number;
    uniqueCompanies: number;
    productMentions: number;
    customerMentions: number;
    techFocusMentions: number;
    swotMentions: number;
  };
  companies: CompanyInventoryItem[];
  topics: TopicInventoryItem[];
  roleCandidates: LegacyRoleCandidate[];
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  return asArray(value).map(asString).filter(Boolean);
}

function asSwot(value: unknown): LegacyRoleCandidate["swot"] {
  const obj = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    strengths: asStringArray(obj.strengths),
    weaknesses: asStringArray(obj.weaknesses),
    opportunities: asStringArray(obj.opportunities),
    threats: asStringArray(obj.threats),
  };
}

export function normalizeCandidateToken(raw: string): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/[\s\-_/+()（）:：，,。.;；｜|「」『』【】\[\]]/g, "")
    .trim();
}

function swotCount(swot: LegacyRoleCandidate["swot"]): number {
  return swot.strengths.length + swot.weaknesses.length + swot.opportunities.length + swot.threats.length;
}

function scoreCompany(input: Omit<CompanyInventoryItem, "priorityScore" | "priorityReasons">): Pick<CompanyInventoryItem, "priorityScore" | "priorityReasons"> {
  const reasons: string[] = [];
  let score = 0;

  score += input.topicCount * 12;
  score += input.roleCount * 8;
  score += Math.min(input.productMentionCount, 20) * 3;
  score += Math.min(input.techFocusMentionCount, 12) * 2;
  score += Math.min(input.customerMentionCount, 12);
  score += Math.min(input.swotMentionCount, 12) * 2;

  if (input.topicCount >= 2) reasons.push(`${input.topicCount} topics`);
  if (input.roleCount >= 2) reasons.push(`${input.roleCount} legacy roles`);
  if (input.productMentionCount > 0) reasons.push(`${input.productMentionCount} product mentions`);
  if (input.swotMentionCount > 0) reasons.push(`${input.swotMentionCount} SWOT mentions`);
  if (input.techFocusMentionCount > 0) reasons.push(`${input.techFocusMentionCount} tech-focus mentions`);

  return { priorityScore: score, priorityReasons: reasons };
}

export function buildLegacyKnowledgeInventory(raw: LegacyIndustriesData, generatedAt = new Date().toISOString()): LegacyKnowledgeInventory {
  const topics = asArray(raw.topics) as LegacyTopic[];
  const roleCandidates: LegacyRoleCandidate[] = [];
  const topicStats = new Map<string, TopicInventoryItem & { companyCodes: Set<string> }>();
  let groupCount = 0;

  for (const topic of topics) {
    const topicId = asString(topic.slug);
    const topicName = asString(topic.name);
    if (!topicId) continue;

    if (!topicStats.has(topicId)) {
      topicStats.set(topicId, {
        id: topicId,
        name: topicName,
        groupCount: 0,
        roleCount: 0,
        uniqueCompanyCount: 0,
        productMentionCount: 0,
        companyCodes: new Set<string>(),
      });
    }
    const topicStat = topicStats.get(topicId)!;

    for (const group of asArray(topic.groups) as LegacyGroup[]) {
      const groupName = asString(group.name) || "unknown";
      groupCount += 1;
      topicStat.groupCount += 1;

      for (const company of asArray(group.companies) as LegacyCompanyRole[]) {
        const companyCode = asString(company.code);
        const companyName = asString(company.name);
        if (!companyCode || !companyName) continue;

        const swot = asSwot(company.swot);
        const products = asStringArray(company.products);
        const candidate: LegacyRoleCandidate = {
          source: "legacy_industries_json",
          status: "candidate",
          needsVerification: true,
          confidence: "unverified",
          topicId,
          topicName,
          groupName,
          companyCode,
          companyName,
          role: asString(company.role),
          relevance: asString(company.relevance),
          products,
          customers: asStringArray(company.customers),
          techFocus: asStringArray(company.tech_focus),
          swot,
        };
        roleCandidates.push(candidate);
        topicStat.roleCount += 1;
        topicStat.companyCodes.add(companyCode);
        topicStat.productMentionCount += products.length;
      }
    }
  }

  const byCompany = new Map<string, { name: string; roles: LegacyRoleCandidate[] }>();
  for (const role of roleCandidates) {
    const existing = byCompany.get(role.companyCode) ?? { name: role.companyName, roles: [] };
    existing.roles.push(role);
    byCompany.set(role.companyCode, existing);
  }

  const companies = Array.from(byCompany.entries()).map(([code, entry]) => {
    const topicSet = new Set(entry.roles.map((role) => role.topicId));
    const productMap = new Map<string, ProductCandidate>();
    let productMentionCount = 0;
    let customerMentionCount = 0;
    let techFocusMentionCount = 0;
    let swotMentionCount = 0;

    for (const role of entry.roles) {
      productMentionCount += role.products.length;
      customerMentionCount += role.customers.length;
      techFocusMentionCount += role.techFocus.length;
      swotMentionCount += swotCount(role.swot);

      for (const product of role.products) {
        const normalized = normalizeCandidateToken(product);
        if (!normalized) continue;
        const existing = productMap.get(normalized) ?? { raw: product, normalized, mentions: 0, topics: [] };
        existing.mentions += 1;
        if (!existing.topics.includes(role.topicId)) existing.topics.push(role.topicId);
        productMap.set(normalized, existing);
      }
    }

    const base: Omit<CompanyInventoryItem, "priorityScore" | "priorityReasons"> = {
      code,
      name: entry.name,
      topicCount: topicSet.size,
      roleCount: entry.roles.length,
      productMentionCount,
      customerMentionCount,
      techFocusMentionCount,
      swotMentionCount,
      productCandidates: Array.from(productMap.values()).sort((a, b) => b.mentions - a.mentions || a.raw.localeCompare(b.raw, "zh-Hant")),
      topics: Array.from(topicSet).sort(),
    };
    return { ...base, ...scoreCompany(base) };
  }).sort((a, b) => b.priorityScore - a.priorityScore || a.code.localeCompare(b.code));

  const topicItems = Array.from(topicStats.values()).map((topic) => ({
    id: topic.id,
    name: topic.name,
    groupCount: topic.groupCount,
    roleCount: topic.roleCount,
    uniqueCompanyCount: topic.companyCodes.size,
    productMentionCount: topic.productMentionCount,
  })).sort((a, b) => b.roleCount - a.roleCount || a.id.localeCompare(b.id));

  return {
    generatedAt,
    summary: {
      topics: topicStats.size,
      groups: groupCount,
      companyRoles: roleCandidates.length,
      uniqueCompanies: byCompany.size,
      productMentions: roleCandidates.reduce((sum, role) => sum + role.products.length, 0),
      customerMentions: roleCandidates.reduce((sum, role) => sum + role.customers.length, 0),
      techFocusMentions: roleCandidates.reduce((sum, role) => sum + role.techFocus.length, 0),
      swotMentions: roleCandidates.reduce((sum, role) => sum + swotCount(role.swot), 0),
    },
    companies,
    topics: topicItems,
    roleCandidates: roleCandidates.sort((a, b) => a.companyCode.localeCompare(b.companyCode) || a.topicId.localeCompare(b.topicId) || a.groupName.localeCompare(b.groupName, "zh-Hant")),
  };
}

export function rankPilotCompanies(companies: CompanyInventoryItem[], limit = 30): CompanyInventoryItem[] {
  return [...companies]
    .sort((a, b) => b.priorityScore - a.priorityScore || a.code.localeCompare(b.code))
    .slice(0, limit);
}
