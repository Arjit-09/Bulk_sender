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
      iconBg: 'bg-indigo-50 text-indigo-600',
      badge: 'text-indigo-600',
    },
    success: {
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'text-emerald-600',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600',
      badge: 'text-amber-600',
    },
    info: {
      iconBg: 'bg-cyan-50 text-cyan-600',
      badge: 'text-cyan-600',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className="zs-card p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-xs hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide uppercase">
          {label}
        </span>
        <div className={`p-2 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-[var(--text-heading)] tracking-tight">
          {value}
        </span>
      </div>
      {subValue && (
        <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-1 font-medium">
          {subValue}
        </p>
      )}
    </div>
  );
}
