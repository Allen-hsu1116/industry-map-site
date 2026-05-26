"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
} from "lightweight-charts";

interface TradingViewChartProps {
  candleData: CandlestickData[];
  volumeData?: HistogramData[];
  ma5Data?: LineData[];
  ma10Data?: LineData[];
  ma20Data?: LineData[];
  ma60Data?: LineData[];
  height?: number;
}

function timeKey(time: unknown): string {
  if (typeof time === "string" || typeof time === "number") return String(time);
  if (time && typeof time === "object" && "year" in time && "month" in time && "day" in time) {
    const record = time as { year: number; month: number; day: number };
    return `${record.year}-${String(record.month).padStart(2, "0")}-${String(record.day).padStart(2, "0")}`;
  }
  return String(time ?? "");
}

function fmtPrice(value: number | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : value.toFixed(2);
}

function fmtVolume(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] ?? char));
}

export default function TradingViewChart({
  candleData,
  volumeData,
  ma5Data,
  ma10Data,
  ma20Data,
  ma60Data,
  height = 400,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || candleData.length === 0) return;

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const tooltip = tooltipRef.current;

    const candleByTime = new Map(candleData.map((row) => [timeKey(row.time), row]));
    const volumeByTime = new Map((volumeData ?? []).map((row) => [timeKey(row.time), row.value]));
    const ma5ByTime = new Map((ma5Data ?? []).map((row) => [timeKey(row.time), row.value]));
    const ma10ByTime = new Map((ma10Data ?? []).map((row) => [timeKey(row.time), row.value]));
    const ma20ByTime = new Map((ma20Data ?? []).map((row) => [timeKey(row.time), row.value]));
    const ma60ByTime = new Map((ma60Data ?? []).map((row) => [timeKey(row.time), row.value]));

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "rgba(242, 242, 242, 0.06)" },
        horzLines: { color: "rgba(242, 242, 242, 0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(129, 140, 248, 0.4)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#818cf8",
        },
        horzLine: {
          color: "rgba(129, 140, 248, 0.4)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#818cf8",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(242, 242, 242, 0.1)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "rgba(242, 242, 242, 0.1)",
        timeVisible: false,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height,
    });

    chartRef.current = chart;

    // Candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22ab94",
      downColor: "#f7525f",
      borderUpColor: "#22ab94",
      borderDownColor: "#f7525f",
      wickUpColor: "#22ab94",
      wickDownColor: "#f7525f",
    });
    candlestickSeries.setData(candleData);

    // Volume series
    if (volumeData && volumeData.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(volumeData);
    }

    // MA5
    if (ma5Data && ma5Data.length > 0) {
      const ma5Series = chart.addSeries(LineSeries, {
        color: "#818cf8",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "MA5",
      });
      ma5Series.setData(ma5Data);
    }

    // MA10
    if (ma10Data && ma10Data.length > 0) {
      const ma10Series = chart.addSeries(LineSeries, {
        color: "#f472b6",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "MA10",
      });
      ma10Series.setData(ma10Data);
    }

    // MA20
    if (ma20Data && ma20Data.length > 0) {
      const ma20Series = chart.addSeries(LineSeries, {
        color: "#fbbf24",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "MA20",
      });
      ma20Series.setData(ma20Data);
    }

    // MA60
    if (ma60Data && ma60Data.length > 0) {
      const ma60Series = chart.addSeries(LineSeries, {
        color: "#34d399",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "MA60",
      });
      ma60Series.setData(ma60Data);
    }

    chart.subscribeCrosshairMove((param) => {
      if (!tooltip || !param.point || !param.time || param.point.x < 0 || param.point.y < 0 || param.point.x > container.clientWidth || param.point.y > height) {
        if (tooltip) tooltip.style.display = "none";
        return;
      }

      const key = timeKey(param.time);
      const candle = candleByTime.get(key);
      if (!candle) {
        tooltip.style.display = "none";
        return;
      }

      const isUp = candle.close >= candle.open;
      tooltip.innerHTML = `
        <div style="font-weight:700;color:#f8fafc;margin-bottom:8px;">${escapeHtml(key)}</div>
        <div style="display:grid;grid-template-columns:auto auto;gap:4px 14px;align-items:center;">
          <span style="color:#94a3b8;">開盤</span><span style="text-align:right;color:#e5e7eb;font-variant-numeric:tabular-nums;">${fmtPrice(candle.open)}</span>
          <span style="color:#94a3b8;">最高</span><span style="text-align:right;color:#fca5a5;font-variant-numeric:tabular-nums;">${fmtPrice(candle.high)}</span>
          <span style="color:#94a3b8;">最低</span><span style="text-align:right;color:#86efac;font-variant-numeric:tabular-nums;">${fmtPrice(candle.low)}</span>
          <span style="color:#94a3b8;">收盤</span><span style="text-align:right;color:${isUp ? "#fca5a5" : "#86efac"};font-variant-numeric:tabular-nums;">${fmtPrice(candle.close)}</span>
          <span style="color:#94a3b8;">成交量</span><span style="text-align:right;color:#e5e7eb;font-variant-numeric:tabular-nums;">${fmtVolume(volumeByTime.get(key))}</span>
          <span style="color:#818cf8;">MA5</span><span style="text-align:right;color:#c7d2fe;font-variant-numeric:tabular-nums;">${fmtPrice(ma5ByTime.get(key))}</span>
          <span style="color:#f472b6;">MA10</span><span style="text-align:right;color:#fbcfe8;font-variant-numeric:tabular-nums;">${fmtPrice(ma10ByTime.get(key))}</span>
          <span style="color:#fbbf24;">MA20</span><span style="text-align:right;color:#fde68a;font-variant-numeric:tabular-nums;">${fmtPrice(ma20ByTime.get(key))}</span>
          <span style="color:#34d399;">MA60</span><span style="text-align:right;color:#bbf7d0;font-variant-numeric:tabular-nums;">${fmtPrice(ma60ByTime.get(key))}</span>
        </div>
      `;

      const tooltipWidth = 176;
      const tooltipHeight = 244;
      const left = param.point.x > container.clientWidth - tooltipWidth - 24 ? param.point.x - tooltipWidth - 16 : param.point.x + 16;
      const top = param.point.y > height - tooltipHeight - 16 ? height - tooltipHeight - 12 : param.point.y + 12;
      tooltip.style.display = "block";
      tooltip.style.left = `${Math.max(8, left)}px`;
      tooltip.style.top = `${Math.max(8, top)}px`;
    });

    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candleData, volumeData, ma5Data, ma10Data, ma20Data, ma60Data, height]);

  return (
    <div className="relative" style={{ width: "100%", minHeight: `${height}px` }}>
      <div
        ref={chartContainerRef}
        style={{ width: "100%", minHeight: `${height}px` }}
      />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-20 hidden w-44 rounded-xl border border-slate-500/30 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur"
      />
    </div>
  );
}
