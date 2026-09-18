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
  const maxSent = Math.max(...data.map((d) => d.sent), 5); // default floor so bars scale nicely

  return (
    <div className="p-6 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#818cf8]" />
            7-Day Dynamic SMS Dispatch Volume
          </h3>
          <p className="text-xs text-[#94a3b8]">Live aggregated metrics from PostgreSQL</p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30">
          {totalSent} total sent this week
        </span>
      </div>

      {totalSent === 0 ? (
        <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#6366f1]/20 rounded-xl bg-[#12142e]/50">
          <BarChart3 className="w-8 h-8 text-[#94a3b8] mb-2 opacity-50" />
          <p className="text-sm font-medium text-white">No Message Activity Yet</p>
          <p className="text-xs text-[#94a3b8] max-w-xs mt-1">
            Dispatch a Quick SMS or launch a Campaign to see dynamic volume bars populated in real time.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex items-end justify-between gap-3 pt-6 min-h-[180px]">
          {data.map((item, idx) => {
            const heightPercent = item.sent > 0 ? Math.round((item.sent / maxSent) * 100) : 4;
            const deliveredHeight = item.sent > 0 ? Math.round((item.delivered / item.sent) * 100) : 0;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Hover Tooltip */}
                <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#181a35] border border-[#6366f1]/30 rounded-lg p-2 text-[10px] text-white shadow-xl z-20 whitespace-nowrap">
                  <p className="font-semibold text-[#818cf8]">{item.date}</p>
                  <p>Sent: {item.sent}</p>
                  <p className="text-[#34d399]">Delivered: {item.delivered}</p>
                  {item.failed > 0 && <p className="text-[#f87171]">Failed: {item.failed}</p>}
                </div>

                {/* Bar */}
                <div className="w-full bg-[#181a35] rounded-lg h-36 flex items-end p-1 overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-[#6366f1] to-[#06b6d4] rounded-md transition-all duration-500 relative group-hover:brightness-125"
                  >
                    {item.failed > 0 && (
                      <div
                        style={{ height: `${100 - deliveredHeight}%` }}
                        className="w-full bg-[#ef4444] rounded-t-md absolute top-0"
                      />
                    )}
                  </div>
                </div>

                {/* Day label */}
                <span className="text-[11px] font-medium text-[#94a3b8] group-hover:text-white transition-colors">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#6366f1]/15 text-xs text-[#94a3b8]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#6366f1] to-[#06b6d4]" />
          <span>Delivered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
          <span>Failed</span>
        </div>
      </div>
    </div>
  );
}
