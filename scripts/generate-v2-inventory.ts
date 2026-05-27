import fs from "node:fs";
import path from "node:path";
import { buildCanonicalProductCatalog } from "../src/lib/canonicalProducts";
import { buildCanonicalRoleCatalog } from "../src/lib/canonicalRoles";
import { buildLegacyKnowledgeInventory, rankPilotCompanies, type LegacyIndustriesData } from "../src/lib/legacyKnowledgeInventory";
import { buildSourceDiscoveryPlan } from "../src/lib/sourceDiscovery";

const ROOT = process.cwd();
const INDUSTRIES_PATH = path.join(ROOT, "public/data/industries.json");
const REPORT_DIR = path.join(ROOT, "reports");
const INVENTORY_PATH = path.join(REPORT_DIR, "v2-legacy-inventory.json");
const PILOT_PATH = path.join(REPORT_DIR, "v2-pilot-companies.json");
const SUMMARY_PATH = path.join(REPORT_DIR, "v2-inventory-summary.json");
const CANONICAL_PRODUCTS_PATH = path.join(REPORT_DIR, "v2-canonical-products.json");
const CANONICAL_ROLES_PATH = path.join(REPORT_DIR, "v2-canonical-role-candidates.json");
const SOURCE_DISCOVERY_PATH = path.join(REPORT_DIR, "v2-source-discovery-plan.json");

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const legacy = readJson<LegacyIndustriesData>(INDUSTRIES_PATH);
const inventory = buildLegacyKnowledgeInventory(legacy);
const canonicalProducts = buildCanonicalProductCatalog(inventory.roleCandidates, inventory.generatedAt);
const canonicalRoles = buildCanonicalRoleCatalog(inventory.roleCandidates, inventory.generatedAt);
const pilotCompanies = rankPilotCompanies(inventory.companies, 30).map((company, rank) => ({
  rank: rank + 1,
  code: company.code,
  name: company.name,
  priorityScore: company.priorityScore,
  priorityReasons: company.priorityReasons,
  topicCount: company.topicCount,
  roleCount: company.roleCount,
  productMentionCount: company.productMentionCount,
  swotMentionCount: company.swotMentionCount,
  topics: company.topics,
  topProductCandidates: company.productCandidates.slice(0, 10),
}));
const sourceDiscoveryPlan = buildSourceDiscoveryPlan(pilotCompanies, inventory.generatedAt);

const summary = {
  generatedAt: inventory.generatedAt,
  summary: inventory.summary,
  topTopicsByRoleCount: inventory.topics.slice(0, 20),
  canonicalRoleSummary: canonicalRoles.summary,
  sourceDiscoverySummary: sourceDiscoveryPlan.summary,
  topCanonicalProducts: canonicalProducts.products.slice(0, 30),
  topPilotCompanies: pilotCompanies.slice(0, 30),
  notes: [
    "Legacy data is preserved as runtime fallback; these reports are v2 migration candidates only.",
    "All extracted role candidates are unverified until evidence-backed enrichment promotes them.",
    "Do not use this report as high-confidence analytical truth without source validation.",
  ],
};

writeJson(INVENTORY_PATH, inventory);
writeJson(PILOT_PATH, pilotCompanies);
writeJson(SUMMARY_PATH, summary);
writeJson(CANONICAL_PRODUCTS_PATH, canonicalProducts);
writeJson(CANONICAL_ROLES_PATH, canonicalRoles);
writeJson(SOURCE_DISCOVERY_PATH, sourceDiscoveryPlan);

console.log("V2 legacy inventory generated");
console.log(`Topics: ${inventory.summary.topics}`);
console.log(`Groups: ${inventory.summary.groups}`);
console.log(`Company roles: ${inventory.summary.companyRoles}`);
console.log(`Unique companies: ${inventory.summary.uniqueCompanies}`);
console.log(`Product mentions: ${inventory.summary.productMentions}`);
console.log(`Customer mentions: ${inventory.summary.customerMentions}`);
console.log(`Tech-focus mentions: ${inventory.summary.techFocusMentions}`);
console.log(`SWOT mentions: ${inventory.summary.swotMentions}`);
console.log(`Canonical products: ${canonicalProducts.summary.canonicalProducts}`);
console.log(`Canonical products with issues: ${canonicalProducts.summary.productsWithIssues}`);
console.log(`Canonical role candidates: ${canonicalRoles.summary.roles}`);
console.log(`Source discovery companies: ${sourceDiscoveryPlan.summary.companies}`);
console.log(`Source candidates: ${sourceDiscoveryPlan.summary.sourceCandidates}`);
console.log(`Reports:`);
console.log(`- ${path.relative(ROOT, INVENTORY_PATH)}`);
console.log(`- ${path.relative(ROOT, PILOT_PATH)}`);
console.log(`- ${path.relative(ROOT, SUMMARY_PATH)}`);
console.log(`- ${path.relative(ROOT, CANONICAL_PRODUCTS_PATH)}`);
console.log(`- ${path.relative(ROOT, CANONICAL_ROLES_PATH)}`);
console.log(`- ${path.relative(ROOT, SOURCE_DISCOVERY_PATH)}`);
console.log("Top pilot companies:");
for (const company of pilotCompanies.slice(0, 10)) {
  console.log(`${company.rank}. ${company.code} ${company.name} score=${company.priorityScore} (${company.priorityReasons.join(", ")})`);
}
