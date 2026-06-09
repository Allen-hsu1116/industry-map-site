export type ProductNavigationItemId = "daily-focus" | "topic-overview" | "industry-map" | "company-database" | "market-rankings" | "ai-analysis";

export interface ProductNavigationItem {
  id: ProductNavigationItemId;
  label: string;
  href: string;
  scopeDescription: string;
}

export type ProductNavigationTargetInput =
  | { type: "topic"; topicId?: string }
  | { type: "industry_stage"; topicId?: string; stageId?: string }
  | { type: "company"; companyCode?: string };

export type ProductNavigationTarget =
  | { type: "topic"; href: string; topicId: string }
  | { type: "industry_stage"; href: string; topicId: string; stageId: string }
  | { type: "company"; href: string; companyCode: string };

const navigationItems: ProductNavigationItem[] = [
  { id: "daily-focus", label: "Daily Focus", href: "/daily-report", scopeDescription: "今日市場事件、題材變化與候選/觀察名單入口。" },
  { id: "topic-overview", label: "Topic Overview", href: "/topics", scopeDescription: "題材定義、子題材、今日焦點與來源狀態。" },
  { id: "industry-map", label: "Industry Map", href: "/industry-map", scopeDescription: "產業鏈階段、代表公司與 show-all 研究入口。" },
  { id: "company-database", label: "Company Database", href: "/companies", scopeDescription: "可搜尋/篩選的公司研究資料庫與公司詳細頁入口。" },
  { id: "market-rankings", label: "Market Rankings", href: "/market-rankings", scopeDescription: "技術面、籌碼面、市場模組排名；不等於公司推薦。" },
  { id: "ai-analysis", label: "AI Analysis", href: "/ai-analysis", scopeDescription: "只由 typed context 產生的 Daily/Topic/Company synthesis。" },
];

function isSafeSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]*$/i.test(value);
}

function isCompanyCode(value: unknown): value is string {
  return typeof value === "string" && /^\d{4,6}[A-Z]?$/.test(value);
}

export function getProductNavigationItems(): ProductNavigationItem[] {
  return navigationItems.map((item) => ({ ...item }));
}

export function normalizeProductNavigationTarget(input: ProductNavigationTargetInput): ProductNavigationTarget | null {
  if (input.type === "topic") {
    if (!isSafeSlug(input.topicId)) return null;
    return { type: "topic", href: `/topics/${input.topicId}`, topicId: input.topicId };
  }
  if (input.type === "industry_stage") {
    if (!isSafeSlug(input.topicId) || !isSafeSlug(input.stageId)) return null;
    const params = new URLSearchParams({ topic: input.topicId, stage: input.stageId });
    return { type: "industry_stage", href: `/industry-map?${params.toString()}`, topicId: input.topicId, stageId: input.stageId };
  }
  if (input.type === "company") {
    if (!isCompanyCode(input.companyCode)) return null;
    return { type: "company", href: `/companies/${input.companyCode}`, companyCode: input.companyCode };
  }
  return null;
}

export function buildDailyFocusLink(input: { topicId?: string; stageId?: string; companyCode?: string }): string {
  const params = new URLSearchParams();
  if (isSafeSlug(input.topicId)) params.set("topic", input.topicId);
  if (isSafeSlug(input.stageId)) params.set("stage", input.stageId);
  if (isCompanyCode(input.companyCode)) params.set("company", input.companyCode);
  const query = params.toString();
  return query ? `/daily-report?${query}` : "/daily-report";
}
