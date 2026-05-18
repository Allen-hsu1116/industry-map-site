"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import industriesData from "../../public/data/industries.json";
import companiesData from "../../public/data/companies.json";

/* ─── Types ─── */
interface CompanyInGroup {
  code: string;
  name: string;
  role: string;
  relevance: string;
}

interface Group {
  name: string;
  companies: CompanyInGroup[];
}

interface TopicData {
  slug: string;
  name: string;
  description: string;
  total: number;
  groups: Group[];
}

interface CompanyData {
  code: string;
  name: string;
  topic_count: number;
  topics: string[];
}

/* ─── Category Colors ─── */
const CATEGORY_COLORS: Record<string, { gradient: string; solid: string; bg: string }> = {
  "半導體製造": { gradient: "from-blue-500 to-blue-700", solid: "#3b82f6", bg: "bg-blue-500/10" },
  "IC設計":     { gradient: "from-purple-500 to-purple-700", solid: "#8b5cf6", bg: "bg-purple-500/10" },
  "IC 設計":    { gradient: "from-purple-500 to-purple-700", solid: "#8b5cf6", bg: "bg-purple-500/10" },
  "先進封測":   { gradient: "from-cyan-500 to-cyan-700", solid: "#06b6d4", bg: "bg-cyan-500/10" },
  "基板材料":   { gradient: "from-amber-500 to-amber-700", solid: "#f59e0b", bg: "bg-amber-500/10" },
  "記憶體":     { gradient: "from-green-500 to-green-700", solid: "#22c55e", bg: "bg-green-500/10" },
  "AI 伺服器":  { gradient: "from-rose-500 to-rose-700", solid: "#f43f5e", bg: "bg-rose-500/10" },
  "散熱冷卻":   { gradient: "from-orange-500 to-orange-700", solid: "#f97316", bg: "bg-orange-500/10" },
  "散熱":       { gradient: "from-orange-500 to-orange-700", solid: "#f97316", bg: "bg-orange-500/10" },
  "電子零組件": { gradient: "from-indigo-500 to-indigo-700", solid: "#6366f1", bg: "bg-indigo-500/10" },
  "被動元件":   { gradient: "from-teal-500 to-teal-700", solid: "#14b8a6", bg: "bg-teal-500/10" },
  "網通衛星":   { gradient: "from-sky-500 to-sky-700", solid: "#0ea5e9", bg: "bg-sky-500/10" },
  "光學顯示":   { gradient: "from-fuchsia-500 to-fuchsia-700", solid: "#d946ef", bg: "bg-fuchsia-500/10" },
  "消費終端":   { gradient: "from-pink-500 to-pink-700", solid: "#ec4899", bg: "bg-pink-500/10" },
  "醫療器材":   { gradient: "from-red-500 to-red-700", solid: "#ef4444", bg: "bg-red-500/10" },
  "綠能環保":   { gradient: "from-emerald-500 to-emerald-700", solid: "#10b981", bg: "bg-emerald-500/10" },
  "傳產工業":   { gradient: "from-yellow-500 to-yellow-700", solid: "#eab308", bg: "bg-yellow-500/10" },
  "金融航運":   { gradient: "from-slate-400 to-slate-600", solid: "#94a3b8", bg: "bg-slate-500/10" },
  "智慧機器人": { gradient: "from-violet-500 to-violet-700", solid: "#7c3aed", bg: "bg-violet-500/10" },
  "軟體資安":   { gradient: "from-lime-500 to-lime-700", solid: "#84cc16", bg: "bg-lime-500/10" },
  "HPC":        { gradient: "from-indigo-500 to-indigo-700", solid: "#6366f1", bg: "bg-indigo-500/10" },
  "光通訊":     { gradient: "from-pink-400 to-pink-600", solid: "#f472b6", bg: "bg-pink-500/10" },
};

const DEFAULT_COLOR = { gradient: "from-gray-500 to-gray-700", solid: "#6b7280", bg: "bg-gray-500/10" };

/* ─── Helpers ─── */
function getCategory(topicName: string): string {
  if (topicName.includes("｜")) return topicName.split("｜")[0];
  return "其他";
}

