import type { ReactNode } from "react";

import { CompanyIndustryKnowledgeOverview } from "@/components/company-detail/CompanyIndustryKnowledgeOverview";
import type { CompanyIndustryInsights } from "@/lib/companyIndustryInsights";

export interface CompanyIndustryTabShellProps {
  industryInsights: CompanyIndustryInsights;
  hasIndustryRoles: boolean;
  children: ReactNode;
}

export function CompanyIndustryTabShell({
  industryInsights,
  hasIndustryRoles,
  children,
}: CompanyIndustryTabShellProps) {
  return (
    <div className="space-y-6">
      <CompanyIndustryKnowledgeOverview industryInsights={industryInsights} />

      {hasIndustryRoles ? (
        <>{children}</>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏭</div>
          <h3 className="text-lg font-semibold text-white mb-2">尚無產業關聯</h3>
          <p className="text-sm text-[var(--color-text-tertiary)]">此公司尚未建立產業關聯分析。</p>
        </div>
      )}
    </div>
  );
}
