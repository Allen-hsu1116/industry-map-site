"use client";

import { useState, useMemo } from "react";
import industriesData from "../../public/data/industries.json";

const CATEGORY_COLORS: Record<string, string> = {
  "半導體製造": "from-blue-600 to-blue-800",
  "IC 設計": "from-purple-600 to-purple-800",
  "先進封測": "from-cyan-600 to-cyan-800",
  "基板材料": "from-amber-600 to-amber-800",
  "記憶體": "from-green-600 to-green-800",
  "AI 伺服器": "from-rose-600 to-rose-800",
  "散熱冷卻": "from-orange-600 to-orange-800",
  "電子零組件": "from-indigo-600 to-indigo-800",
  "被動元件": "from-teal-600 to-teal-800",
  "網通衛星": "from-sky-600 to-sky-800",
  "光學顯示": "from-fuchsia-600 to-fuchsia-800",
  "消費終端": "from-pink-600 to-pink-800",
  "醫療器材": "from-red-600 to-red-800",
  "綠能環保": "from-emerald-600 to-emerald-800",
  "傳產工業": "from-yellow-600 to-yellow-800",
  "金融航運": "from-slate-600 to-slate-800",
  "智慧機器人": "from-violet-600 to-violet-800",
  "軟體資安": "from-lime-600 to-lime-800",
};

function getCategory(topicName: string): string {
  if (topicName.includes("｜")) return topicName.split("｜")[0];
  return "其他";
}

function getGradient(topicName: string): string {
  const cat = getCategory(topicName);
  return CATEGORY_COLORS[cat] || "from-gray-600 to-gray-800";
}

function RelevanceBadge({ relevance }: { relevance: string }) {
  if (relevance.includes("龍頭") || relevance.includes("核心") || relevance === "high")
    return <span className="badge-high text-xs px-2 py-0.5 rounded-full font-medium">核心</span>;
  if (relevance.includes("利基") || relevance.includes("重要") || relevance === "medium")
    return <span className="badge-medium text-xs px-2 py-0.5 rounded-full font-medium">重要</span>;
  if (relevance === "low" || relevance.includes("觀察"))
    return <span className="badge-low text-xs px-2 py-0.5 rounded-full font-medium">相關</span>;
  return null;
}

interface TopicData {
  slug: string;
  name: string;
  description: string;
  total: number;
  groups: {
    name: string;
    companies: {
      code: string;
      name: string;
      role: string;
      relevance: string;
    }[];
  }[];
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"count" | "name">("count");

  const topics: TopicData[] = industriesData.topics as TopicData[];
  const stats = industriesData.stats;

  const categories = useMemo(() => {
    const cats = new Set<string>();
    topics.forEach((t) => cats.add(getCategory(t.name)));
    return ["全部", ...Array.from(cats)];
  }, [topics]);

