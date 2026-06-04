import fs from "node:fs";
import path from "node:path";
import { buildStrongStockRanking, type StrongStockCompanyInput, type StrongStockRanking, type StrongStockTimeframe } from "../src/lib/strongStockRanking";

const COMPANIES_PATH = path.resolve("public/data/companies.json");
const FINANCIALS_DIR = path.resolve("public/data/financials");
const OUTPUT_PATH = path.resolve("public/data/strong-stock-ranking.json");

interface CompanyRow {
  code: string;
  name: string;
  topic_count?: number;
}

interface FinancialSnapshot {
  code?: string;
  name?: string;
  trends?: {
    daily_prices?: Array<{
      date: string;
      open: number | string;
      high: number | string;
      low: number | string;
      close: number | string;
      volume: number | string;
    }>;
  };
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function loadCompanies(): StrongStockCompanyInput[] {
  const companies = readJson<CompanyRow[]>(COMPANIES_PATH);
  return companies.flatMap((company) => {
    const filePath = path.join(FINANCIALS_DIR, `${company.code}.json`);
    if (!fs.existsSync(filePath)) return [];
    const financial = readJson<FinancialSnapshot>(filePath);
    return [{
      code: company.code,
      name: company.name || financial.name || company.code,
      topicCount: company.topic_count ?? 0,
      dailyPrices: financial.trends?.daily_prices ?? [],
    }];
  });
}

function main() {
  const companies = loadCompanies();
  const timeframes: StrongStockTimeframe[] = ["1d", "5d", "20d"];
  const rankings: StrongStockRanking[] = timeframes.map((timeframe) => buildStrongStockRanking(companies, { timeframe, topN: 20 }));
  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      name: "FinMind TaiwanStockPrice checked-in financial snapshots",
      scope: "all public/data/financials/*.json companies with fresh latest K-line date; stale companies excluded",
      semantics: "Derived strong-stock ranking from price/K-line technical signals only. Not a full-market official ranking and not investment advice.",
    },
    rankings,
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_PATH)} (${rankings.map((ranking) => `${ranking.timeframe}:${ranking.items.length}`).join(", ")})`);
}

main();
