export type SourceStatusRailStatus = "verified" | "partial" | "empty";

export interface SourceStatusRailItem {
  module: string;
  source: string;
  latestDate: string;
  status: SourceStatusRailStatus;
  scope: string;
  warning?: string;
  emptyReason?: string;
}

export interface SourceStatusRailMarketModuleInput {
  module: string;
  source: string;
  scope: string;
  datesByCompany: Map<string, string | undefined>;
}

export interface SourceStatusRailKnowledgeModuleInput {
  module: "product-knowledge" | "company-topic-roles" | "company-swot" | string;
  source: string;
  count: number;
  latestDate?: string;
}

export interface SourceStatusRailExternalModuleInput {
  module: string;
  source: string;
  latestDate?: string;
  status: SourceStatusRailStatus;
  scope: string;
  warning?: string;
  emptyReason?: string;
}

export interface SourceStatusRailInput {
  totalCompanies: number;
  priorityCompanyCount: number;
  marketModules: SourceStatusRailMarketModuleInput[];
  externalModules?: SourceStatusRailExternalModuleInput[];
  eventFocus: {
    source: string;
    latestDate?: string;
    status: SourceStatusRailStatus;
    scope: string;
    itemCount: number;
    warning?: string;
    emptyReason?: string;
  };
  dailyAnalysis: {
    source: string;
    latestDate?: string;
    count: number;
  };
  knowledgeModules: SourceStatusRailKnowledgeModuleInput[];
}

export interface SourceStatusRail {
  status: SourceStatusRailStatus;
  summary: {
    total: number;
    verified: number;
    partial: number;
    empty: number;
  };
  items: SourceStatusRailItem[];
  note: string;
}

function latestDate(values: Array<string | undefined>): string {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? "";
}

function aggregateStatus(items: SourceStatusRailItem[]): SourceStatusRailStatus {
  if (items.length === 0 || items.every((item) => item.status === "empty")) return "empty";
  if (items.every((item) => item.status === "verified")) return "verified";
  return "partial";
}

function moduleEmptyReason(module: string): string {
  if (module === "product-knowledge") return "尚無 product-knowledge 可驗證檔案；產品描述不可用 AI 補假資料。";
  if (module === "company-topic-roles") return "尚無 company-topic-roles 可驗證檔案；題材角色不可用 AI 補假資料。";
  if (module === "company-swot") return "尚無 company-swot 可驗證檔案；SWOT 不可用短線價格或 AI 補假資料。";
  return `尚無 ${module} 可驗證資料；不可用 AI 補假資料。`;
}

function marketItem(input: SourceStatusRailMarketModuleInput, priorityCompanyCount: number): SourceStatusRailItem {
  const dates = [...input.datesByCompany.values()].filter((date): date is string => Boolean(date));
  const covered = dates.length;
  const status: SourceStatusRailStatus = covered === 0 ? "empty" : covered >= priorityCompanyCount ? "verified" : "partial";
  const scope = `${input.scope} · coverage ${covered} / ${priorityCompanyCount}`;
  return {
    module: input.module,
    source: input.source,
    latestDate: latestDate(dates),
    status,
    scope,
    ...(status === "partial" ? { warning: `${input.module} only has coverage ${covered} / ${priorityCompanyCount}; treat as tracked-priority sample, not full-market feed.` } : {}),
    ...(status === "empty" ? { emptyReason: `${input.module} 沒有可驗證日期；此模組不可顯示成已更新。` } : {}),
  };
}

function knowledgeItem(input: SourceStatusRailKnowledgeModuleInput, totalCompanies: number): SourceStatusRailItem {
  const status: SourceStatusRailStatus = input.count === 0 ? "empty" : input.count >= totalCompanies ? "verified" : "partial";
  return {
    module: input.module,
    source: input.source,
    latestDate: input.latestDate ?? "",
    status,
    scope: `checked-in company knowledge files · coverage ${input.count} / ${totalCompanies}`,
    ...(status === "partial" ? { warning: `${input.module} 目前不是全市場覆蓋；缺資料公司只能顯示 insufficient/empty state。` } : {}),
    ...(status === "empty" ? { emptyReason: moduleEmptyReason(input.module) } : {}),
  };
}

export function buildUnifiedSourceStatusRail(input: SourceStatusRailInput): SourceStatusRail {
  const items: SourceStatusRailItem[] = [
    ...input.marketModules.map((module) => marketItem(module, input.priorityCompanyCount)),
    ...(input.externalModules ?? []).map((module) => ({
      module: module.module,
      source: module.source,
      latestDate: module.latestDate ?? "",
      status: module.status,
      scope: module.scope,
      ...(module.warning ? { warning: module.warning } : {}),
      ...(module.emptyReason ? { emptyReason: module.emptyReason } : {}),
    })),
    {
      module: "event-focus",
      source: input.eventFocus.source,
      latestDate: input.eventFocus.latestDate ?? "",
      status: input.eventFocus.status,
      scope: `${input.eventFocus.scope} · ${input.eventFocus.itemCount} official rows`,
      ...(input.eventFocus.warning ? { warning: input.eventFocus.warning } : {}),
      ...(input.eventFocus.emptyReason ? { emptyReason: input.eventFocus.emptyReason } : {}),
    },
    {
      module: "daily-analysis",
      source: input.dailyAnalysis.source,
      latestDate: input.dailyAnalysis.latestDate ?? "",
      status: input.dailyAnalysis.count > 0 ? "verified" : "empty",
      scope: `${input.dailyAnalysis.count} company analysis snapshots`,
      ...(input.dailyAnalysis.count === 0 ? { emptyReason: "尚無 checked-in daily analysis snapshot；推薦區不可裝成已分析。" } : {}),
    },
    ...input.knowledgeModules.map((module) => knowledgeItem(module, input.totalCompanies)),
  ];

  const summary = {
    total: items.length,
    verified: items.filter((item) => item.status === "verified").length,
    partial: items.filter((item) => item.status === "partial").length,
    empty: items.filter((item) => item.status === "empty").length,
  };

  return {
    status: aggregateStatus(items),
    summary,
    items,
    note: "Unified source-status rail is derived from checked-in module data counts and dates; partial/empty modules must stay visible instead of being AI-filled.",
  };
}