  const filteredTopics = useMemo(() => {
    let filtered = topics;

    if (selectedCategory !== "全部") {
      filtered = filtered.filter((t) => getCategory(t.name) === selectedCategory);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          t.groups.some((g) =>
            g.companies.some(
              (c) => c.name.toLowerCase().includes(q) || c.code.includes(q)
            )
          )
      );
    }

    if (sortBy === "count") {
      filtered = [...filtered].sort((a, b) => b.total - a.total);
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "zh-TW"));
    }

    return filtered;
  }, [topics, selectedCategory, search, sortBy]);

  const selectedTopicData = selectedTopic
    ? topics.find((t) => t.slug === selectedTopic) || null
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-[var(--bg-dark)]/80 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
              🏭
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">台股產業鏈知識圖譜</h1>
              <p className="text-xs text-[var(--text-muted)]">
                {stats.total_topics} 個題材 · {stats.unique_companies} 家公司
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
            <div className="text-2xl font-bold text-indigo-400">{stats.total_topics}</div>
            <div className="text-sm text-[var(--text-muted)]">題材數</div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
            <div className="text-2xl font-bold text-emerald-400">{stats.unique_companies}</div>
            <div className="text-sm text-[var(--text-muted)]">不重複公司</div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
            <div className="text-2xl font-bold text-amber-400">{stats.total_companies}</div>
            <div className="text-sm text-[var(--text-muted)]">公司條目</div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
            <div className="text-2xl font-bold text-rose-400">{categories.length - 1}</div>
            <div className="text-sm text-[var(--text-muted)]">產業類別</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="搜尋題材、公司名稱或代碼..."
            className="search-input flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2.5 rounded-xl text-sm cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "count" | "name")}
          >
            <option value="count">按公司數排序</option>
            <option value="name">按名稱排序</option>
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedCategory === cat ? "active" : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Topic Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTopics.map((topic) => (
                <button
                  key={topic.slug}
                  className={`topic-card text-left bg-[var(--bg-card)] rounded-xl p-4 border transition-all ${
                    selectedTopic === topic.slug
                      ? "border-indigo-500 ring-2 ring-indigo-500/30"
                      : "border-[var(--border)] hover:border-indigo-500/50"
                  }`}
                  onClick={() => setSelectedTopic(selectedTopic === topic.slug ? null : topic.slug)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm text-white leading-tight">{topic.name}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-gradient-to-r ${getGradient(topic.name)} text-white ml-2 shrink-0`}>
                      {topic.total}
                    </span>
                  </div>
                  {topic.description && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                      {topic.description.substring(0, 80)}...
                    </p>
                  )}
                </button>
              ))}
            </div>

            {filteredTopics.length === 0 && (
              <div className="text-center py-12 text-[var(--text-muted)]">找不到符合條件的題材</div>
            )}
          </div>

          {/* Detail Panel - Desktop */}
          {selectedTopicData && (
            <div className="hidden lg:block w-96 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-white">{selectedTopicData.name}</h2>
                  <button onClick={() => setSelectedTopic(null)} className="text-[var(--text-muted)] hover:text-white text-xl leading-none">✕</button>
                </div>
                {selectedTopicData.description && (
                  <p className="text-sm text-[var(--text-secondary)] mb-4">{selectedTopicData.description}</p>
                )}
                <div className="text-sm text-[var(--text-muted)] mb-4">
                  共 {selectedTopicData.total} 家公司 · {selectedTopicData.groups.length} 個分類
                </div>
                {selectedTopicData.groups.map((group) => (
                  <div key={group.name} className="mb-4">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">{group.name}</h4>
                    <div className="space-y-1">
                      {group.companies.map((company) => (
                        <div key={company.code} className="company-row flex items-center justify-between px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-[var(--text-muted)] w-12">{company.code}</span>
                            <span className="text-sm text-white">{company.name}</span>
                            {company.relevance && <RelevanceBadge relevance={company.relevance} />}
                          </div>
                          {company.role && (
                            <span className="text-xs text-[var(--text-muted)] truncate ml-2 max-w-[120px] text-right">{company.role}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile detail modal */}
        {selectedTopicData && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setSelectedTopic(null)}>
            <div className="bg-[var(--bg-card)] w-full max-h-[80vh] rounded-t-2xl overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-white">{selectedTopicData.name}</h2>
                <button onClick={() => setSelectedTopic(null)} className="text-[var(--text-muted)] hover:text-white text-xl leading-none p-2">✕</button>
              </div>
              {selectedTopicData.description && (
                <p className="text-sm text-[var(--text-secondary)] mb-4">{selectedTopicData.description}</p>
              )}
              {selectedTopicData.groups.map((group) => (
                <div key={group.name} className="mb-4">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">{group.name}</h4>
                  <div className="space-y-1">
                    {group.companies.map((company) => (
                      <div key={company.code} className="company-row flex items-center gap-2 px-3 py-2 rounded-lg">
                        <span className="text-xs font-mono text-[var(--text-muted)] w-12">{company.code}</span>
                        <span className="text-sm text-white">{company.name}</span>
                        {company.relevance && <RelevanceBadge relevance={company.relevance} />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[var(--text-muted)]">
          台股產業鏈知識圖譜 · 資料來源：aistockmap.com + CasualMarket + 多源驗證 · 最後更新：2026-05-18
        </div>
      </footer>
    </div>
  );
}