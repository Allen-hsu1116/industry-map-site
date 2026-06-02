import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { normalizeMajorNewsFilters } from "@/lib/majorNewsFilters";

interface MajorNewsItem {
  date: string;
  subject: string;
  source: "TWSE OpenAPI" | "local snapshot";
}

type TwseMajorNewsRecord = Record<string, unknown>;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filters = normalizeMajorNewsFilters({
    companyCode: req.nextUrl.searchParams.get("symbol")?.trim() || "",
    date: req.nextUrl.searchParams.get("date")?.trim() || "",
    topicId: req.nextUrl.searchParams.get("topic")?.trim() || "",
  });
  const symbol = filters.companyCode ?? "";

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  const [liveNews, snapshotNews] = await Promise.all([
    fetchTwseMajorNews(symbol),
    readSnapshotMajorNews(symbol),
  ]);

  const merged = dedupeMajorNews([...liveNews, ...snapshotNews])
    .filter((item) => !filters.date || item.date.startsWith(filters.date))
    .slice(0, 30);

  return NextResponse.json(
    {
      symbol,
      filters,
      source: liveNews.length > 0 ? "TWSE OpenAPI + local snapshot" : "local snapshot",
      fetchedAt: new Date().toISOString(),
      liveCount: liveNews.length,
      snapshotCount: snapshotNews.length,
      majorNews: merged,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

async function fetchTwseMajorNews(symbol: string): Promise<MajorNewsItem[]> {
  try {
    const res = await fetch("https://openapi.twse.com.tw/v1/opendata/t187ap04_L", {
      cache: "no-store",
      headers: { "User-Agent": "industry-map-site/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((row: unknown): row is TwseMajorNewsRecord => isRecord(row) && String(row["公司代號"] ?? "").trim() === symbol)
      .map((row) => ({
        date: formatTwseDateTime(String(row["發言日期"] ?? ""), String(row["發言時間"] ?? "")),
        subject: String(row["主旨 "] ?? row["主旨"] ?? "").trim(),
        source: "TWSE OpenAPI" as const,
      }))
      .filter((item) => item.subject);
  } catch {
    return [];
  }
}

async function readSnapshotMajorNews(symbol: string): Promise<MajorNewsItem[]> {
  try {
    const file = path.join(process.cwd(), "public", "data", "financials", `${symbol}.json`);
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { major_news?: unknown };
    if (!Array.isArray(parsed.major_news)) return [];
    return parsed.major_news
      .filter((row: unknown): row is { date?: unknown; subject?: unknown } => isRecord(row))
      .map((row) => ({
        date: String(row.date ?? "").trim(),
        subject: String(row.subject ?? "").trim(),
        source: "local snapshot" as const,
      }))
      .filter((item) => item.subject);
  } catch {
    return [];
  }
}

function dedupeMajorNews(items: MajorNewsItem[]): MajorNewsItem[] {
  const seen = new Set<string>();
  const unique: MajorNewsItem[] = [];
  for (const item of items) {
    const key = `${item.date.slice(0, 10)}:${item.subject.replace(/\s/g, "").slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique.sort((a, b) => b.date.localeCompare(a.date));
}

function formatTwseDateTime(date: string, time: string): string {
  const d = date.replace(/\D/g, "");
  const rawTime = time.replace(/\D/g, "");
  const t = rawTime.length <= 4 ? rawTime.padStart(4, "0") + "00" : rawTime.padStart(6, "0");
  if (d.length !== 7) return date;
  const rocYear = Number(d.slice(0, 3));
  const month = d.slice(3, 5);
  const day = d.slice(5, 7);
  const hh = t.slice(0, 2);
  const mm = t.slice(2, 4);
  const ss = t.slice(4, 6);
  if (!Number.isFinite(rocYear)) return date;
  return `${rocYear + 1911}-${month}-${day} ${hh}:${mm}:${ss}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
