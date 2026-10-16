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
    <div className="zs-card p-5 sm:p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[var(--text-heading)]">Delivery Performance</h3>
          <span className="zs-badge zs-badge-success">
            Dynamic SQL
          </span>
        </div>

        {/* Circular / Hero Metric */}
        <div className="flex items-center gap-5 my-4">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shadow-xs">
            <span className="text-2xl font-black text-emerald-600">{rate}%</span>
            <span className="text-[9px] uppercase tracking-wider text-emerald-700 font-bold">Success</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-heading)]">
              {total === 0 ? 'No Messages Processed' : `${breakdown.delivered} of ${total} Delivered`}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Calculated dynamically via SQL query across all outbound messages.
            </p>
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden flex my-4">
          {total === 0 ? (
            <div className="w-full bg-[var(--bg-surface)] h-full" />
          ) : (
            <>
              <div
                style={{ width: `${getPercent(breakdown.delivered)}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Delivered: ${breakdown.delivered}`}
              />
              <div
                style={{ width: `${getPercent(breakdown.sent)}%` }}
                className="bg-cyan-500 transition-all duration-500"
                title={`Sent: ${breakdown.sent}`}
              />
              <div
                style={{ width: `${getPercent(breakdown.pending)}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Pending: ${breakdown.pending}`}
              />
              <div
                style={{ width: `${getPercent(breakdown.failed)}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Failed: ${breakdown.failed}`}
              />
            </>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-2">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Delivered ({breakdown.delivered})</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>In Transit ({breakdown.sent})</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Pending ({breakdown.pending})</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Failed ({breakdown.failed})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
