import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'info';
}

export default function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  color = 'primary',
}: StatCardProps) {
  const colorMap = {
    primary: {
      bg: 'from-[#6366f1]/15 to-[#6366f1]/5',
      border: 'border-[#6366f1]/30',
      iconBg: 'bg-[#6366f1]/20 text-[#818cf8]',
      text: 'text-[#818cf8]',
    },
    success: {
      bg: 'from-[#10b981]/15 to-[#10b981]/5',
      border: 'border-[#10b981]/30',
      iconBg: 'bg-[#10b981]/20 text-[#34d399]',
      text: 'text-[#34d399]',
    },
    warning: {
      bg: 'from-[#f59e0b]/15 to-[#f59e0b]/5',
      border: 'border-[#f59e0b]/30',
      iconBg: 'bg-[#f59e0b]/20 text-[#fbbf24]',
      text: 'text-[#fbbf24]',
    },
    info: {
      bg: 'from-[#06b6d4]/15 to-[#06b6d4]/5',
      border: 'border-[#06b6d4]/30',
      iconBg: 'bg-[#06b6d4]/20 text-[#22d3ee]',
      text: 'text-[#22d3ee]',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      className={`p-5 rounded-2xl bg-gradient-to-br ${scheme.bg} bg-[#0f1129] border ${scheme.border} relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#94a3b8] tracking-wide uppercase">
          {label}
        </span>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-white tracking-tight">
          {value}
        </span>
      </div>
      {subValue && (
        <p className="text-xs text-[#94a3b8] mt-1.5 flex items-center gap-1">
          {subValue}
        </p>
      )}
    </div>
  );
}
