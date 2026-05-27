import type { LegacyRoleCandidate } from "./legacyKnowledgeInventory";

export type CanonicalProductIssue = "generic_business_registration";

export interface CanonicalizedProductMention {
  canonicalId: string;
  canonicalName: string;
  aliases: string[];
  issues: CanonicalProductIssue[];
}

export interface CanonicalProductCompanyRef {
  code: string;
  name: string;
  mentions: number;
}

export interface CanonicalProductTopicRef {
  id: string;
  name: string;
  mentions: number;
}

export interface CanonicalProductCandidate {
  canonicalId: string;
  canonicalName: string;
  aliases: string[];
  normalizedAliases: string[];
  rawMentionCount: number;
  companies: CanonicalProductCompanyRef[];
  topics: CanonicalProductTopicRef[];
  issues: CanonicalProductIssue[];
  status: "candidate";
  confidence: "unverified";
  needsVerification: true;
}

export interface CanonicalProductCatalog {
  schemaVersion: 1;
  generatedAt: string;
  summary: {
    canonicalProducts: number;
    rawMentions: number;
    productsWithIssues: number;
  };
  products: CanonicalProductCandidate[];
}

interface ProductAliasRule {
  canonicalName: string;
  patterns: RegExp[];
}

const KNOWN_PRODUCT_RULES: ProductAliasRule[] = [
  { canonicalName: "CoWoS-S", patterns: [/\bcowos\s*[-_]?\s*s\b/i] },
  { canonicalName: "CoWoS-L", patterns: [/\bcowos\s*[-_]?\s*l\b/i] },
  { canonicalName: "CoWoS", patterns: [/\bcowos\b/i] },
  { canonicalName: "SoIC", patterns: [/\bsoic\b/i] },
  { canonicalName: "HBM3E", patterns: [/\bhbm\s*3e\b/i] },
  { canonicalName: "HBM", patterns: [/\bhbm\b/i] },
  { canonicalName: "InFO", patterns: [/\binfo\b/i] },
  { canonicalName: "SiP", patterns: [/\bsip\b/i] },
  { canonicalName: "N2", patterns: [/\bn2\b/i, /\b2nm\b/i, /2奈米/] },
  { canonicalName: "A16", patterns: [/\ba16\b/i] },
  { canonicalName: "ABF", patterns: [/\babf\b/i] },
  { canonicalName: "CCL", patterns: [/\bccl\b/i, /銅箔基板/] },
  { canonicalName: "PCB", patterns: [/\bpcb\b/i, /印刷電路板/] },
  { canonicalName: "UPS", patterns: [/\bups\b/i, /不斷電系統/] },
];

const BUSINESS_REGISTRATION_PATTERNS = [
  /得經營法令非禁止或限制之業務/,
  /電子零組件製造業/,
  /國際貿易業/,
  /批發業/,
  /顧問服務業/,
  /代理銷售/,
  /進出口/,
];

export function normalizeCanonicalProductKey(raw: string): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/[\s\-_/+()（）:：，,。.;；｜|「」『』【】\[\]]/g, "")
    .trim();
}

function issueList(raw: string): CanonicalProductIssue[] {
  return BUSINESS_REGISTRATION_PATTERNS.some((pattern) => pattern.test(raw)) ? ["generic_business_registration"] : [];
}

function productId(canonicalName: string): string {
  return normalizeCanonicalProductKey(canonicalName);
}

function uniqSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(values).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

export function canonicalizeProductMention(raw: string): CanonicalizedProductMention[] {
  const original = String(raw ?? "").trim();
  if (!original) return [];

  const matchedNames = new Set(
    KNOWN_PRODUCT_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(original))).map((rule) => rule.canonicalName),
  );
  if (matchedNames.has("CoWoS-S") || matchedNames.has("CoWoS-L")) matchedNames.delete("CoWoS");
  if (matchedNames.has("HBM3E")) matchedNames.delete("HBM");

  const knownMatches = KNOWN_PRODUCT_RULES.filter((rule) => matchedNames.has(rule.canonicalName));
  if (knownMatches.length > 0) {
    return knownMatches.map((rule) => ({
      canonicalId: productId(rule.canonicalName),
      canonicalName: rule.canonicalName,
      aliases: [original],
      issues: [],
    }));
  }

  return [
    {
      canonicalId: productId(original),
      canonicalName: original,
      aliases: [original],
      issues: issueList(original),
    },
  ];
}

function incrementCompany(map: Map<string, CanonicalProductCompanyRef>, code: string, name: string) {
  const existing = map.get(code) ?? { code, name, mentions: 0 };
  existing.mentions += 1;
  map.set(code, existing);
}

function incrementTopic(map: Map<string, CanonicalProductTopicRef>, id: string, name: string) {
  const existing = map.get(id) ?? { id, name, mentions: 0 };
  existing.mentions += 1;
  map.set(id, existing);
}

export function buildCanonicalProductCatalog(roleCandidates: LegacyRoleCandidate[], generatedAt = new Date().toISOString()): CanonicalProductCatalog {
  const productMap = new Map<
    string,
    {
      canonicalName: string;
      aliases: Set<string>;
      rawMentionCount: number;
      companies: Map<string, CanonicalProductCompanyRef>;
      topics: Map<string, CanonicalProductTopicRef>;
      issues: Set<CanonicalProductIssue>;
    }
  >();

  let rawMentions = 0;
  for (const role of roleCandidates) {
    for (const rawProduct of role.products) {
      rawMentions += 1;
      for (const item of canonicalizeProductMention(rawProduct)) {
        const existing = productMap.get(item.canonicalId) ?? {
          canonicalName: item.canonicalName,
          aliases: new Set<string>(),
          rawMentionCount: 0,
          companies: new Map<string, CanonicalProductCompanyRef>(),
          topics: new Map<string, CanonicalProductTopicRef>(),
          issues: new Set<CanonicalProductIssue>(),
        };

        for (const alias of item.aliases) existing.aliases.add(alias);
        for (const issue of item.issues) existing.issues.add(issue);
        existing.rawMentionCount += 1;
        incrementCompany(existing.companies, role.companyCode, role.companyName);
        incrementTopic(existing.topics, role.topicId, role.topicName);
        productMap.set(item.canonicalId, existing);
      }
    }
  }

  const products: CanonicalProductCandidate[] = Array.from(productMap.entries())
    .map(([canonicalId, item]) => {
      const aliases = uniqSorted(item.aliases);
      const issues = Array.from(item.issues).sort() as CanonicalProductIssue[];
      return {
        canonicalId,
        canonicalName: item.canonicalName,
        aliases,
        normalizedAliases: uniqSorted(aliases.map(normalizeCanonicalProductKey)),
        rawMentionCount: item.rawMentionCount,
        companies: Array.from(item.companies.values()).sort((a, b) => b.mentions - a.mentions || a.code.localeCompare(b.code)),
        topics: Array.from(item.topics.values()).sort((a, b) => b.mentions - a.mentions || a.id.localeCompare(b.id)),
        issues,
        status: "candidate" as const,
        confidence: "unverified" as const,
        needsVerification: true as const,
      };
    })
    .sort((a, b) => b.rawMentionCount - a.rawMentionCount || a.canonicalName.localeCompare(b.canonicalName, "zh-Hant"));

  return {
    schemaVersion: 1,
    generatedAt,
    summary: {
      canonicalProducts: products.length,
      rawMentions,
      productsWithIssues: products.filter((product) => product.issues.length > 0).length,
    },
    products,
  };
}
