'use client';

import { BarChart3 } from 'lucide-react';

interface DayActivity {
  day: string;
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}

interface DynamicVolumeChartProps {
  data: DayActivity[];
}

export default function DynamicVolumeChart({ data }: DynamicVolumeChartProps) {
  const totalSent = data.reduce((sum, d) => sum + d.sent, 0);
  const maxSent = Math.max(...data.map((d) => d.sent), 5);

  return (
    <div className="zs-card p-5 sm:p-6 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            7-Day Multi-Channel Dispatch Volume
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Live aggregated metrics from PostgreSQL</p>
        </div>
        <span className="zs-badge zs-badge-primary">
          {totalSent} total sent
        </span>
      </div>

      {totalSent === 0 ? (
        <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-elevated)]">
          <BarChart3 className="w-8 h-8 text-[var(--text-muted)] mb-2 opacity-50" />
          <p className="text-sm font-semibold text-[var(--text-heading)]">No Message Activity Yet</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs mt-1">
            Dispatch a Quick SMS or launch a Campaign to see dynamic volume bars populated in real time.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex items-end justify-between gap-3 pt-6 min-h-[180px]">
          {data.map((item, idx) => {
            const heightPercent = item.sent > 0 ? Math.round((item.sent / maxSent) * 100) : 6;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Tooltip */}
                <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[var(--text-heading)] text-white rounded-lg px-2.5 py-1.5 text-[10px] shadow-lg z-20 whitespace-nowrap">
                  <p className="font-semibold text-indigo-300">{item.date}</p>
                  <p>Sent: {item.sent} • Delivered: {item.delivered}</p>
                </div>

                {/* Bar */}
                <div className="w-full bg-[var(--bg-elevated)] rounded-lg h-36 flex items-end overflow-hidden p-1">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-indigo-600 to-cyan-500 rounded-md transition-all duration-500 group-hover:brightness-110"
                  />
                </div>

                {/* Day label */}
                <span className="text-[10px] font-medium text-[var(--text-muted)]">{item.day}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
