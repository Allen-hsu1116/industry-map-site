import fs from "node:fs";
import path from "node:path";
import companiesData from "../../../public/data/companies.json";
import topicMapData from "../../../public/data/canonical-topic-map.json";
import { CompaniesClient } from "./CompaniesClient";
import { buildCompanyDatabase, type CompanyDatabaseCompanyInput, type CompanyDatabaseFinancialStats, type CompanyDatabaseProductStats, type CompanyDatabaseSwotStats, type CompanyDatabaseTopicRoleStats, type CompanyRoleConfidence } from "@/lib/companyDatabase";
import type { TopicMapSnapshot } from "@/lib/topicOverview";

export const dynamic = "force-static";

type JsonObject = Record<string, unknown>;

const financialsDirectory = path.join(process.cwd(), "public/data/financials");
const productKnowledgeDirectory = path.join(process.cwd(), "public/data/product-knowledge");
const topicRolesDirectory = path.join(process.cwd(), "public/data/company-topic-roles");
const swotDirectory = path.join(process.cwd(), "public/data/company-swot");

function readJsonFiles(directory: string): JsonObject[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")) as JsonObject);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function arrayValue(value: unknown): JsonObject[] {
  return Array.isArray(value) ? value.filter((item): item is JsonObject => typeof item === "object" && item !== null && !Array.isArray(item)) : [];
}

function latestDate(rows: JsonObject[], field = "date"): string | undefined {
  const dates = rows.map((row) => stringValue(row[field])).filter((value): value is string => Boolean(value));
  return dates.sort().at(-1);
}

function confidenceRank(value: string): number {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

function buildProductStats(): Map<string, CompanyDatabaseProductStats> {
  return new Map(readJsonFiles(productKnowledgeDirectory).map((file) => {
    const code = stringValue(file.code) ?? stringValue(file.companyCode) ?? "";
    return [code, { updatedAt: stringValue(file.updatedAt) ?? stringValue(file.lastVerified) ?? "", productCount: arrayValue(file.products).length }] as const;
  }).filter(([code]) => Boolean(code)));
}

function buildTopicRoleStats(): Map<string, CompanyDatabaseTopicRoleStats> {
  return new Map(readJsonFiles(topicRolesDirectory).map((file) => {
    const code = stringValue(file.companyCode) ?? stringValue(file.code) ?? "";
    const roles = arrayValue(file.roles);
    const counts = { verifiedCount: 0, candidateCount: 0, rejectedCount: 0 };
    let highestConfidence: CompanyRoleConfidence = "insufficient";
    for (const role of roles) {
      const status = stringValue(role.status);
      if (status === "verified") counts.verifiedCount += 1;
      else if (status === "candidate") counts.candidateCount += 1;
      else if (status === "rejected") counts.rejectedCount += 1;
      const confidence = stringValue(role.confidence) ?? "";
      if (["high", "medium", "low"].includes(confidence) && confidenceRank(confidence) > confidenceRank(highestConfidence)) highestConfidence = confidence as CompanyRoleConfidence;
    }
    return [code, { updatedAt: stringValue(file.updatedAt) ?? "", ...counts, highestConfidence: highestConfidence === "insufficient" ? "low" : highestConfidence }] as const;
  }).filter(([code]) => Boolean(code)));
}

function buildSwotStats(): Map<string, CompanyDatabaseSwotStats> {
  return new Map(readJsonFiles(swotDirectory).map((file) => {
    const code = stringValue(file.companyCode) ?? stringValue(file.code) ?? "";
    const items = arrayValue(file.items).filter((item) => stringValue(item.status) !== "rejected");
    return [code, {
      updatedAt: stringValue(file.updatedAt) ?? "",
      verifiedCount: items.filter((item) => stringValue(item.status) === "verified").length,
      itemCount: items.length,
      categories: Array.from(new Set(items.map((item) => stringValue(item.category)).filter((value): value is string => Boolean(value)))),
    }] as const;
  }).filter(([code]) => Boolean(code)));
}

function buildFinancialStats(): Map<string, CompanyDatabaseFinancialStats> {
  return new Map(readJsonFiles(financialsDirectory).map((file) => {
    const code = stringValue(file.code) ?? stringValue(file.symbol) ?? "";
    const trends = typeof file.trends === "object" && file.trends !== null && !Array.isArray(file.trends) ? file.trends as JsonObject : {};
    const dailyPrices = arrayValue(trends.daily_prices);
    const institutionalHistory = arrayValue(file.institutional_history);
    const marginHistory = arrayValue(file.margin_history);
    const perHistory = arrayValue(file.per_history);
    const valuation = typeof file.valuation === "object" && file.valuation !== null && !Array.isArray(file.valuation) ? file.valuation as JsonObject : {};
    return [code, {
      lastUpdated: stringValue(file.updatedAt) ?? stringValue(file.last_updated),
      latestPriceDate: latestDate(dailyPrices),
      latestChipDate: latestDate([...institutionalHistory, ...marginHistory]),
      latestValuationDate: latestDate(perHistory) ?? stringValue(valuation.date),
    }] as const;
  }).filter(([code]) => Boolean(code)));
}

export default function CompaniesPage() {
  const database = buildCompanyDatabase({
    companies: companiesData as CompanyDatabaseCompanyInput[],
    topicMap: topicMapData as TopicMapSnapshot,
    productKnowledgeByCode: buildProductStats(),
    topicRolesByCode: buildTopicRoleStats(),
    swotByCode: buildSwotStats(),
    financialsByCode: buildFinancialStats(),
  });

  return <CompaniesClient database={database} />;
}
