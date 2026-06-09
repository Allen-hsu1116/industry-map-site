import fs from "node:fs";
import path from "node:path";
import { normalizeCompanySwot } from "../src/lib/companySwot";
import { normalizeCompanyTopicRoles } from "../src/lib/companyTopicRoles";
import { buildCompanyAnalysisContext } from "../src/lib/companyAnalysisContext";
import { buildDailyAnalysisV2Artifact, planDailyAnalysisV2ArtifactWrite, type DailySignalInput } from "../src/lib/dailyAnalysisV2Generator";
import { loadStockKnowledgeRules } from "../src/lib/stockKnowledgeRules";
import type { CompanyProductKnowledge } from "../src/lib/productKnowledge";

const FINANCIALS_DIR = path.resolve("public/data/financials");
const ANALYSIS_V1_DIR = path.resolve("public/data/analysis");
const PRODUCT_KNOWLEDGE_DIR = path.resolve("public/data/product-knowledge");
const COMPANY_TOPIC_ROLES_DIR = path.resolve("public/data/company-topic-roles");
const COMPANY_SWOT_DIR = path.resolve("public/data/company-swot");
const STOCK_KNOWLEDGE_RULES_DIR = path.resolve("public/data/stock-knowledge-rules");
const OUTPUT_DIR = path.resolve("public/data/analysis-v2");

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function optionValue(name: string): string | undefined {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function readOptionalJson(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeProductKnowledge(raw: unknown, code: string): CompanyProductKnowledge | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Partial<CompanyProductKnowledge>;
  if (record.schemaVersion !== 1 || record.code !== code || !Array.isArray(record.products)) return null;
  return record as CompanyProductKnowledge;
}

function latestFinancialDate(raw: unknown): string {
  if (raw && typeof raw === "object") {
    const record = raw as { price?: { date?: string }; updatedAt?: string };
    if (record.price?.date) return record.price.date;
    if (record.updatedAt) return record.updatedAt;
  }
  return new Date().toISOString().slice(0, 10);
}

function signalFromV1(raw: unknown, key: "technical" | "chips"): DailySignalInput | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const record = raw as Record<string, unknown>;
  const section = record[key];
  if (!section || typeof section !== "object") return undefined;
  const value = section as { score?: unknown; summary?: unknown; signals?: unknown; risks?: unknown; watch?: unknown };
  return {
    score: typeof value.score === "number" ? value.score : 0,
    summary: typeof value.summary === "string" ? value.summary : undefined,
    signals: Array.isArray(value.signals) ? value.signals.filter((item): item is string => typeof item === "string") : [],
    risks: Array.isArray(value.risks) ? value.risks.filter((item): item is string => typeof item === "string") : [],
    watch: Array.isArray(value.watch) ? value.watch.filter((item): item is string => typeof item === "string") : [],
    sourceRefs: [],
  };
}

function companyName(rawFinancial: unknown, fallbackCode: string): string {
  if (rawFinancial && typeof rawFinancial === "object") {
    const record = rawFinancial as { name?: string };
    if (record.name) return record.name;
  }
  return fallbackCode;
}

function main() {
  const dryRun = hasFlag("--dry-run");
  const codeFilter = optionValue("--code");
  const limit = Number.parseInt(optionValue("--limit") ?? "0", 10);
  const stockKnowledgeRules = loadStockKnowledgeRules(STOCK_KNOWLEDGE_RULES_DIR);
  const files = fs.readdirSync(FINANCIALS_DIR)
    .filter((file) => file.endsWith(".json"))
    .filter((file) => !codeFilter || file === `${codeFilter}.json`)
    .sort()
    .slice(0, limit > 0 ? limit : undefined);

  if (!dryRun) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let changed = 0;
  for (const file of files) {
    const code = file.replace(/\.json$/, "");
    const rawFinancial = readOptionalJson(path.join(FINANCIALS_DIR, file));
    const v1 = readOptionalJson(path.join(ANALYSIS_V1_DIR, file));
    const name = companyName(rawFinancial, code);
    const context = buildCompanyAnalysisContext({
      companyCode: code,
      companyName: name,
      productKnowledge: normalizeProductKnowledge(readOptionalJson(path.join(PRODUCT_KNOWLEDGE_DIR, file)), code),
      topicRoles: normalizeCompanyTopicRoles(readOptionalJson(path.join(COMPANY_TOPIC_ROLES_DIR, file))),
      swot: normalizeCompanySwot(readOptionalJson(path.join(COMPANY_SWOT_DIR, file))),
      stockKnowledgeRules,
    });
    const analysis = buildDailyAnalysisV2Artifact({
      date: latestFinancialDate(rawFinancial),
      companyCode: code,
      companyName: name,
      context,
      technical: signalFromV1(v1, "technical"),
      chip: signalFromV1(v1, "chips"),
    });
    const outputPath = path.join(OUTPUT_DIR, file);
    const plan = planDailyAnalysisV2ArtifactWrite({ analysis, currentJson: fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : "" });
    if (plan.changed) changed += 1;
    if (!dryRun && plan.changed) fs.writeFileSync(outputPath, plan.json);
  }

  console.log(`${dryRun ? "Dry-run planned" : "Generated"} ${files.length} DailyAnalysisV2 artifacts; changed=${changed}; output=${path.relative(process.cwd(), OUTPUT_DIR)}`);
}

main();
