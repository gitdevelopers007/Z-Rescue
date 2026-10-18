import React from 'react';

interface RiskBadgeProps {
  category: 'Low' | 'Moderate' | 'High' | 'Critical' | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, size = 'md' }) => {
  const cat = category?.toLowerCase();
  let colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';

  if (cat === 'moderate') {
    colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (cat === 'high') {
    colorStyles = 'bg-orange-50 text-orange-700 border-orange-300';
    dotColor = 'bg-orange-500';
  } else if (cat === 'critical') {
    colorStyles = 'bg-rose-50 text-rose-700 border-rose-300';
    dotColor = 'bg-rose-600 animate-pulse';
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colorStyles} ${sizeStyles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{category}</span>
      {score !== undefined && (
        <span className="font-mono opacity-80">({score}%)</span>
      )}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toUpperCase();
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (s === 'IN_TRANSIT') {
    styles = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (s === 'DELAYED') {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (s === 'DELIVERED') {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (s === 'CANCELLED') {
    styles = 'bg-rose-50 text-rose-800 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styles}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const sev = severity?.toUpperCase();
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (sev === 'CRITICAL') {
    styles = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
  } else if (sev === 'HIGH') {
    styles = 'bg-orange-100 text-orange-800 border-orange-300';
  } else if (sev === 'WARNING') {
    styles = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (sev === 'INFO') {
    styles = 'bg-sky-100 text-sky-800 border-sky-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styles}`}>
      {severity}
    </span>
  );
};
