interface CompanyInfoHeaderProfile {
  industry: string;
  chairman: string;
  established: string;
  website: string;
  address?: string;
}

interface CompanyInfoHeaderData {
  code: string;
  name: string;
  profile: CompanyInfoHeaderProfile;
  marketCap?: string;
}

function ExternalIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
}

export function CompanyInfoHeader({ data }: { data: CompanyInfoHeaderData }) {
  const marketCap = data.marketCap || "-";
  const established = data.profile.established;
  const establishedYear = (() => {
    if (!established || established.length < 4) return "-";
    const s = established;
    // YYYYMMDD or YYYY/MM/DD format — already CE year
    if (s.length >= 8 && parseInt(s.slice(0, 4)) > 1900) return s.slice(0, 4);
    if (s.includes("/") && parseInt(s.split("/")[0]) > 1900) return s.split("/")[0];
    // ROC year format: 0760221 → 1987
    if (s.length === 7 || s.length === 8) {
      const rocYear = parseInt(s.slice(0, 3));
      if (rocYear > 0 && rocYear < 200) return `${rocYear + 1911}`;
    }
    return s.slice(0, 4);
  })();
  const headquarters = data.profile.address || "";

  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6">
      {/* Company name big title */}
      <h3 className="text-2xl font-bold text-white mb-4">
        {data.name}<span className="text-[var(--color-text-tertiary)] font-normal ml-1">({data.code})</span>
      </h3>
      {/* Info grid — 2 columns as per aistockmap */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div>
          <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-widest">市值</span>
          <div className="text-lg font-bold text-white mt-0.5">{marketCap}</div>
        </div>
        <div>
          <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-widest">產業分類</span>
          <div className="text-[var(--color-text-secondary)] font-medium mt-0.5">{data.profile.industry || "-"}</div>
        </div>
        <div>
          <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-widest">成立年份</span>
          <div className="text-[var(--color-text-secondary)] font-medium mt-0.5">{establishedYear}</div>
        </div>
        <div>
          <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-widest">董事長</span>
          <div className="text-[var(--color-text-secondary)] font-medium mt-0.5">{data.profile.chairman || "-"}</div>
        </div>
        <div>
          <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-widest">總部</span>
          <div className="text-[var(--color-text-secondary)] font-medium mt-0.5">{headquarters || "N/A"}</div>
        </div>
        <div>
          <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-widest">官方網站</span>
          <div className="mt-0.5">
            {data.profile.website ? (
              <a href={data.profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 truncate">
                {data.profile.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                <ExternalIcon />
              </a>
            ) : (
              <span className="text-[var(--color-text-tertiary)]">-</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
