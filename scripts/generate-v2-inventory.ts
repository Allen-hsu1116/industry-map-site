import fs from "node:fs";
import path from "node:path";
import { buildLegacyKnowledgeInventory, rankPilotCompanies, type LegacyIndustriesData } from "../src/lib/legacyKnowledgeInventory";

const ROOT = process.cwd();
const INDUSTRIES_PATH = path.join(ROOT, "public/data/industries.json");
const REPORT_DIR = path.join(ROOT, "reports");
const INVENTORY_PATH = path.join(REPORT_DIR, "v2-legacy-inventory.json");
const PILOT_PATH = path.join(REPORT_DIR, "v2-pilot-companies.json");
const SUMMARY_PATH = path.join(REPORT_DIR, "v2-inventory-summary.json");

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const legacy = readJson<LegacyIndustriesData>(INDUSTRIES_PATH);
const inventory = buildLegacyKnowledgeInventory(legacy);
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

const summary = {
  generatedAt: inventory.generatedAt,
  summary: inventory.summary,
  topTopicsByRoleCount: inventory.topics.slice(0, 20),
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

console.log("V2 legacy inventory generated");
console.log(`Topics: ${inventory.summary.topics}`);
console.log(`Groups: ${inventory.summary.groups}`);
console.log(`Company roles: ${inventory.summary.companyRoles}`);
console.log(`Unique companies: ${inventory.summary.uniqueCompanies}`);
console.log(`Product mentions: ${inventory.summary.productMentions}`);
console.log(`Customer mentions: ${inventory.summary.customerMentions}`);
console.log(`Tech-focus mentions: ${inventory.summary.techFocusMentions}`);
console.log(`SWOT mentions: ${inventory.summary.swotMentions}`);
console.log(`Reports:`);
console.log(`- ${path.relative(ROOT, INVENTORY_PATH)}`);
console.log(`- ${path.relative(ROOT, PILOT_PATH)}`);
console.log(`- ${path.relative(ROOT, SUMMARY_PATH)}`);
console.log("Top pilot companies:");
for (const company of pilotCompanies.slice(0, 10)) {
  console.log(`${company.rank}. ${company.code} ${company.name} score=${company.priorityScore} (${company.priorityReasons.join(", ")})`);
}
