import type { EventFocusItem } from "./eventFocus";

export interface MajorNewsFilters {
  companyCode?: string;
  date?: string;
  topicId?: string;
}

export interface MajorNewsFilterOptions {
  dates: string[];
  companies: Array<{ code: string; name: string }>;
  topics: Array<{ id: string; name: string }>;
}

function clean(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function normalizeMajorNewsFilters(input: Partial<MajorNewsFilters>): MajorNewsFilters {
  const companyCode = clean(input.companyCode);
  const topicId = clean(input.topicId);
  const rawDate = clean(input.date);
  return {
    ...(companyCode ? { companyCode } : {}),
    ...(isIsoDate(rawDate) ? { date: rawDate } : {}),
    ...(topicId ? { topicId } : {}),
  };
}

export function filterEventFocusItems(items: EventFocusItem[], filters: Partial<MajorNewsFilters>): EventFocusItem[] {
  const normalized = normalizeMajorNewsFilters(filters);
  return items.filter((item) => {
    if (normalized.companyCode && item.companyCode !== normalized.companyCode) return false;
    if (normalized.date && item.date !== normalized.date) return false;
    if (normalized.topicId && !item.derivedTopics.some((topic) => topic.topicId === normalized.topicId)) return false;
    return true;
  });
}

export function buildMajorNewsFilterOptions(items: EventFocusItem[]): MajorNewsFilterOptions {
  const dates = new Set<string>();
  const companies = new Map<string, string>();
  const topics = new Map<string, string>();

  for (const item of items) {
    if (item.date) dates.add(item.date);
    if (item.companyCode) companies.set(item.companyCode, item.companyName);
    for (const topic of item.derivedTopics) {
      if (topic.topicId) topics.set(topic.topicId, topic.topicName);
    }
  }

  return {
    dates: Array.from(dates).sort((a, b) => b.localeCompare(a)),
    companies: Array.from(companies.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code)),
    topics: Array.from(topics.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant")),
  };
}
