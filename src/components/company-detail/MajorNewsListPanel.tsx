export interface MajorNewsItemView {
  date: string;
  subject: string;
  source?: string;
}

export interface MajorNewsListPanelProps {
  majorNews: MajorNewsItemView[];
  loading: boolean;
  error: string;
  source: string;
  fetchedAt: string;
}

/* ─── Major news list panel ─── */
export function MajorNewsListPanel({ majorNews, loading, error, source, fetchedAt }: MajorNewsListPanelProps) {
  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h4 className="text-sm font-bold text-white">📋 重大訊息公告</h4>
        <div className="text-xs text-[var(--color-text-tertiary)]">
          {loading ? "即時查詢公開資訊觀測站中..." : `資料來源：${source || "公開資訊觀測站 / 本地快照"}`}
          {fetchedAt && <span className="ml-2">抓取 {new Date(fetchedAt).toLocaleTimeString("zh-TW", { hour12: false })}</span>}
        </div>
      </div>
      {error && <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200">{error}</div>}
      {loading && majorNews.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-text-tertiary)] text-sm">
          <div className="animate-pulse">⏳ 載入重大訊息中...</div>
        </div>
      ) : majorNews.length > 0 ? (
        <div className="space-y-3">
          {majorNews.slice(0, 15).map((n, i) => (
            <div key={`${n.date}-${i}`} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04] hover:border-white/[0.08] transition-all">
              <div className="flex items-start gap-3">
                <div className="text-xs text-[var(--color-text-tertiary)] shrink-0 pt-0.5 font-mono">{n.date}</div>
                <div className="flex-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">{n.subject}</div>
                {n.source && <div className="hidden sm:block text-[10px] text-[var(--color-text-tertiary)] rounded bg-white/[0.05] px-1.5 py-0.5">{n.source}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[var(--color-text-tertiary)] text-sm">
          📋 尚未載入重大訊息資料；不代表公司沒有公告，請以公開資訊觀測站為準。
        </div>
      )}
    </div>
  );
}
