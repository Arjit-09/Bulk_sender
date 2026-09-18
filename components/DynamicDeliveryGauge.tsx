'use client';

import { CheckCircle2, Send, AlertTriangle, Clock } from 'lucide-react';

interface DynamicDeliveryGaugeProps {
  rate: number;
  breakdown: {
    delivered: number;
    sent: number;
    failed: number;
    pending: number;
  };
}

export default function DynamicDeliveryGauge({ rate, breakdown }: DynamicDeliveryGaugeProps) {
  const total = breakdown.delivered + breakdown.sent + breakdown.failed + breakdown.pending;

  const getPercent = (val: number) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Delivery Performance</h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 font-medium">
            Dynamic KPI
          </span>
        </div>

        {/* Circular / Hero Metric */}
        <div className="flex items-center gap-5 my-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#10b981]/20 to-[#06b6d4]/20 border border-[#10b981]/40 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/10">
            <span className="text-2xl font-black text-white">{rate}%</span>
            <span className="text-[9px] uppercase tracking-wider text-[#34d399] font-bold">Success</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {total === 0 ? 'No Messages Processed' : `${breakdown.delivered} of ${total} Delivered`}
            </p>
            <p className="text-xs text-[#94a3b8] mt-1">
              Calculated dynamically via SQL query across all outbound messages.
            </p>
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-3 rounded-full bg-[#181a35] overflow-hidden flex my-4">
          {total === 0 ? (
            <div className="w-full bg-[#1e2246] h-full" />
          ) : (
            <>
              <div
                style={{ width: `${getPercent(breakdown.delivered)}%` }}
                className="bg-[#10b981] transition-all duration-500"
                title={`Delivered: ${breakdown.delivered}`}
              />
              <div
                style={{ width: `${getPercent(breakdown.sent)}%` }}
                className="bg-[#06b6d4] transition-all duration-500"
                title={`In Transit: ${breakdown.sent}`}
              />
              <div
                style={{ width: `${getPercent(breakdown.failed)}%` }}
                className="bg-[#ef4444] transition-all duration-500"
                title={`Failed: ${breakdown.failed}`}
              />
              <div
                style={{ width: `${getPercent(breakdown.pending)}%` }}
                className="bg-[#f59e0b] transition-all duration-500"
                title={`Pending: ${breakdown.pending}`}
              />
            </>
          )}
        </div>
      </div>

      {/* Metric Breakdown Badges */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#6366f1]/15">
        <div className="p-2.5 rounded-xl bg-[#12142e] border border-[#10b981]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
            <span className="text-xs text-[#94a3b8]">Delivered</span>
          </div>
          <span className="text-xs font-bold text-white">{breakdown.delivered}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#12142e] border border-[#06b6d4]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span className="text-xs text-[#94a3b8]">In Transit</span>
          </div>
          <span className="text-xs font-bold text-white">{breakdown.sent}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#12142e] border border-[#ef4444]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
            <span className="text-xs text-[#94a3b8]">Failed</span>
          </div>
          <span className="text-xs font-bold text-white">{breakdown.failed}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#12142e] border border-[#f59e0b]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span className="text-xs text-[#94a3b8]">Pending</span>
          </div>
          <span className="text-xs font-bold text-white">{breakdown.pending}</span>
        </div>
      </div>
    </div>
  );
}
