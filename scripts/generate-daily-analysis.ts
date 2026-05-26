import fs from "node:fs";
import path from "node:path";
import { generateDailyAnalysis, type AnalysisInput } from "../src/lib/dailyAnalysis";

const FINANCIALS_DIR = path.resolve("public/data/financials");
const OUTPUT_DIR = path.resolve("public/data/analysis");

interface IndexItem {
  code: string;
  name: string;
  generatedAt: string;
  technical: string;
  chips: string;
}

function main() {
  if (!fs.existsSync(FINANCIALS_DIR)) {
    throw new Error(`Financials directory not found: ${FINANCIALS_DIR}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = fs.readdirSync(FINANCIALS_DIR).filter((file) => file.endsWith(".json")).sort();
  const index: IndexItem[] = [];

  for (const file of files) {
    const input = JSON.parse(fs.readFileSync(path.join(FINANCIALS_DIR, file), "utf8")) as AnalysisInput;
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
