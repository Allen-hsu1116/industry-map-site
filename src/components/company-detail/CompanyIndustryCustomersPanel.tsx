export interface CompanyIndustryCustomersPanelProps {
  customers: string[];
}

export function CompanyIndustryCustomersPanel({ customers }: CompanyIndustryCustomersPanelProps) {
  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <h4 className="text-sm font-bold text-white mb-3">👥 主要客戶</h4>
      <div className="space-y-3">
        {customers.map((customer, index) => {
          const [name, ...descParts] = customer.split(': ');
          const desc = descParts.join(': ');
          return (
            <div key={`${name}-${index}`}>
              <p className="text-sm font-semibold text-white">{name}</p>
              {desc && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{desc}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
