import fs from "node:fs";
import path from "node:path";
import { normalizeCompanySwot } from "../src/lib/companySwot";
import { normalizeCompanyTopicRoles } from "../src/lib/companyTopicRoles";
import { buildKnowledgeCoverageReport, formatKnowledgeCoverageSummary, type CoverageAnalysisInput, type CoverageCompanyInput } from "../src/lib/knowledgeCoverage";
import type { CompanyProductKnowledge } from "../src/lib/productKnowledge";

const DATA_DIR = path.resolve("public/data");
const REPORTS_DIR = path.resolve("reports");
const COMPANIES_PATH = path.join(DATA_DIR, "companies.json");
const ANALYSIS_DIR = path.join(DATA_DIR, "analysis");
const PRODUCT_KNOWLEDGE_DIR = path.join(DATA_DIR, "product-knowledge");
const COMPANY_TOPIC_ROLES_DIR = path.join(DATA_DIR, "company-topic-roles");
const COMPANY_SWOT_DIR = path.join(DATA_DIR, "company-swot");
const REPORT_JSON_PATH = path.join(REPORTS_DIR, "knowledge-coverage-report.json");
const SUMMARY_MD_PATH = path.join(REPORTS_DIR, "knowledge-coverage-summary.md");

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function readOptionalJson(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) return null;
  return readJson<unknown>(filePath);
}

function listJsonFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => path.join(dirPath, fileName));
}

function normalizeCompanyList(raw: unknown): CoverageCompanyInput[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): CoverageCompanyInput[] => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const code = typeof record.code === "string" ? record.code.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const topics = Array.isArray(record.topics) ? record.topics.filter((topic): topic is string => typeof topic === "string" && topic.trim().length > 0).sort() : [];
    if (!code || !name) return [];
    return [{ code, name, topics }];
  }).sort((a, b) => a.code.localeCompare(b.code));
}

function loadAnalysisByCode(): Record<string, CoverageAnalysisInput | undefined> {
  const analysisByCode: Record<string, CoverageAnalysisInput | undefined> = {};
  for (const filePath of listJsonFiles(ANALYSIS_DIR)) {
    if (path.basename(filePath) === "index.json") continue;
    const raw = readOptionalJson(filePath);
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const code = typeof record.code === "string" ? record.code : path.basename(filePath, ".json");
    const industry = record.industry && typeof record.industry === "object" ? record.industry as Record<string, unknown> : undefined;
    const label = typeof industry?.label === "string" ? industry.label : undefined;
    const knowledgeBasis = typeof industry?.knowledgeBasis === "string" ? industry.knowledgeBasis as CoverageAnalysisInput["knowledgeBasis"] : undefined;
    analysisByCode[code] = { label, knowledgeBasis };
  }
  return analysisByCode;
}

function loadProductKnowledgeCodes(): Set<string> {
  const codes = new Set<string>();
  for (const filePath of listJsonFiles(PRODUCT_KNOWLEDGE_DIR)) {
    const raw = readOptionalJson(filePath);
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Partial<CompanyProductKnowledge>;
    const hasEvidenceBackedProduct = Array.isArray(record.products) && record.products.some((product) => (
      product
      && typeof product.name === "string"
      && typeof product.plainLanguage === "string"
      && typeof product.whyItMatters === "string"
      && Array.isArray(product.evidence)
      && product.evidence.length > 0
      && product.confidence !== "low"
    ));
    if (record.schemaVersion === 1 && typeof record.code === "string" && hasEvidenceBackedProduct) codes.add(record.code);
  }
  return codes;
}

function loadTopicRoleStats() {
  const stats = new Map<string, { anyRoleCount: number; verifiedRoleCount: number }>();
  for (const filePath of listJsonFiles(COMPANY_TOPIC_ROLES_DIR)) {
    const roles = normalizeCompanyTopicRoles(readOptionalJson(filePath));
    if (!roles) continue;
    const usableRoles = roles.roles.filter((role) => role.status !== "rejected");
    const verifiedRoles = usableRoles.filter((role) => role.status === "verified" && (role.confidence === "high" || role.confidence === "medium") && role.evidence.length > 0);
    stats.set(roles.companyCode, {
      anyRoleCount: usableRoles.length,
      verifiedRoleCount: verifiedRoles.length,
    });
  }
  return stats;
}

function loadSwotStats() {
  const stats = new Map<string, { itemCount: number; verifiedItemCount: number; categories: Set<string> }>();
  for (const filePath of listJsonFiles(COMPANY_SWOT_DIR)) {
    const swot = normalizeCompanySwot(readOptionalJson(filePath));
    if (!swot) continue;
    const usableItems = swot.items.filter((item) => item.status !== "rejected");
    const verifiedItems = usableItems.filter((item) => item.status === "verified" && (item.confidence === "high" || item.confidence === "medium") && item.evidence.length > 0);
    stats.set(swot.companyCode, {
      itemCount: usableItems.length,
      verifiedItemCount: verifiedItems.length,
      categories: new Set(verifiedItems.map((item) => item.category)),
    });
  }
  return stats;
}

function main() {
  const companies = normalizeCompanyList(readJson<unknown>(COMPANIES_PATH));
  const report = buildKnowledgeCoverageReport({
    companies,
    analysisByCode: loadAnalysisByCode(),
    productKnowledgeCodes: loadProductKnowledgeCodes(),
    topicRoleByCode: loadTopicRoleStats(),
    swotByCode: loadSwotStats(),
  });

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(SUMMARY_MD_PATH, formatKnowledgeCoverageSummary(report));

  console.log(`Knowledge coverage report written to ${REPORT_JSON_PATH}`);
  console.log(`Knowledge coverage summary written to ${SUMMARY_MD_PATH}`);
  console.log(`Grades: A=${report.summary.gradeDistribution.A}, B=${report.summary.gradeDistribution.B}, C=${report.summary.gradeDistribution.C}, D=${report.summary.gradeDistribution.D}, F=${report.summary.gradeDistribution.F}`);
}

main();
