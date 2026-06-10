export interface CompanyIndustrySupplyChainRolePanelBadge {
  color: string;
  bg: string;
}

export interface CompanyIndustrySupplyChainRolePanelRelevanceInfo {
  emoji: string;
  label: string;
}

export interface CompanyIndustrySupplyChainRolePanelProps {
  group: string;
  role?: string;
  displayRoleBadge: CompanyIndustrySupplyChainRolePanelBadge;
  displayRelInfo: CompanyIndustrySupplyChainRolePanelRelevanceInfo;
  roleLabel?: string;
  roleSummary?: string;
  v2SupplyChainStage?: string;
  v2RoleType?: string;
  roleRisks: string[];
  sourceChips: string[];
}

export function CompanyIndustrySupplyChainRolePanel({
  group,
  role,
  displayRoleBadge,
  displayRelInfo,
  roleLabel,
  roleSummary,
  v2SupplyChainStage,
  v2RoleType,
  roleRisks,
  sourceChips,
}: CompanyIndustrySupplyChainRolePanelProps) {
  const uniqueSourceChips = [...new Set(sourceChips)].slice(0, 8);
  const hasV2RoleDetail = Boolean(v2SupplyChainStage || v2RoleType || roleRisks.length > 0);

  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <h4 className="text-sm font-bold text-white mb-3">🔗 在此產業的角色</h4>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">供應鏈群組</span>
          <span className="text-sm text-white font-medium">{group}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">角色定位</span>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap" style={{ color: displayRoleBadge.color, backgroundColor: displayRoleBadge.bg }}>
            {displayRelInfo.emoji} {roleLabel ?? displayRelInfo.label}
          </span>
        </div>
        {role && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-[var(--color-text-secondary)]">角色說明</span>
            <span className="text-sm text-white font-medium text-right">{roleSummary ?? role}</span>
          </div>
        )}
        {hasV2RoleDetail && (
          <>
            {v2SupplyChainStage && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[var(--color-text-secondary)]">V2 供應鏈階段</span>
                <span className="text-sm text-white font-medium text-right">{v2SupplyChainStage}</span>
              </div>
            )}
            {v2RoleType && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[var(--color-text-secondary)]">V2 角色類型</span>
                <span className="text-sm text-white font-medium text-right">{v2RoleType}</span>
              </div>
            )}
            {roleRisks.length > 0 && (
              <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.04] p-3">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-amber-200">題材角色風險</div>
                <ul className="space-y-1">
                  {roleRisks.slice(0, 3).map((risk, i) => <li key={i} className="text-xs leading-relaxed text-[var(--color-text-secondary)]">• {risk}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
        {uniqueSourceChips.length > 0 && (
          <div className="pt-3 border-t border-white/[0.04]">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">資料來源 / 校正依據</div>
            <div className="flex flex-wrap gap-2">
              {uniqueSourceChips.map((source) => (
                <span key={source} className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[var(--color-text-secondary)]">{source}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