function getCategoryColor(topicName: string) {
  const cat = getCategory(topicName);
  return CATEGORY_COLORS[cat] || DEFAULT_COLOR;
}

function getRelevanceInfo(relevance: string): { label: string; className: string; emoji: string } {
  const r = String(relevance).trim();
  if (r === "極高" || r === "high") return { label: "核心", className: "badge-core", emoji: "🟢" };
  if (r === "高" || r === "90" || r === "95" || r === "80" || r === "85") return { label: "核心", className: "badge-core", emoji: "🟢" };
  if (r === "中" || r === "medium" || r === "70" || r === "75") return { label: "成長", className: "badge-growth", emoji: "🟠" };
  if (r === "低" || r === "60" || r === "65" || r === "55") return { label: "利基", className: "badge-niche", emoji: "🔵" };
  return { label: "相關", className: "badge-related", emoji: "⚪" };
}

function mapGroupNames(groups: Group[]): Group[] {
  const levelNames = ["上游原料與設備", "中游製造與組件", "下游系統與應用", "周邊與服務", "其他"];
  return groups.map((g, i) => ({
    ...g,
    name: g.name || levelNames[i] || `群組 ${i + 1}`,
  }));
}

/* ─── Tab types ─── */
type TabId = "focus" | "topics" | "map" | "companies";

/* ─── Search Icon Component ─── */
function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

