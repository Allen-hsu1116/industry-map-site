import fs from "node:fs";
import path from "node:path";
import { buildEventFocusSnapshot, normalizeTwseMajorNewsRows, type CompanyTopicRoleForEvent, type EventFocusSnapshot, type OfficialMajorNewsRow } from "../src/lib/eventFocus";
import { normalizeCompanyTopicRoles } from "../src/lib/companyTopicRoles";

const COMPANIES_PATH = path.resolve("public/data/companies.json");
const COMPANY_TOPIC_ROLES_DIR = path.resolve("public/data/company-topic-roles");
const OUTPUT_PATH = path.resolve("public/data/event-focus.json");
const TWSE_MAJOR_NEWS_URL = "https://openapi.twse.com.tw/v1/opendata/t187ap04_L";

interface Options {
  dryRun: boolean;
  limit: number;
}

function parseArgs(argv: string[]): Options {
  const options: Options = { dryRun: false, limit: 80 };
  for (const arg of argv) {
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg.startsWith("--limit=")) options.limit = Number(arg.slice("--limit=".length));
  }
  if (!Number.isFinite(options.limit) || options.limit <= 0) options.limit = 80;
  return options;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function loadTrackedCompanyCodes(): Set<string> {
  const companies = readJson<Array<{ code?: string }>>(COMPANIES_PATH);
  return new Set(companies.map((company) => String(company.code ?? "").trim()).filter(Boolean));
}

function loadCompanyTopicRoles(): Record<string, CompanyTopicRoleForEvent[]> {
  if (!fs.existsSync(COMPANY_TOPIC_ROLES_DIR)) return {};
  const result: Record<string, CompanyTopicRoleForEvent[]> = {};
  for (const file of fs.readdirSync(COMPANY_TOPIC_ROLES_DIR).filter((name) => name.endsWith(".json")).sort()) {
    const normalized = normalizeCompanyTopicRoles(readJson(path.join(COMPANY_TOPIC_ROLES_DIR, file)));
    if (!normalized) continue;
    result[normalized.companyCode] = normalized.roles
      .filter((role) => role.status !== "rejected")
      .map((role) => ({
        topicId: role.topicId,
        topicName: role.topicName,
        roleLabel: role.roleType,
        confidence: role.confidence,
        status: role.status,
      }));
  }
  return result;
}

async function fetchTwseMajorNews(): Promise<unknown[]> {
  const response = await fetch(TWSE_MAJOR_NEWS_URL, {
    headers: { "User-Agent": "industry-map-site/1.0 event-focus-refresh" },
  });
  if (!response.ok) throw new Error(`TWSE major-news fetch failed: ${response.status} ${response.statusText}`);
  const json = await response.json();
  if (!Array.isArray(json)) throw new Error("TWSE major-news response is not an array");
  return json;
}

function rowsFromPreviousSnapshot(snapshot: EventFocusSnapshot | undefined): OfficialMajorNewsRow[] {
  return (snapshot?.items ?? [])
    .filter((item) => item.source === "TWSE OpenAPI t187ap04_L")
    .map((item) => ({
      id: item.id,
      date: item.date,
      announcedAt: item.announcedAt,
      companyCode: item.companyCode,
      companyName: item.companyName,
      subject: item.officialSubject,
      clause: item.clause,
      source: item.source,
      sourceUrl: item.sourceUrl,
    }));
}

function mergeOfficialRows(fetchedRows: OfficialMajorNewsRow[], previousRows: OfficialMajorNewsRow[]): OfficialMajorNewsRow[] {
  const merged: OfficialMajorNewsRow[] = [];
  const seen = new Set<string>();
  for (const row of [...fetchedRows, ...previousRows]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  return merged.sort((a, b) => b.announcedAt.localeCompare(a.announcedAt));
}

function parsePreviousSnapshot(serialized: string): EventFocusSnapshot | undefined {
  if (!serialized) return undefined;
  try {
    return JSON.parse(serialized) as EventFocusSnapshot;
  } catch {
    return undefined;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const trackedCodes = loadTrackedCompanyCodes();
  const previous = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, "utf8") : "";
  const previousSnapshot = parsePreviousSnapshot(previous);
  const rawRows = await fetchTwseMajorNews();
  const fetchedRows = normalizeTwseMajorNewsRows(rawRows, trackedCodes);
  const officialRows = mergeOfficialRows(fetchedRows, rowsFromPreviousSnapshot(previousSnapshot));
  const snapshot = buildEventFocusSnapshot({
    officialRows,
    companyTopicRoles: loadCompanyTopicRoles(),
    limit: options.limit,
  });
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  const changed = previous !== serialized;

  console.log(JSON.stringify({
    dryRun: options.dryRun,
    status: snapshot.status,
    latestDate: snapshot.latestDate,
    itemCount: snapshot.itemCount,
    fetchedItemCount: fetchedRows.length,
    changed,
    outputPath: path.relative(process.cwd(), OUTPUT_PATH),
  }, null, 2));

  if (!options.dryRun && changed) {
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, serialized);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
