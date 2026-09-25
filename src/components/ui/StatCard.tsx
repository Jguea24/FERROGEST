import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'amber',
  trend,
}) => {
  const colorMap = {
    amber: {
      bg: 'bg-amber-500/10',
      iconText: 'text-amber-600',
      border: 'border-amber-200/60',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      iconText: 'text-emerald-600',
      border: 'border-emerald-200/60',
    },
    blue: {
      bg: 'bg-sky-500/10',
      iconText: 'text-sky-600',
      border: 'border-sky-200/60',
    },
    purple: {
      bg: 'bg-purple-500/10',
      iconText: 'text-purple-600',
      border: 'border-purple-200/60',
    },
    rose: {
      bg: 'bg-rose-500/10',
      iconText: 'text-rose-600',
      border: 'border-rose-200/60',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className={`bg-white p-5 rounded-xl border ${scheme.border} shadow-xs flex items-start justify-between`}>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        {trend && <p className="text-xs font-semibold text-emerald-600 pt-1">{trend}</p>}
      </div>
      <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.iconText}`}>
        <Icon className="w-5 h-5 stroke-[2.2]" />
      </div>
    </div>
  );
};