/* ─── Main Component ─── */
export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("topics");
  const [search, setSearch] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"count" | "name">("count");
  const [detailViewMode, setDetailViewMode] = useState<"list" | "structure">("list");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const topics: TopicData[] = industriesData.topics as TopicData[];
  const companies: CompanyData[] = companiesData as CompanyData[];
  const stats = industriesData.stats;

  // Categories derived from data
  const categories = useMemo(() => {
    const cats = new Set<string>();
    topics.forEach((t) => cats.add(getCategory(t.name)));
    return ["全部", ...Array.from(cats)];
  }, [topics]);

  // Filtered topics
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
          t.description?.toLowerCase().includes(q) ||
          t.groups.some((g) =>
            g.companies.some(
              (c) =>
                c.name.toLowerCase().includes(q) ||
                c.code.includes(q) ||
                c.role?.toLowerCase().includes(q)
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

  const selectedTopicData = useMemo(
    () => (selectedTopicSlug ? topics.find((t) => t.slug === selectedTopicSlug) || null : null),
    [selectedTopicSlug, topics]
  );

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!search || search.length < 1) return [];
    const q = search.toLowerCase();
    const results: { type: "topic" | "company"; slug: string; name: string; sub: string }[] = [];
    const seen = new Set<string>();
    for (const t of topics) {
      if (t.name.toLowerCase().includes(q) && !seen.has(t.slug)) {
        seen.add(t.slug);
        results.push({ type: "topic", slug: t.slug, name: t.name, sub: `${t.total} 家公司` });
        if (results.length >= 6) break;
      }
    }
    for (const c of companies) {
      const match = c.name.toLowerCase().includes(q) || c.code.includes(q);
      if (match && !seen.has(c.code)) {
        seen.add(c.code);
        results.push({ type: "company", slug: c.code, name: `${c.code} ${c.name}`, sub: `${c.topic_count} 個題材` });
        if (results.length >= 8) break;
      }
    }
    return results;
  }, [search, topics, companies]);

  // Click outside to close autocomplete
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When selecting a topic, auto-switch to map tab
  const handleSelectTopic = (slug: string) => {
    setSelectedTopicSlug(slug);
    setDetailViewMode("list");
  };

  // Category topic count
  const categoryCount = useMemo(() => {
    const m: Record<string, number> = {};
    topics.forEach((t) => {
      const cat = getCategory(t.name);
      m[cat] = (m[cat] || 0) + 1;
    });
    m["全部"] = topics.length;
    return m;
  }, [topics]);

  // Company search for company tab
  const [companySearch, setCompanySearch] = useState("");
  const filteredCompanies = useMemo(() => {
    if (!companySearch) return companies;
    const q = companySearch.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.topics.some((t) => t.toLowerCase().includes(q))
    );
  }, [companies, companySearch]);

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#e2e8f0] flex flex-col">
      {/* ─── Top Nav Bar ─── */}
      <header className="sticky top-0 z-50 bg-[#0d1117]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          {/* Top row: brand + search */}
          <div className="flex items-center h-16 gap-5">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
                🏭
              </div>
              <div className="leading-tight">
                <h1 className="text-[15px] font-bold text-white tracking-tight">台股產業鏈知識圖譜</h1>
                <p className="text-[11px] text-[#546280] mt-0.5">
                  {stats.total_topics} 題材 · {stats.unique_companies} 公司
                </p>
              </div>
            </div>

            {/* Search bar - clean, no icon blocking text */}
            <div ref={searchRef} className="relative flex-1 max-w-lg mx-auto">
              <div className={`flex items-center rounded-2xl transition-all duration-200 ${searchFocused ? "bg-[#1c2333] ring-2 ring-indigo-500/40" : "bg-[#161b28]"}`}>
                <input
                  type="text"
                  placeholder="搜尋題材、公司名稱或代碼..."
                  className="w-full bg-transparent px-5 py-2.5 text-sm text-white placeholder-[#4a5568] outline-none"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowAutocomplete(true);
                  }}
                  onFocus={() => { setShowAutocomplete(true); setSearchFocused(true); }}
                  onBlur={() => setSearchFocused(false)}
                />
                <div className="pr-4 text-[#4a5568]">
                  <SearchIcon />
                </div>
              </div>
              {showAutocomplete && suggestions.length > 0 && (
                <div className="autocomplete-dropdown rounded-2xl mt-1">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s.type}-${s.slug}-${i}`}
                      className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/[0.04] transition-colors text-left"
                      onClick={() => {
                        if (s.type === "topic") {
                          handleSelectTopic(s.slug);
                          setActiveTab("map");
                        } else {
                          setCompanySearch(s.slug);
                          setActiveTab("companies");
                        }
                        setSearch("");
                        setShowAutocomplete(false);
                      }}
                    >
                      <span className="text-[#e2e8f0] text-sm">{s.name}</span>
                      <span className="text-xs text-[#546280] ml-3 shrink-0">{s.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex items-center gap-1 -mb-px overflow-x-auto pb-0.5">
            {([
              { id: "focus" as TabId, label: "每日焦點", icon: "🔥" },
              { id: "topics" as TabId, label: "題材總覽", icon: "📋" },
              { id: "map" as TabId, label: "產業地圖", icon: "🗺️" },
              { id: "companies" as TabId, label: "公司資料庫", icon: "🏢" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                className={`nav-tab px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "active text-indigo-400"
                    : "text-[#546280] hover:text-[#8b9ab8]"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Stats Bar ─── */}
      <div className="bg-[#0a0e1a] border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stats-card rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-lg">📋</div>
              <div>
                <div className="text-2xl font-bold text-indigo-400 leading-none">{stats.total_topics}</div>
                <div className="text-xs text-[#546280] mt-1">題材數</div>
              </div>
            </div>
            <div className="stats-card rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">🏢</div>
              <div>
                <div className="text-2xl font-bold text-emerald-400 leading-none">{stats.unique_companies}</div>
                <div className="text-xs text-[#546280] mt-1">不重複公司</div>
              </div>
            </div>
            <div className="stats-card rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-lg">📊</div>
              <div>
                <div className="text-2xl font-bold text-amber-400 leading-none">{stats.total_companies}</div>
                <div className="text-xs text-[#546280] mt-1">公司條目</div>
              </div>
            </div>
            <div className="stats-card rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center text-lg">🏷️</div>
              <div>
                <div className="text-2xl font-bold text-rose-400 leading-none">{categories.length - 1}</div>
                <div className="text-xs text-[#546280] mt-1">產業類別</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-5 lg:px-8 py-6">
        {/* ─── Focus Tab ─── */}
        {activeTab === "focus" && (
          <div className="fade-in">
            <div className="bg-[#111827] rounded-3xl border border-white/[0.06] p-12 text-center max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🔥</div>
              <h2 className="text-2xl font-bold text-white mb-3">每日焦點</h2>
              <p className="text-[#8b9ab8] text-sm leading-relaxed max-w-md mx-auto">
                每日精選台股產業題材焦點，追蹤市場動態與產業趨勢變化。敬請期待更多功能上線。
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <button
                  className="px-8 py-3 rounded-2xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                  onClick={() => setActiveTab("topics")}
                >
                  瀏覽全部題材
                </button>
                <button
                  className="px-8 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-medium hover:bg-white/[0.08] transition-colors"
                  onClick={() => setActiveTab("map")}
                >
                  產業地圖
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Topics Tab ─── */}
        {activeTab === "topics" && (
          <div className="flex gap-8 fade-in">
            {/* Sidebar: Category filter */}
            <aside className="hidden lg:block w-60 shrink-0">
              <div className="sticky top-[136px] space-y-1">
                <h3 className="text-[11px] font-bold text-[#546280] uppercase tracking-widest mb-4 px-4">產業類別</h3>
                {categories.map((cat) => {
                  const color = cat === "全部" ? DEFAULT_COLOR : CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                  const count = categoryCount[cat] || 0;
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      className={`sidebar-category w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all ${
                        isActive
                          ? "active bg-indigo-500/10 text-white"
                          : "text-[#8b9ab8] hover:text-white hover:bg-white/[0.03]"
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <div className="flex items-center gap-2.5">
                        {cat !== "全部" && (
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color.solid }} />
                        )}
                        <span className="truncate">{cat}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${isActive ? "bg-indigo-500/20 text-indigo-300" : "bg-white/[0.04] text-[#546280]"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Main area */}
            <div className="flex-1 min-w-0">
              {/* Mobile category pills */}
              <div className="lg:hidden flex flex-wrap gap-2 mb-5 overflow-x-auto pb-2">
                {categories.map((cat) => {
                  const color = cat === "全部" ? DEFAULT_COLOR : CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                  return (
                    <button
                      key={cat}
                      className={`category-pill px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
                        selectedCategory === cat
                          ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                          : "bg-[#111827] border-white/[0.06] text-[#8b9ab8] hover:border-white/[0.12]"
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat !== "全部" && (
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color.solid }} />
                      )}
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Sort controls */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-[#546280]">
                  共 <span className="text-white font-semibold">{filteredTopics.length}</span> 個題材
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      sortBy === "count" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30" : "bg-[#111827] text-[#546280] border border-white/[0.06] hover:text-[#8b9ab8]"
                    }`}
                    onClick={() => setSortBy("count")}
                  >
                    按公司數
                  </button>
                  <button
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      sortBy === "name" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30" : "bg-[#111827] text-[#546280] border border-white/[0.06] hover:text-[#8b9ab8]"
                    }`}
                    onClick={() => setSortBy("name")}
                  >
                    按名稱
                  </button>
                </div>
              </div>

              {/* Topic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTopics.map((topic) => {
                  const cat = getCategory(topic.name);
                  const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                  return (
                    <button
                      key={topic.slug}
                      className={`topic-card-item text-left rounded-2xl border overflow-hidden transition-all ${
                        selectedTopicSlug === topic.slug
                          ? "border-indigo-500/60 shadow-lg shadow-indigo-500/10"
                          : "border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                      onClick={() => handleSelectTopic(topic.slug)}
                    >
                      {/* Gradient top bar */}
                      <div className={`h-1.5 bg-gradient-to-r ${color.gradient}`} />
                      <div className="bg-[#111827] p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color.solid }} />
                            <span className="text-[11px] font-medium text-[#546280] uppercase tracking-wider truncate">
                              {cat}
                            </span>
                          </div>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r ${color.gradient} text-white shrink-0`}>
                            {topic.total} 家
                          </span>
                        </div>
                        <h3 className="font-semibold text-[15px] text-white leading-snug mb-2 line-clamp-2">
                          {topic.name}
                        </h3>
                        {topic.description && (
                          <p className="text-xs text-[#546280] line-clamp-2 leading-relaxed">
                            {topic.description.substring(0, 120)}{topic.description.length > 120 ? "..." : ""}
                          </p>
                        )}
                        <div className="mt-4 pt-3 border-t border-white/[0.04]">
                          <span className="text-xs text-indigo-400 font-medium">查看詳情 →</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {filteredTopics.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-[#546280] text-lg">找不到符合條件的題材</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Map Tab (Detail View) ─── */}
        {activeTab === "map" && (
          <div className="fade-in">
            {!selectedTopicData ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-5">🗺️</div>
                <h2 className="text-2xl font-bold text-white mb-3">產業地圖</h2>
                <p className="text-[#8b9ab8] text-sm max-w-md mx-auto mb-8 leading-relaxed">
                  請先從「題材總覽」選擇一個題材，或從下方挑選，即可查看產業地圖與供應鏈結構。
                </p>
                <button
                  className="px-8 py-3 rounded-2xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                  onClick={() => setActiveTab("topics")}
                >
                  📋 瀏覽題材總覽
                </button>
                {/* Quick pick grid */}
                <div className="mt-10 max-w-3xl mx-auto">
                  <h3 className="text-sm font-medium text-[#546280] mb-4">熱門題材</h3>
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    {topics.slice(0, 12).map((t) => {
                      const cat = getCategory(t.name);
                      const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                      return (
                        <button
                          key={t.slug}
                          className="px-4 py-2 rounded-xl bg-[#111827] border border-white/[0.06] text-sm text-[#8b9ab8] hover:text-white hover:border-indigo-500/40 transition-all"
                          onClick={() => handleSelectTopic(t.slug)}
                        >
                          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color.solid }} />
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-8" ref={detailRef}>
                {/* Detail Panel */}
                <div className="flex-1 min-w-0">
                  {/* Back button & header */}
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      className="w-10 h-10 rounded-xl bg-[#111827] border border-white/[0.06] flex items-center justify-center text-[#8b9ab8] hover:text-white hover:border-white/[0.12] transition-colors text-lg"
                      onClick={() => setSelectedTopicSlug(null)}
                    >
                      ←
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        {(() => {
                          const cat = getCategory(selectedTopicData.name);
                          const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                          return (
                            <>
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color.solid }} />
                              <span className="text-xs font-medium text-[#546280]">{cat}</span>
                            </>
                          );
                        })()}
                      </div>
                      <h2 className="text-xl font-bold text-white truncate">{selectedTopicData.name}</h2>
                    </div>
                    <span className="text-xs bg-indigo-500/15 text-indigo-300 px-4 py-1.5 rounded-full font-medium shrink-0 border border-indigo-500/20">
                      {selectedTopicData.total} 家公司
                    </span>
                  </div>

                  {/* Description */}
                  {selectedTopicData.description && (
                    <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-5 mb-5">
                      <p className="text-sm text-[#8b9ab8] leading-relaxed">{selectedTopicData.description}</p>
                    </div>
                  )}

                  {/* View toggle */}
                  <div className="flex items-center gap-2.5 mb-5">
                    <button
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        detailViewMode === "list"
                          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                          : "bg-[#111827] text-[#546280] border border-white/[0.06] hover:text-[#8b9ab8]"
                      }`}
                      onClick={() => setDetailViewMode("list")}
                    >
                      📋 公司列表
                    </button>
                    <button
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        detailViewMode === "structure"
                          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                          : "bg-[#111827] text-[#546280] border border-white/[0.06] hover:text-[#8b9ab8]"
                      }`}
                      onClick={() => setDetailViewMode("structure")}
                    >
                      🔗 供應鏈結構
                    </button>
                  </div>

                  {/* List View */}
                  {detailViewMode === "list" && (
                    <div className="space-y-5">
                      {mapGroupNames(selectedTopicData.groups).map((group, gi) => (
                        <div key={gi} className="bg-[#111827] rounded-2xl border border-white/[0.06] overflow-hidden">
                          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-white">{group.name}</h3>
                            <span className="text-xs text-[#546280]">{group.companies.length} 家公司</span>
                          </div>
                          <div className="divide-y divide-white/[0.04]">
                            {group.companies.map((company) => {
                              const relInfo = getRelevanceInfo(company.relevance);
                              return (
                                <div key={company.code} className="company-card flex items-center justify-between px-5 py-4 gap-4">
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-11 h-11 rounded-xl bg-[#0a0e1a] border border-white/[0.06] flex items-center justify-center shrink-0">
                                      <span className="text-xs font-mono font-bold text-[#8b9ab8]">{company.code.slice(0, 4)}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">{company.name}</span>
                                        <span className="text-xs text-[#546280]">{company.code}</span>
                                      </div>
                                      {company.role && (
                                        <p className="text-xs text-[#546280] truncate mt-0.5">{company.role}</p>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`${relInfo.className} text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap shrink-0`}>
                                    {relInfo.emoji} {relInfo.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Structure View */}
                  {detailViewMode === "structure" && (
                    <div className="space-y-8">
                      {(() => {
                        const namedGroups = mapGroupNames(selectedTopicData.groups);
                        const levelColors = [
                          { bg: "bg-emerald-500/[0.06]", border: "border-emerald-500/20", text: "text-emerald-400", label: "上游", icon: "⬆️" },
                          { bg: "bg-amber-500/[0.06]", border: "border-amber-500/20", text: "text-amber-400", label: "中游", icon: "⏺️" },
                          { bg: "bg-blue-500/[0.06]", border: "border-blue-500/20", text: "text-blue-400", label: "下游", icon: "⬇️" },
                          { bg: "bg-purple-500/[0.06]", border: "border-purple-500/20", text: "text-purple-400", label: "周邊", icon: "🔄" },
                          { bg: "bg-slate-500/[0.06]", border: "border-slate-500/20", text: "text-slate-400", label: "其他", icon: "📦" },
                        ];
                        return namedGroups.map((group, gi) => {
                          const level = levelColors[Math.min(gi, levelColors.length - 1)];
                          return (
                            <div key={gi} className="slide-up" style={{ animationDelay: `${gi * 100}ms` }}>
                              {/* Level header */}
                              <div className="flex items-center gap-2.5 mb-4">
                                <span className="text-lg">{level.icon}</span>
                                <h3 className={`font-bold text-sm ${level.text}`}>
                                  {level.label}：{group.name}
                                </h3>
                                <span className="text-xs text-[#546280] ml-auto">{group.companies.length} 家</span>
                              </div>
                              {/* Flow arrows for middle levels */}
                              {gi > 0 && (
                                <div className="flex justify-center my-3">
                                  <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-5 bg-white/[0.08]" />
                                    <svg className="w-4 h-4 text-[#546280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                              {/* Company cards */}
                              <div className={`${level.bg} ${level.border} border rounded-2xl p-5`}>
                                <div className="flex flex-wrap gap-3">
                                  {group.companies.map((company) => {
                                    const relInfo = getRelevanceInfo(company.relevance);
                                    return (
                                      <div
                                        key={company.code}
                                        className="bg-[#0a0e1a]/80 border border-white/[0.06] rounded-xl px-4 py-2.5 flex items-center gap-2.5 hover:border-white/[0.12] transition-all"
                                      >
                                        <div className="text-center">
                                          <div className="text-xs font-bold text-white">{company.code}</div>
                                          <div className="text-[11px] text-[#8b9ab8]">{company.name}</div>
                                        </div>
                                        <span className={`${relInfo.className} text-[11px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap`}>
                                          {relInfo.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                {/* Right info panel (desktop only) */}
                <div className="hidden xl:block w-72 shrink-0">
                  <div className="sticky top-[136px] space-y-5">
                    {/* Quick stats */}
                    <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-5">
                      <h4 className="text-[11px] font-bold text-[#546280] uppercase tracking-widest mb-4">題材概要</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#8b9ab8]">公司總數</span>
                          <span className="text-white font-medium">{selectedTopicData.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#8b9ab8]">供應鏈層級</span>
                          <span className="text-white font-medium">{selectedTopicData.groups.length}</span>
                        </div>
                        {(() => {
                          const highRel = selectedTopicData.groups.reduce(
                            (acc, g) => acc + g.companies.filter((c) => String(c.relevance) === "高" || ["80","85","90","95"].includes(String(c.relevance))).length,
                            0
                          );
                          return (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#8b9ab8]">核心公司</span>
                              <span className="text-emerald-400 font-medium">{highRel}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Related topics */}
                    <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-5">
                      <h4 className="text-[11px] font-bold text-[#546280] uppercase tracking-widest mb-4">同類題材</h4>
                      <div className="space-y-2">
                        {topics
                          .filter((t) => getCategory(t.name) === getCategory(selectedTopicData.name) && t.slug !== selectedTopicData.slug)
                          .slice(0, 5)
                          .map((t) => (
                            <button
                              key={t.slug}
                              className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-[#8b9ab8] hover:text-white hover:bg-white/[0.04] transition-colors truncate"
                              onClick={() => handleSelectTopic(t.slug)}
                            >
                              {t.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Companies Tab ─── */}
        {activeTab === "companies" && (
          <div className="fade-in">
            <div className="flex items-center gap-5 mb-6">
              <div className="relative flex-1 max-w-lg">
                <div className="flex items-center rounded-2xl bg-[#161b28]">
                  <input
                    type="text"
                    placeholder="搜尋公司名稱或代碼..."
                    className="w-full bg-transparent px-5 py-3 text-sm text-white placeholder-[#4a5568] outline-none"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                  />
                  <div className="pr-4 text-[#4a5568]">
                    <SearchIcon />
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#546280]">
                共 <span className="text-white font-semibold">{filteredCompanies.length}</span> 家公司
              </p>
            </div>

            <div className="bg-[#111827] rounded-2xl border border-white/[0.06] overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[90px_1fr_100px_1fr] px-5 py-3.5 border-b border-white/[0.06] bg-[#0a0e1a]/60">
                <span className="text-[11px] font-bold text-[#546280] uppercase tracking-wider">代碼</span>
                <span className="text-[11px] font-bold text-[#546280] uppercase tracking-wider">名稱</span>
                <span className="text-[11px] font-bold text-[#546280] uppercase tracking-wider">題材數</span>
                <span className="text-[11px] font-bold text-[#546280] uppercase tracking-wider">相關題材</span>
              </div>
              {/* Table body */}
              <div className="divide-y divide-white/[0.04] max-h-[calc(100vh-320px)] overflow-y-auto">
                {filteredCompanies.slice(0, 100).map((company) => {
                  const companyTopics = topics.filter((t) => company.topics.includes(t.slug));
                  return (
                    <div
                      key={company.code}
                      className="company-card grid grid-cols-[90px_1fr_100px_1fr] px-5 py-4 items-center gap-4"
                    >
                      <span className="text-sm font-mono font-bold text-indigo-400">{company.code}</span>
                      <span className="text-sm text-white font-medium">{company.name}</span>
                      <span className="text-sm text-[#8b9ab8]">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/15 text-xs text-indigo-300 font-bold">
                          {company.topic_count}
                        </span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {companyTopics.slice(0, 3).map((t) => {
                          const cat = getCategory(t.name);
                          const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                          return (
                            <button
                              key={t.slug}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border hover:border-indigo-500/40 transition-colors cursor-pointer"
                              style={{
                                backgroundColor: `${color.solid}12`,
                                borderColor: `${color.solid}30`,
                                color: color.solid,
                              }}
                              onClick={() => {
                                handleSelectTopic(t.slug);
                                setActiveTab("map");
                              }}
                            >
                              {t.name}
                            </button>
                          );
                        })}
                        {companyTopics.length > 3 && (
                          <span className="text-[11px] text-[#546280] self-center ml-1">+{companyTopics.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredCompanies.length > 100 && (
                <div className="px-5 py-4 border-t border-white/[0.04] text-center text-xs text-[#546280]">
                  顯示前 100 筆，共 {filteredCompanies.length} 家公司
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.04] mt-8 py-8">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 text-center text-xs text-[#3a4560]">
          台股產業鏈知識圖譜 · 資料來源：aistockmap.com + CasualMarket + 多源驗證 · 最後更新：2026-05-18
        </div>
      </footer>
    </div>
  );
}