import { cn } from "@/lib/utils";

export interface CompanyIndustryRoleNavigationRole {
  topicName: string;
}

export interface CompanyIndustryRoleNavigationProps {
  roles: CompanyIndustryRoleNavigationRole[];
  activeIndex: number;
  onRoleChange: (index: number) => void;
}

const CATEGORY_COLORS: Record<string, { solid: string }> = {
  "半導體製造": { solid: "#3b82f6" },
  "IC設計": { solid: "#8b5cf6" },
  "IC 設計": { solid: "#8b5cf6" },
  "先進封測": { solid: "#06b6d4" },
  "基板材料": { solid: "#f59e0b" },
  "記憶體": { solid: "#22c55e" },
  "AI 伺服器": { solid: "#f43f5e" },
  "散熱冷卻": { solid: "#f97316" },
  "散熱": { solid: "#f97316" },
  "電子零組件": { solid: "#6366f1" },
  "被動元件": { solid: "#14b8a6" },
  "網通衛星": { solid: "#0ea5e9" },
  "光學顯示": { solid: "#d946ef" },
  "消費終端": { solid: "#ec4899" },
  "醫療器材": { solid: "#ef4444" },
  "綠能環保": { solid: "#10b981" },
  "傳產工業": { solid: "#eab308" },
  "金融航運": { solid: "#94a3b8" },
  "智慧機器人": { solid: "#7c3aed" },
  "軟體資安": { solid: "#84cc16" },
  "HPC": { solid: "#6366f1" },
  "光通訊": { solid: "#f472b6" },
};

const DEFAULT_COLOR = { solid: "#6b7280" };

function getCategory(topicName: string): string {
  if (topicName.includes("｜")) return topicName.split("｜")[0];
  return "其他";
}

function getTopicShortName(topicName: string): string {
  return topicName.includes("｜") ? topicName.split("｜")[1] || topicName : topicName;
}

export function CompanyIndustryRoleNavigation({
  roles,
  activeIndex,
  onRoleChange,
}: CompanyIndustryRoleNavigationProps) {
  return (
    <>
      <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-white">產業定位總覽</h4>
          <span className="text-[11px] text-cyan-300">已過濾間接受惠題材 · {roles.length} 個直接角色</span>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          這裡先把公司在題材中的「直接產品/技術平台/供應鏈角色」統整後再呈現；下方題材卡只保留可點擊的核心歸屬，避免把所有終端應用題材都算成公司本業。
        </p>
      </div>

      {/* Industry sub-tabs */}
      <div className="grid gap-2 pb-2 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role, i) => {
          const topicShort = getTopicShortName(role.topicName);
          const cat = getCategory(role.topicName);
          const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
          return (
            <button
              key={i}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all border",
                activeIndex === i
                  ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] border-indigo-500/40"
                  : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
              )}
              onClick={() => onRoleChange(i)}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color.solid }} />
              {topicShort}
            </button>
          );
        })}
      </div>
    </>
  );
}
