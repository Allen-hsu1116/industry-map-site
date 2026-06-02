export interface OfficialMajorNewsRow {
  id: string;
  date: string;
  announcedAt: string;
  companyCode: string;
  companyName: string;
  subject: string;
  clause?: string;
  description?: string;
  source: "TWSE OpenAPI t187ap04_L" | "local financials snapshot";
  sourceUrl?: string;
}

export interface DerivedEventTopic {
  topicId: string;
  topicName: string;
  roleLabel?: string;
  confidence?: string;
  status?: string;
}

export interface EventFocusItem {
  id: string;
  date: string;
  announcedAt: string;
  companyCode: string;
  companyName: string;
  officialSubject: string;
  clause?: string;
  derivedTopics: DerivedEventTopic[];
  mappingMethod: "derived_from_company_topic_roles" | "unmapped_official_event";
  verificationNote: string;
  source: OfficialMajorNewsRow["source"];
  sourceUrl?: string;
}

export interface EventFocusSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  status: "verified" | "partial" | "empty";
  source: {
    name: "TWSE OpenAPI t187ap04_L";
    url: "https://openapi.twse.com.tw/v1/opendata/t187ap04_L";
    scope: "listed-company-major-news";
    semantics: "official subject preserved; topic mapping is derived, not official";
  };
  latestDate?: string;
  itemCount: number;
  items: EventFocusItem[];
  emptyReason?: string;
}

export interface CompanyTopicRoleForEvent {
  topicId: string;
  topicName?: string;
  roleLabel?: string;
  confidence?: string;
  status?: string;
}

const TWSE_MAJOR_NEWS_SOURCE = "TWSE OpenAPI t187ap04_L" as const;
const TWSE_MAJOR_NEWS_URL = "https://openapi.twse.com.tw/v1/opendata/t187ap04_L" as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatRocDateTime(date: string, time = ""): string {
  const d = onlyDigits(date);
  const rawTime = onlyDigits(time);
  const t = rawTime.length <= 4 ? rawTime.padStart(4, "0") + "00" : rawTime.padStart(6, "0");
  if (d.length !== 7) return date;
  const rocYear = Number(d.slice(0, 3));
  if (!Number.isFinite(rocYear)) return date;
  const year = String(rocYear + 1911).padStart(4, "0");
  const month = d.slice(3, 5);
  const day = d.slice(5, 7);
  const hh = t.slice(0, 2) || "00";
  const mm = t.slice(2, 4) || "00";
  const ss = t.slice(4, 6) || "00";
  return `${year}-${month}-${day} ${hh}:${mm}:${ss}`;
}

function stableId(companyCode: string, announcedAt: string, clause: string): string {
  return `twse-${companyCode}-${announcedAt.slice(0, 10)}-${announcedAt.slice(11).replace(/\D/g, "")}-${clause || "na"}`;
}

export function normalizeTwseMajorNewsRows(rawRows: unknown, allowCompanyCodes?: Set<string>): OfficialMajorNewsRow[] {
  if (!Array.isArray(rawRows)) return [];
  const rows: OfficialMajorNewsRow[] = [];
  const seen = new Set<string>();
  for (const raw of rawRows) {
    if (!isRecord(raw)) continue;
    const companyCode = sanitizeText(raw["公司代號"]);
    if (!companyCode || (allowCompanyCodes && !allowCompanyCodes.has(companyCode))) continue;
    const companyName = sanitizeText(raw["公司名稱"]);
    const subject = sanitizeText(raw["主旨 "] ?? raw["主旨"]);
    if (!subject) continue;
    const announcedAt = formatRocDateTime(sanitizeText(raw["發言日期"]), sanitizeText(raw["發言時間"]));
    if (!/^\d{4}-\d{2}-\d{2}/.test(announcedAt)) continue;
    const clause = sanitizeText(raw["符合條款"]);
    const id = stableId(companyCode, announcedAt, clause);
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({
      id,
      date: announcedAt.slice(0, 10),
      announcedAt,
      companyCode,
      companyName,
      subject,
      clause: clause || undefined,
      description: sanitizeText(raw["說明"]) || undefined,
      source: TWSE_MAJOR_NEWS_SOURCE,
      sourceUrl: TWSE_MAJOR_NEWS_URL,
    });
  }
  return rows.sort((a, b) => b.announcedAt.localeCompare(a.announcedAt));
}

function mapTopics(roles: CompanyTopicRoleForEvent[] | undefined): DerivedEventTopic[] {
  return (roles ?? [])
    .filter((role) => role.topicId)
    .slice(0, 3)
    .map((role) => ({
      topicId: role.topicId,
      topicName: role.topicName ?? role.topicId,
      roleLabel: role.roleLabel,
      confidence: role.confidence,
      status: role.status,
    }));
}

export function buildEventFocusSnapshot(input: {
  generatedAt?: string;
  officialRows: OfficialMajorNewsRow[];
  companyTopicRoles?: Record<string, CompanyTopicRoleForEvent[]>;
  limit?: number;
}): EventFocusSnapshot {
  const officialRows = [...input.officialRows].sort((a, b) => b.announcedAt.localeCompare(a.announcedAt));
  const items: EventFocusItem[] = officialRows.slice(0, input.limit ?? 40).map((row) => {
    const derivedTopics = mapTopics(input.companyTopicRoles?.[row.companyCode]);
    return {
      id: row.id,
      date: row.date,
      announcedAt: row.announcedAt,
      companyCode: row.companyCode,
      companyName: row.companyName,
      officialSubject: row.subject,
      clause: row.clause,
      derivedTopics,
      mappingMethod: derivedTopics.length > 0 ? "derived_from_company_topic_roles" : "unmapped_official_event",
      verificationNote: "官方重大訊息原文保留；題材只由已建檔 company-topic-roles 派生，不代表 TWSE 官方題材分類。",
      source: row.source,
      sourceUrl: row.sourceUrl,
    };
  });
  const latestDate = items[0]?.date;
  return {
    schemaVersion: 1,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    status: items.length === 0 ? "empty" : "partial",
    source: {
      name: TWSE_MAJOR_NEWS_SOURCE,
      url: TWSE_MAJOR_NEWS_URL,
      scope: "listed-company-major-news",
      semantics: "official subject preserved; topic mapping is derived, not official",
    },
    latestDate,
    itemCount: items.length,
    items,
    emptyReason: items.length === 0 ? "No official major-news rows were available for tracked companies in the current TWSE OpenAPI snapshot." : undefined,
  };
}
