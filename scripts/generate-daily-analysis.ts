import fs from "node:fs";
import path from "node:path";
import { normalizeCanonicalTopics } from "../src/lib/canonicalTopics";
import { normalizeCompanySwot } from "../src/lib/companySwot";
import { normalizeCompanyTopicRoles } from "../src/lib/companyTopicRoles";
import { generateDailyAnalysis, type AnalysisInput } from "../src/lib/dailyAnalysis";
import { buildLegacyCompanyAnalysisFallbacks, mergeLegacyCompanyAnalysisFallback, type LegacyCompanyAnalysisFallback } from "../src/lib/legacyIndustryAnalysis";
import type { CompanyProductKnowledge } from "../src/lib/productKnowledge";

const FINANCIALS_DIR = path.resolve("public/data/financials");
const OUTPUT_DIR = path.resolve("public/data/analysis");
const CANONICAL_TOPICS_PATH = path.resolve("public/data/canonical-topics.json");
const INDUSTRIES_PATH = path.resolve("public/data/industries.json");
const COMPANY_TOPIC_ROLES_DIR = path.resolve("public/data/company-topic-roles");
const COMPANY_SWOT_DIR = path.resolve("public/data/company-swot");
const PRODUCT_KNOWLEDGE_DIR = path.resolve("public/data/product-knowledge");

interface IndexItem {
  code: string;
  name: string;
  generatedAt: string;
  technical: string;
  chips: string;
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

function enrichWithCanonicalKnowledge(input: AnalysisInput, canonicalTopics: AnalysisInput["canonicalTopics"], legacyFallbacks: Map<string, LegacyCompanyAnalysisFallback>): AnalysisInput {
  const code = input.code;
  const companyTopicRoles = normalizeCompanyTopicRoles(readOptionalJson(path.join(COMPANY_TOPIC_ROLES_DIR, `${code}.json`)));
  const companySwot = normalizeCompanySwot(readOptionalJson(path.join(COMPANY_SWOT_DIR, `${code}.json`)));
  const productKnowledge = normalizeProductKnowledge(readOptionalJson(path.join(PRODUCT_KNOWLEDGE_DIR, `${code}.json`)), code);
  const legacyEnrichedInput = mergeLegacyCompanyAnalysisFallback(input, legacyFallbacks.get(code));
  return {
    ...legacyEnrichedInput,
    canonicalTopics,
    companyTopicRoles,
    companySwot,
    productKnowledge,
  };
}

function main() {
  if (!fs.existsSync(FINANCIALS_DIR)) {
    throw new Error(`Financials directory not found: ${FINANCIALS_DIR}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const canonicalTopics = normalizeCanonicalTopics(readOptionalJson(CANONICAL_TOPICS_PATH));
  const legacyFallbacks = buildLegacyCompanyAnalysisFallbacks(readOptionalJson(INDUSTRIES_PATH));
  const files = fs.readdirSync(FINANCIALS_DIR).filter((file) => file.endsWith(".json")).sort();
  const index: IndexItem[] = [];

  for (const file of files) {
    const rawInput = JSON.parse(fs.readFileSync(path.join(FINANCIALS_DIR, file), "utf8")) as AnalysisInput;
    const input = enrichWithCanonicalKnowledge(rawInput, canonicalTopics, legacyFallbacks);
    const analysis = generateDailyAnalysis(input);
    fs.writeFileSync(path.join(OUTPUT_DIR, file), `${JSON.stringify(analysis, null, 2)}\n`);
    index.push({
      code: analysis.code,
      name: analysis.name,
      generatedAt: analysis.generatedAt,
      technical: analysis.technical.label,
      chips: analysis.chips.label,
    });
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), count: index.length, items: index }, null, 2)}\n`);
  console.log(`Generated ${index.length} daily analysis files in ${path.relative(process.cwd(), OUTPUT_DIR)}`);
}

main();
