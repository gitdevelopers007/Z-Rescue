import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}) => {
  const variantStyles = {
    default: {
      card: 'bg-white border-slate-200',
      iconBox: 'bg-slate-100 text-slate-700',
      val: 'text-slate-900',
    },
    danger: {
      card: 'bg-white border-rose-200',
      iconBox: 'bg-rose-50 text-rose-600',
      val: 'text-rose-700',
    },
    warning: {
      card: 'bg-white border-amber-200',
      iconBox: 'bg-amber-50 text-amber-600',
      val: 'text-amber-700',
    },
    success: {
      card: 'bg-white border-emerald-200',
      iconBox: 'bg-emerald-50 text-emerald-600',
      val: 'text-emerald-700',
    },
    info: {
      card: 'bg-white border-sky-200',
      iconBox: 'bg-sky-50 text-sky-600',
      val: 'text-sky-700',
    },
  }[variant];

  return (
    <div className={`p-5 rounded-xl border shadow-sm transition hover:shadow-md ${variantStyles.card}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</span>
        <div className={`p-2 rounded-lg ${variantStyles.iconBox}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold tracking-tight font-mono ${variantStyles.val}`}>{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              trend.isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
