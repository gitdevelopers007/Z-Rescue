import React from 'react';

// 1. Interactive Bar Chart
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 160 }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full flex items-end gap-3 pt-6 pb-2" style={{ height }}>
      {data.map((item, idx) => {
        const heightPct = Math.max(8, (item.value / maxValue) * 100);
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
            <span className="text-[11px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition">
              {item.value}
            </span>
            <div
              className={`w-full rounded-t-md transition-all duration-500 ${
                item.color || 'bg-sky-500 hover:bg-sky-600'
              }`}
              style={{ height: `${heightPct}%` }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-[11px] font-medium text-slate-600 truncate max-w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// 2. Risk Distribution Donut Chart
interface DonutChartProps {
  data: { label: string; count: number; color: string }[];
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 160 }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  let accumulatedAngle = 0;

  const radius = 55;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6 justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {data.map((item, idx) => {
            const pct = item.count / total;
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedAngle * circumference;
            accumulatedAngle += pct;

            return (
              <circle
                key={idx}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono text-slate-800">{total}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-slate-600 font-medium">{item.label}:</span>
            <span className="font-mono font-bold text-slate-900">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Mini SVG Line Trend
interface LineTrendProps {
  points: number[];
  height?: number;
  color?: string;
}

export const LineTrend: React.FC<LineTrendProps> = ({
  points,
  height = 40,
  color = '#0284c7',
}) => {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points) || 1;
  const range = max - min || 1;
  const width = 120;

  const pathPoints = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pathPoints}
      />
    </svg>
  );
};
