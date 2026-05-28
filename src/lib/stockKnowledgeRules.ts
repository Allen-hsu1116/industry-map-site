import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const stockKnowledgeRuleCategories = ["technical", "fundamental", "chips", "strategy", "risk"] as const;
export type StockKnowledgeRuleCategory = typeof stockKnowledgeRuleCategories[number];

export interface StockKnowledgeRuleSource {
  title: string;
  url: string;
}

export interface StockKnowledgeRule {
  id: string;
  category: StockKnowledgeRuleCategory;
  title: string;
  principle: string;
  positiveSignals: string[];
  negativeSignals: string[];
  scoringImpact: {
    positive: number;
    negative: number;
  };
  riskControls: string[];
  source: StockKnowledgeRuleSource;
}

export interface StockKnowledgeRulesFile {
  schemaVersion: 1;
  category: StockKnowledgeRuleCategory;
  updatedAt: string;
  source: StockKnowledgeRuleSource;
  rules: StockKnowledgeRule[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function isCategory(value: unknown): value is StockKnowledgeRuleCategory {
  return typeof value === "string" && stockKnowledgeRuleCategories.includes(value as StockKnowledgeRuleCategory);
}

function normalizeSource(value: unknown, fallback?: StockKnowledgeRuleSource): StockKnowledgeRuleSource | null {
  if (!isRecord(value)) return fallback ?? null;
  const title = typeof value.title === "string" ? value.title.trim() : fallback?.title;
  const url = typeof value.url === "string" ? value.url.trim() : fallback?.url;
  if (!title || !url || !url.startsWith("https://")) return null;
  return { title, url };
}

function normalizeRule(value: unknown, category: StockKnowledgeRuleCategory, fileSource: StockKnowledgeRuleSource): StockKnowledgeRule | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === "string" ? value.id.trim() : "";
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const principle = typeof value.principle === "string" ? value.principle.trim() : "";
  const scoringImpact = isRecord(value.scoringImpact) ? value.scoringImpact : null;
  const positive = typeof scoringImpact?.positive === "number" ? scoringImpact.positive : Number.NaN;
  const negative = typeof scoringImpact?.negative === "number" ? scoringImpact.negative : Number.NaN;
  const source = normalizeSource(value.source, fileSource);
  const positiveSignals = asStringArray(value.positiveSignals);
  const negativeSignals = asStringArray(value.negativeSignals);
  const riskControls = asStringArray(value.riskControls);

  if (!id.startsWith(`${category}.`) || !title || !principle || !Number.isFinite(positive) || !Number.isFinite(negative) || !source) return null;
  if (positiveSignals.length + negativeSignals.length === 0) return null;

  return { id, category, title, principle, positiveSignals, negativeSignals, scoringImpact: { positive, negative }, riskControls, source };
}

export function normalizeStockKnowledgeRules(value: unknown): StockKnowledgeRulesFile | null {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isCategory(value.category)) return null;
  const source = normalizeSource(value.source);
  const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : "";
  if (!source || !updatedAt) return null;
  const rules = Array.isArray(value.rules)
    ? value.rules.map((rule) => normalizeRule(rule, value.category as StockKnowledgeRuleCategory, source)).filter((rule): rule is StockKnowledgeRule => Boolean(rule))
    : [];
  if (rules.length === 0 || rules.length !== (Array.isArray(value.rules) ? value.rules.length : 0)) return null;
  return { schemaVersion: 1, category: value.category, updatedAt, source, rules };
}

export function loadStockKnowledgeRules(rulesDir = join(process.cwd(), "public/data/stock-knowledge-rules")): StockKnowledgeRulesFile[] {
  return readdirSync(rulesDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      const normalized = normalizeStockKnowledgeRules(JSON.parse(readFileSync(join(rulesDir, file), "utf8")));
      if (!normalized) throw new Error(`Invalid stock knowledge rules file: ${file}`);
      return normalized;
    });
}
