import { selectPriorityCompanies, type CompanyPriorityInput } from "./klineRefresh";
import type { HoldingSharesPerRow, LargeHolderCompanyInput } from "./largeHolderRanking";

export interface LargeHolderSampleArtifact {
  schemaVersion: 1;
  generatedAt: string;
  source: {
    name: string;
    retrieval: string;
    scope: string;
    semantics: string;
    latestDate?: string;
    coverage?: string;
    warning?: string;
  };
  companies: LargeHolderCompanyInput[];
}

export interface LargeHolderRefreshOptions {
  limit: number;
  codes?: string[];
  startDate: string;
  endDate: string;
  dryRun?: boolean;
}

export interface LargeHolderFetchedCompany {
  code: string;
  name: string;
  rows: HoldingSharesPerRow[];
}

export interface LargeHolderRefreshPlan {
  changed: boolean;
  selectedCodes: string[];
  updatedCodes: string[];
  skippedCodes: string[];
  latestDate?: string;
  writableJson?: string;
}

const TRACKED_LEVELS = new Set([
  "400,001-600,000",
  "600,001-800,000",
  "800,001-1,000,000",
  "more than 1,000,001",
]);

function normalizeNumber(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRow(row: Record<string, unknown>, fallbackCode: string): HoldingSharesPerRow | null {
  const date = String(row.date ?? "").trim();
  const level = String(row.level ?? "").trim();
  if (!date || !TRACKED_LEVELS.has(level)) return null;
  return {
    date,
    stock_id: String(row.stock_id ?? fallbackCode),
    level,
    people: normalizeNumber(row.people),
    percent: normalizeNumber(row.percent),
    unit: normalizeNumber(row.unit),
  };
}

export function normalizeFinMindHoldingRows(rows: Record<string, unknown>[], fallbackCode: string): HoldingSharesPerRow[] {
  return rows
    .map((row) => normalizeRow(row, fallbackCode))
    .filter((row): row is HoldingSharesPerRow => Boolean(row))
    .sort((a, b) => `${a.date}:${a.level}`.localeCompare(`${b.date}:${b.level}`));
}

function rowKey(row: HoldingSharesPerRow): string {
  return `${row.date}:${row.stock_id ?? ""}:${row.level}`;
}

function mergeRows(existing: HoldingSharesPerRow[] | undefined, incoming: HoldingSharesPerRow[]): HoldingSharesPerRow[] {
  const merged = new Map<string, HoldingSharesPerRow>();
  for (const row of existing ?? []) merged.set(rowKey(row), row);
  for (const row of incoming) merged.set(rowKey(row), row);
  return Array.from(merged.values()).sort((a, b) => `${a.date}:${a.level}`.localeCompare(`${b.date}:${b.level}`));
}

function latestDate(companies: LargeHolderCompanyInput[]): string | undefined {
  return companies
    .flatMap((company) => company.holdingSharesPer ?? [])
    .map((row) => row.date)
    .filter(Boolean)
    .sort()
    .at(-1);
}

function selectCompanies(companies: CompanyPriorityInput[], options: LargeHolderRefreshOptions): CompanyPriorityInput[] {
  if (options.codes?.length) {
    const requested = new Set(options.codes);
    return companies.filter((company) => requested.has(company.code));
  }
  return selectPriorityCompanies(companies, options.limit);
}

export function planLargeHolderSampleRefresh(
  current: LargeHolderSampleArtifact,
  companies: CompanyPriorityInput[],
  fetched: LargeHolderFetchedCompany[],
  options: LargeHolderRefreshOptions,
): LargeHolderRefreshPlan {
  const selected = selectCompanies(companies, options);
  const selectedCodes = selected.map((company) => company.code);
  const fetchedByCode = new Map(fetched.map((company) => [company.code, company]));
  const currentByCode = new Map(current.companies.map((company) => [company.code, company]));
  const nextCompanies: LargeHolderCompanyInput[] = selected.flatMap((company) => {
    const existing = currentByCode.get(company.code);
    const incoming = fetchedByCode.get(company.code)?.rows ?? [];
    if (!existing && incoming.length === 0) return [];
    return [{
      code: company.code,
      name: company.name ?? existing?.name ?? company.code,
      holdingSharesPer: mergeRows(existing?.holdingSharesPer, incoming),
    }];
  });

  const updatedCodes = selectedCodes.filter((code) => (fetchedByCode.get(code)?.rows.length ?? 0) > 0);
  const skippedCodes = selectedCodes.filter((code) => !updatedCodes.includes(code));
  if (updatedCodes.length === 0) {
    return {
      changed: false,
      selectedCodes,
      updatedCodes,
      skippedCodes,
      latestDate: latestDate(current.companies),
    };
  }
  const latest = latestDate(nextCompanies);
  const nextArtifact: LargeHolderSampleArtifact = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      name: "FinMind TaiwanStockHoldingSharesPer",
      retrieval: "Automated FinMind API refresh via scripts/update-large-holder-sample.ts",
      scope: `tracked sample selected from high topic-count companies (${selectedCodes.length}); not full market`,
      semantics: "Weekly shareholding distribution by share-count tier. Checked-in rows keep only 400k+ tiers used by the ranking model: date, stock_id, level, people, percent, unit.",
      ...(latest ? { latestDate: latest } : {}),
      coverage: `${updatedCodes.length}/${selectedCodes.length} selected companies returned holding-share rows for ${options.startDate}..${options.endDate}`,
      warning: "tracked sample only, not full market; do not compare this as a complete TWSE/OTC ranking",
    },
    companies: nextCompanies,
  };

  const writableJson = `${JSON.stringify(nextArtifact, null, 2)}\n`;
  const currentComparable = JSON.stringify({ ...current, generatedAt: "" });
  const nextComparable = JSON.stringify({ ...nextArtifact, generatedAt: "" });
  return {
    changed: currentComparable !== nextComparable,
    selectedCodes,
    updatedCodes,
    skippedCodes,
    latestDate: latest,
    ...(options.dryRun ? {} : { writableJson }),
  };
}
