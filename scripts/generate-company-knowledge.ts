import fs from "node:fs";
import path from "node:path";
import { buildCompanyKnowledge, type CompanyKnowledgeInput } from "../src/lib/companyKnowledge";

const FINANCIALS_DIR = path.resolve("public/data/financials");
const OUTPUT_DIR = path.resolve("public/data/company-knowledge");

interface IndexItem {
  code: string;
  name: string;
  products: number;
  topicRoles: number;
  swotFreshness: string;
  lastVerified?: string;
}

function main() {
  if (!fs.existsSync(FINANCIALS_DIR)) {
    throw new Error(`Financials directory not found: ${FINANCIALS_DIR}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = fs.readdirSync(FINANCIALS_DIR).filter((file) => file.endsWith(".json")).sort();
  const generatedAt = new Date();
  const index: IndexItem[] = [];

  for (const file of files) {
    const input = JSON.parse(fs.readFileSync(path.join(FINANCIALS_DIR, file), "utf8")) as CompanyKnowledgeInput;
    const knowledge = buildCompanyKnowledge(input, generatedAt);
    const payload = {
      schemaVersion: 1,
      code: input.code,
      name: input.name,
      generatedAt: generatedAt.toISOString(),
      knowledge,
    };
    fs.writeFileSync(path.join(OUTPUT_DIR, file), `${JSON.stringify(payload, null, 2)}\n`);
    index.push({
      code: input.code,
      name: input.name,
      products: knowledge.products.length,
      topicRoles: knowledge.topicRoles.length,
      swotFreshness: knowledge.swot.freshness,
      lastVerified: knowledge.swot.lastVerified,
    });
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.json"), `${JSON.stringify({ generatedAt: generatedAt.toISOString(), count: index.length, items: index }, null, 2)}\n`);
  console.log(`Generated ${index.length} company knowledge files in ${path.relative(process.cwd(), OUTPUT_DIR)}`);
}

main();
