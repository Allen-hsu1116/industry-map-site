import type { ReactNode } from "react";

export interface CompanyDetailHeroHeaderBadge {
  label: string;
  color: string;
  show: boolean;
}

export interface CompanyDetailHeroHeaderData {
  code: string;
  name: string;
  profile: {
    industry: string;
  };
}

export interface CompanyDetailHeroHeaderMarketPosition {
  label: string;
  color: string;
}

export interface CompanyDetailHeroHeaderProps {
  data: CompanyDetailHeroHeaderData;
  marketPosition: CompanyDetailHeroHeaderMarketPosition;
  badges: CompanyDetailHeroHeaderBadge[];
  onBack: () => void;
  quoteContent?: ReactNode;
}

export function CompanyDetailHeroHeader({
  data,
  marketPosition,
  badges,
  onBack,
  quoteContent,
}: CompanyDetailHeroHeaderProps) {
  return (
    <>
      {/* ─── Top Bar: Back + Company Header (aistockmap style) ─── */}
      <div className="flex items-center justify-between mb-4">
        <button
          className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors group"
          onClick={onBack}
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <button className="flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-rose-400 transition-colors px-3 py-1.5 rounded-full border border-white/[0.06] hover:border-rose-400/30">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          加入收藏
        </button>
      </div>

      {/* ─── Company Title (aistockmap style: badge + name) ─── */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
            {data.code}
          </span>
          <h1 className="text-2xl font-bold text-white">
            {data.name}
          </h1>
        </div>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1 ml-1">
          {data.profile.industry} · <span style={{ color: marketPosition.color }}>{marketPosition.label}</span>
        </p>
        {/* ─── Real-time Quote ─── */}
        {quoteContent && (
          <div className="mt-2">
            {quoteContent}
          </div>
        )}
      </div>

      {/* ─── Badges (aistockmap style pill badges) ─── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {badges.filter((badge) => badge.show).map((badge, index) => (
          <span
            key={index}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ color: badge.color, backgroundColor: `${badge.color}15`, border: `1px solid ${badge.color}25` }}
          >
            {badge.label}
          </span>
        ))}
      </div>
    </>
  );
}
