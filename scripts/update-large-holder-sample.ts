import fs from "node:fs";
import path from "node:path";
import { normalizeFinMindHoldingRows, planLargeHolderSampleRefresh, type LargeHolderFetchedCompany, type LargeHolderSampleArtifact } from "../src/lib/largeHolderRefresh";
import { selectPriorityCompanies, type CompanyPriorityInput } from "../src/lib/klineRefresh";

interface CliOptions {
  limit: number;
  startDate: string;
  endDate: string;
  dryRun: boolean;
  codes: string[];
}

const ROOT = process.cwd();
const COMPANIES_PATH = path.join(ROOT, "public/data/companies.json");
const SAMPLE_PATH = path.join(ROOT, "public/data/large-holder-sample.json");

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
  const options: CliOptions = { limit: 30, startDate: daysAgo(endDate, 45), endDate, dryRun: false, codes: [] };
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

function selectedCompanies(companies: CompanyPriorityInput[], options: CliOptions): CompanyPriorityInput[] {
  if (options.codes.length) {
    const requested = new Set(options.codes);
    return companies.filter((company) => requested.has(company.code));
  }
  return selectPriorityCompanies(companies, options.limit);
}

function finMindToken(): string | undefined {
  return process.env.FINMIND_TOKEN || process.env.FINMIND_API_TOKEN || process.env.FINMIND_API_KEY;
}

async function fetchFinMindHoldingRows(code: string, startDate: string, endDate: string): Promise<Record<string, unknown>[]> {
  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockHoldingSharesPer");
  url.searchParams.set("data_id", code);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  const token = finMindToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await fetch(url, headers ? { headers } : undefined);
  if (!response.ok) {
    const authHint = token
      ? "FINMIND_TOKEN is present; verify the token tier and Authorization header handling."
      : "FINMIND_TOKEN is missing; TaiwanStockHoldingSharesPer requires Backer/Sponsor auth.";
    throw new Error(`FinMind HTTP ${response.status} for TaiwanStockHoldingSharesPer ${code}. ${authHint}`);
  }
  const payload = await response.json() as { status?: number; msg?: string; data?: Record<string, unknown>[] };
  if (payload.status !== 200 || !Array.isArray(payload.data)) {
    throw new Error(`FinMind invalid payload for TaiwanStockHoldingSharesPer ${code}: ${payload.msg ?? "missing data"}`);
  }
  return payload.data;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, "utf8")) as CompanyPriorityInput[];
  const current = JSON.parse(fs.readFileSync(SAMPLE_PATH, "utf8")) as LargeHolderSampleArtifact;
  const selected = selectedCompanies(companies, options);
  const fetched: LargeHolderFetchedCompany[] = [];

  console.log(`Large-holder refresh: ${selected.length} companies, ${options.startDate}..${options.endDate}, dryRun=${options.dryRun}`);
  for (const company of selected) {
    try {
      const rows = normalizeFinMindHoldingRows(await fetchFinMindHoldingRows(company.code, options.startDate, options.endDate), company.code);
      fetched.push({ code: company.code, name: company.name ?? company.code, rows });
      console.log(`${rows.length > 0 ? "fetched" : "empty"} ${company.code}: rows=${rows.length}`);
    } catch (error) {
      console.log(`skip ${company.code}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const plan = planLargeHolderSampleRefresh(current, companies, fetched, options);
  if (plan.changed && plan.writableJson) fs.writeFileSync(SAMPLE_PATH, plan.writableJson);
  const action = plan.changed ? (options.dryRun ? "would update" : "updated") : "unchanged";
  console.log(`${action} large-holder sample: updated=${plan.updatedCodes.length}/${plan.selectedCodes.length}, skipped=${plan.skippedCodes.length}, latest=${plan.latestDate ?? "missing"}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
