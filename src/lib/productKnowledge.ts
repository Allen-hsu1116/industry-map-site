export interface ProductEvidence {
  sourceId: string;
  publisher: string;
  title: string;
  url: string;
  publishedAt?: string;
  retrievedAt?: string;
  claim: string;
  quote?: string;
}

export interface ProductKnowledgeItem {
  name: string;
  aliases?: string[];
  category: string;
  plainLanguage: string;
  whyItMatters: string;
  topicFit?: Record<string, string>;
  businessImpact?: string;
  evidence: ProductEvidence[];
  lastVerified: string;
  confidence: "high" | "medium" | "low";
}

export interface CompanyProductKnowledge {
  schemaVersion: number;
  code: string;
  name: string;
  updatedAt: string;
  products: ProductKnowledgeItem[];
}

export type ProductNarrative = {
  name: string;
  description: string;
  whyItMatters?: string;
  topicFit?: string;
  businessImpact?: string;
  sourceLabels?: string[];
  sourceUrls?: string[];
  lastVerified?: string;
  confidence?: ProductKnowledgeItem["confidence"];
};

function parsedProductName(raw: string): string {
  return String(raw ?? "").split(/[:：]/)[0]?.trim() ?? "";
}

function normalizeProductToken(raw: string): string {
  return parsedProductName(raw)
    .toLowerCase()
    .replace(/[\s\-_/+()（）:：，,。.;；]/g, "")
    .trim();
}

export function findProductKnowledgeItem(raw: string, knowledge: CompanyProductKnowledge | null | undefined, topicId?: string): ProductKnowledgeItem | undefined {
  const rawToken = normalizeProductToken(raw);
  if (!rawToken || !knowledge?.products?.length) return undefined;

  const candidates = knowledge.products
    .filter((item) => !topicId || !item.topicFit || Boolean(item.topicFit[topicId]) || Object.keys(item.topicFit).length === 0)
    .map((item) => ({
      item,
      tokens: [item.name, ...(item.aliases ?? [])].map(normalizeProductToken).filter(Boolean),
    }));

  return candidates.find(({ tokens }) => tokens.some((token) => rawToken === token || rawToken.includes(token) || token.includes(rawToken)))?.item;
}

export function productKnowledgeToNarrative(item: ProductKnowledgeItem, topicId?: string): ProductNarrative {
  return {
    name: item.name,
    description: item.plainLanguage,
    whyItMatters: item.whyItMatters,
    topicFit: topicId ? item.topicFit?.[topicId] : undefined,
    businessImpact: item.businessImpact,
    sourceLabels: item.evidence.map((source) => `${source.publisher}：${source.title}`),
    sourceUrls: item.evidence.map((source) => source.url),
    lastVerified: item.lastVerified,
    confidence: item.confidence,
  };
}
