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
  height?: number;
}

export default function TradingViewChart({
  candleData,
  volumeData,
  ma5Data,
  ma10Data,
  ma20Data,
  height = 400,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || candleData.length === 0) return;

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;

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
  }, [candleData, volumeData, ma5Data, ma10Data, ma20Data, height]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "100%", minHeight: `${height}px` }}
    />
  );
}