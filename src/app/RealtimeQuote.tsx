"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderBookLevel, QuoteResult } from "@/lib/marketData";

const REFRESH_INTERVAL_MS = 15_000;

interface RealtimeQuoteProps {
  code: string;
}

function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(0)}張`;
  return `${volume.toLocaleString()}股`;
}

function formatAmount(amount?: number): string | null {
  if (!amount) return null;
  if (amount >= 1e8) return `${(amount / 1e8).toFixed(1)}億`;
  if (amount >= 1e4) return `${(amount / 1e4).toFixed(0)}萬`;
  return amount.toLocaleString();
}

function formatTime(updatedAt: string): string {
  if (!updatedAt) return "—";
  const compactTWSE = updatedAt.match(/^(\d{8})\s+(\d{2}:\d{2}:\d{2})/);
  if (compactTWSE) return `${compactTWSE[1].slice(4, 6)}/${compactTWSE[1].slice(6, 8)} ${compactTWSE[2]}`;
  const normal = updatedAt.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (normal) return `${normal[2]}/${normal[3]} ${normal[4]}`;
  return updatedAt;
}

function getTaipeiParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: value("weekday"),
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  };
}

function getTaiwanMarketStatus(now: Date) {
  const { weekday, hour, minute } = getTaipeiParts(now);
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  const minutes = hour * 60 + minute;
  const open = 9 * 60;
  const close = 13 * 60 + 30;
  const isRegularSession = isWeekday && minutes >= open && minutes <= close;

  if (isRegularSession) return { shouldAutoRefresh: true, label: "盤中自動更新" };
  if (!isWeekday) return { shouldAutoRefresh: false, label: "休市，已停止自動更新" };
  if (minutes < open) return { shouldAutoRefresh: false, label: "未開盤，已停止自動更新" };
  return { shouldAutoRefresh: false, label: "已收盤，停止自動更新" };
}

function LevelRow({ label, levels, colorClass }: { label: string; levels: OrderBookLevel[]; colorClass: string }) {
  if (levels.length === 0) return null;
  return (
    <div className="space-y-1">
      <div className={`text-[11px] font-semibold ${colorClass}`}>{label}</div>
      {levels.map((level, index) => (
        <div key={`${label}-${index}`} className="grid grid-cols-[28px_1fr_1fr] gap-2 text-xs">
          <span className="text-[var(--color-text-tertiary)]">{index + 1}</span>
          <span className="text-right tabular-nums text-white">{level.price.toFixed(2)}</span>
          <span className="text-right tabular-nums text-[var(--color-text-secondary)]">{level.volume.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function RealtimeQuote({ code }: RealtimeQuoteProps) {
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [marketClock, setMarketClock] = useState(() => new Date());
  const marketStatus = useMemo(() => getTaiwanMarketStatus(marketClock), [marketClock]);
  const shouldAutoRefresh = marketStatus.shouldAutoRefresh;

  const fetchQuote = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setRefreshing(isBackground);
    setError("");
    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(code)}&t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "載入失敗");
      setQuote(data);
      setLastFetchedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
      if (!isBackground) setQuote(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [code]);

  useEffect(() => {
    const clock = window.setInterval(() => setMarketClock(new Date()), 60_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void fetchQuote(false);
    }, 0);
    let timer: number | undefined;
    if (shouldAutoRefresh) {
      timer = window.setInterval(() => fetchQuote(true), REFRESH_INTERVAL_MS);
    }
    return () => {
      window.clearTimeout(initial);
      if (timer) window.clearInterval(timer);
    };
  }, [fetchQuote, shouldAutoRefresh]);

  const orderBook = useMemo(() => {
    const bids = quote?.orderBook?.bids ?? (quote?.buyPrice ? [{ price: quote.buyPrice, volume: quote.buyVolume ?? 0 }] : []);
    const asks = quote?.orderBook?.asks ?? (quote?.sellPrice ? [{ price: quote.sellPrice, volume: quote.sellVolume ?? 0 }] : []);
    return { bids, asks };
  }, [quote]);

  if (loading) {
    return (
      <div className="flex items-center gap-4 animate-pulse">
        <div className="h-8 w-24 bg-white/[0.05] rounded" />
        <div className="h-5 w-16 bg-white/[0.05] rounded" />
      </div>
    );
  }

  if (error && !quote) {
    return (
      <button className="text-xs text-rose-300 hover:text-rose-200" onClick={() => fetchQuote(false)}>
        即時報價載入失敗，點擊重試
      </button>
    );
  }

  if (!quote) return null;

  const isUp = quote.change >= 0;
  const colorClass = isUp ? "text-rose-400" : "text-emerald-400";
  const arrow = isUp ? "▲" : "▼";
  const fmtAmt = formatAmount(quote.totalAmount);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-white tabular-nums">
              {quote.price > 0 ? quote.price.toFixed(2) : "—"}
            </span>
            <span className={`text-sm font-semibold ${colorClass}`}>
              {arrow} {Math.abs(quote.change).toFixed(2)} ({isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%)
            </span>
            {quote.volume > 0 && (
              <span className="text-xs text-[var(--color-text-tertiary)]">
                成交 {formatVolume(quote.volume)}{fmtAmt ? ` / ${fmtAmt}` : ""}
              </span>
            )}
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              {quote.exchange === "OTC" ? "櫃" : "市"} · {quote.source}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-tertiary)]">
            {quote.open > 0 && <span>開 <b className="text-[var(--color-text-secondary)]">{quote.open.toFixed(2)}</b></span>}
            {quote.high > 0 && <span>高 <b className="text-[var(--color-text-secondary)]">{quote.high.toFixed(2)}</b></span>}
            {quote.low > 0 && <span>低 <b className="text-[var(--color-text-secondary)]">{quote.low.toFixed(2)}</b></span>}
            {quote.previousClose > 0 && <span>昨收 <b className="text-[var(--color-text-secondary)]">{quote.previousClose.toFixed(2)}</b></span>}
            {quote.averagePrice && quote.averagePrice > 0 && <span>均 <b className="text-indigo-300">{quote.averagePrice.toFixed(2)}</b></span>}
            {quote.volumeRatio && quote.volumeRatio > 0 && <span>量比 <b className="text-indigo-300">{quote.volumeRatio.toFixed(2)}</b></span>}
            <span>更新 <b className="text-[var(--color-text-secondary)]">{formatTime(quote.updatedAt)}</b></span>
            {lastFetchedAt && <span>最後抓取 <b className="text-[var(--color-text-secondary)]">{lastFetchedAt.toLocaleTimeString("zh-TW", { hour12: false })}</b></span>}
            <span className={shouldAutoRefresh ? "text-emerald-300" : "text-amber-300"}>{marketStatus.label}</span>
          </div>

          {error && (
            <div className="text-[11px] text-amber-300">保留上一筆報價；背景更新失敗：{error}</div>
          )}
        </div>

        <button
          className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-white hover:border-white/[0.14] disabled:opacity-50"
          disabled={refreshing}
          onClick={() => fetchQuote(true)}
          title={shouldAutoRefresh ? `盤中每 ${REFRESH_INTERVAL_MS / 1000} 秒自動刷新一次` : "非盤中不自動刷新，可手動更新一次"}
        >
          {refreshing ? "更新中..." : "手動刷新"}
        </button>
      </div>

      {(orderBook.bids.length > 0 || orderBook.asks.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 max-w-lg">
          <LevelRow label="委買（價格 / 張數）" levels={orderBook.bids} colorClass="text-rose-300" />
          <LevelRow label="委賣（價格 / 張數）" levels={orderBook.asks} colorClass="text-emerald-300" />
        </div>
      )}
    </div>
  );
}
