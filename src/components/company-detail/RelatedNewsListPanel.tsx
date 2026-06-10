export interface RelatedNewsItemView {
  title: string;
  link: string;
  source: string;
  date: string;
}

export interface RelatedNewsListPanelProps {
  news: RelatedNewsItemView[];
  loading: boolean;
  error: string;
  name: string;
  code: string;
}

/* ─── Related news list panel ─── */
export function RelatedNewsListPanel({ news, loading, error, name, code }: RelatedNewsListPanelProps) {
  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-white">📰 相關新聞</h4>
        <div className="text-xs text-[var(--color-text-tertiary)]">
          搜尋「{name} {code}」近 30 日報導
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8 text-[var(--color-text-tertiary)] text-sm">
          <div className="animate-pulse">⏳ 載入中...</div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--color-text-tertiary)] text-sm">⚠️ {error || "新聞載入失敗"}</div>
      ) : news.length > 0 ? (
        <div className="space-y-3">
          {news.map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
              className="block bg-white/[0.03] rounded-xl p-4 border border-white/[0.04] hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all group">
              <div className="flex items-start gap-3">
                <div className="text-xs shrink-0 pt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--color-text-tertiary)] font-medium">{item.source}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--color-text-secondary)] group-hover:text-white leading-relaxed line-clamp-2 transition-colors">{item.title}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)] mt-1 font-mono">{item.date}</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[var(--color-text-tertiary)] text-sm">📋 近期無相關新聞</div>
      )}
    </div>
  );
}
