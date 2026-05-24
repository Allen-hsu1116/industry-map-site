import { NextRequest, NextResponse } from "next/server";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  date: string;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "";
  const name = req.nextUrl.searchParams.get("name") || "";

  if (!symbol || !name) {
    return NextResponse.json({ error: "Missing symbol or name" }, { status: 400 });
  }

  const query = encodeURIComponent(`${name} ${symbol}`);
  const allNews: NewsItem[] = [];

  // Fetch from multiple sources in parallel
  const fetches = [
    fetchCnyes(query),
    fetchUdn(query),
    fetchGoogleNewsRSS(query, "自由財經"),
    fetchGoogleNewsRSS(query, "ETtoday"),
    fetchGoogleNewsRSS(query, "工商時報"),
    fetchGoogleNewsRSS(query, "中時新聞網"),
    fetchGoogleNews(query + "+site:moneydj.com", "MoneyDJ"),
    fetchGoogleNews(query, "Yahoo股市"),
    fetchGoogleNews(query + "+site:cmoney.tw", "CMoney"),
  ];

  const results = await Promise.allSettled(fetches);
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      allNews.push(...r.value);
    }
  }

  // Deduplicate by title (fuzzy first 20 chars)
  const seen = new Set<string>();
  const unique = allNews.filter(n => {
    const key = n.title.replace(/\s/g, "").slice(0, 20);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date desc
  unique.sort((a, b) => b.date.localeCompare(a.date));

  // Return top 30
  return NextResponse.json({ news: unique.slice(0, 30) });
}

// ─── Cnyes API ───
async function fetchCnyes(query: string): Promise<NewsItem[]> {
  try {
    const url = `https://news.cnyes.com/api/v3/news/list?keyword=${query}&limit=10`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const items = json?.items?.data || json?.data || [];
    return items.slice(0, 10).map((item: any) => ({
      title: item.title || "",
      link: item.newsId ? `https://news.cnyes.com/news/id/${item.newsId}` : "",
      source: "鉅亨網",
      date: item.publishAt ? new Date(item.publishAt * 1000).toISOString().slice(0, 10) : "",
    })).filter((n: NewsItem) => n.title);
  } catch { return []; }
}

// ─── UDN API ───
async function fetchUdn(query: string): Promise<NewsItem[]> {
  try {
    const url = `https://udn.com/api/more?channel=2&type=search&q=${query}&page=1`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const items = json?.list || json?.data || [];
    return items.slice(0, 10).map((item: any) => ({
      title: item.title || "",
      link: item.url || item.link || "",
      source: "聯合新聞網",
      date: item.time || item.date || "",
    })).filter((n: NewsItem) => n.title);
  } catch { return []; }
}

// ─── Google News RSS (universal) ───
async function fetchGoogleNewsRSS(query: string, sourceLabel: string): Promise<NewsItem[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${query}+when:30d&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    const text = await res.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item[\s\S]*?<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const block = match[0];
      const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/);
      const linkMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/);
      const pubDateMatch = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/);
      if (titleMatch) {
        const title = decodeHTMLEntities(titleMatch[1].trim());
        const link = linkMatch ? decodeHTMLEntities(linkMatch[1].trim()) : "";
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";
        const date = pubDate ? new Date(pubDate).toISOString().slice(0, 10) : "";
        items.push({ title, link, source: sourceLabel, date });
      }
    }
    return items.slice(0, 5);
  } catch { return []; }
}

// ─── Google News search (site-specific) ───
async function fetchGoogleNews(query: string, sourceLabel: string): Promise<NewsItem[]> {
  return fetchGoogleNewsRSS(query, sourceLabel);
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}