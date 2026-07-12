import { useMemo } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

export function MiniBarChart({ data, height = 120, color = '#16c474' }: {
  data: DataPoint[];
  height?: number;
  color?: string;
}) {
  const max = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="relative w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-md transition-all duration-500 group-hover:opacity-80"
                style={{
                  height: `${Math.max(h, 2)}%`,
                  background: `linear-gradient(to top, ${color}40, ${color})`,
                  minHeight: '4px',
                }}
              />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-bg-elevated text-xs px-2 py-1 rounded-md whitespace-nowrap pointer-events-none z-10">
                {d.value.toLocaleString()}
              </div>
            </div>
            <span className="text-[10px] text-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ segments, size = 140 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = size / 2 - 12;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1a2032" strokeWidth="16" />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * circ;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ background: seg.color }} />
            <span className="text-muted">{seg.label}</span>
            <span className="text-white font-mono font-semibold ml-auto">{seg.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
