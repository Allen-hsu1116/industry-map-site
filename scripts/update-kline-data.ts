import fs from "node:fs";
import path from "node:path";
import { normalizeFinMindPriceRow, planKLineUpdate, selectPriorityCompanies, type CompanyPriorityInput, type FinancialKLineInput, type KLineDailyPrice } from "../src/lib/klineRefresh";

interface CliOptions {
  limit: number;
  startDate: string;
  endDate: string;
  dryRun: boolean;
  codes: string[];
}

const ROOT = process.cwd();
const COMPANIES_PATH = path.join(ROOT, "public/data/companies.json");
const FINANCIALS_DIR = path.join(ROOT, "public/data/financials");

function todayTaipei(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function daysAgo(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

function parseArgs(argv: string[]): CliOptions {
  const endDate = todayTaipei();
  const options: CliOptions = { limit: 30, startDate: daysAgo(endDate, 10), endDate, dryRun: false, codes: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--limit") options.limit = Number(argv[++index] ?? options.limit);
    else if (arg.startsWith("--limit=")) options.limit = Number(arg.split("=")[1]);
    else if (arg === "--start-date") options.startDate = argv[++index] ?? options.startDate;
    else if (arg.startsWith("--start-date=")) options.startDate = arg.split("=")[1];
    else if (arg === "--end-date") options.endDate = argv[++index] ?? options.endDate;
    else if (arg.startsWith("--end-date=")) options.endDate = arg.split("=")[1];
    else if (arg === "--codes") options.codes = String(argv[++index] ?? "").split(",").map((code) => code.trim()).filter(Boolean);
    else if (arg.startsWith("--codes=")) options.codes = arg.split("=")[1].split(",").map((code) => code.trim()).filter(Boolean);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isFinite(options.limit) || options.limit <= 0) throw new Error("--limit must be a positive number");
  return options;
}

async function fetchFinMindDailyPrices(code: string, startDate: string, endDate: string): Promise<KLineDailyPrice[]> {
  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockPrice");
  url.searchParams.set("data_id", code);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`FinMind HTTP ${response.status} for ${code}`);
  const payload = await response.json() as { status?: number; msg?: string; data?: Record<string, unknown>[] };
  if (payload.status !== 200 || !Array.isArray(payload.data)) {
    throw new Error(`FinMind invalid payload for ${code}: ${payload.msg ?? "missing data"}`);
  }
  return payload.data.map((row) => normalizeFinMindPriceRow(row));
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, "utf8")) as CompanyPriorityInput[];
  const selected = options.codes.length
    ? companies.filter((company) => options.codes.includes(company.code))
    : selectPriorityCompanies(companies, options.limit);

  console.log(`K-line refresh: ${selected.length} companies, ${options.startDate}..${options.endDate}, dryRun=${options.dryRun}`);
  let changedCount = 0;

  for (const company of selected) {
    const filePath = path.join(FINANCIALS_DIR, `${company.code}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`skip ${company.code}: missing financial file`);
      continue;
    }
    const financial = JSON.parse(fs.readFileSync(filePath, "utf8")) as FinancialKLineInput;
    const rows = await fetchFinMindDailyPrices(company.code, options.startDate, options.endDate);
    if (rows.length === 0) {
      console.log(`skip ${company.code}: FinMind returned no rows`);
      continue;
    }
    const plan = planKLineUpdate(financial, rows, { asOfDate: options.endDate, dryRun: options.dryRun });
    if (plan.changed) {
      changedCount += 1;
      if (plan.writableJson) fs.writeFileSync(filePath, plan.writableJson);
      console.log(`${options.dryRun ? "would update" : "updated"} ${company.code}: latest=${plan.latestDate}, added=${plan.addedDates.join(",") || "0 new dates"}`);
    } else {
      console.log(`unchanged ${company.code}: latest=${plan.latestDate}`);
    }
  }

  console.log(`K-line refresh complete: changed=${changedCount}/${selected.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
