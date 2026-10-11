import { CalendarRange } from 'lucide-react';
import type { PeriodPreset } from '#/domains/transactions/schemas.ts';

export const PERIOD_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: 'TODAY', label: 'Hoje' },
  { value: 'THIS_WEEK', label: 'Esta semana' },
  { value: 'THIS_MONTH', label: 'Este mês' },
  { value: 'LAST_MONTH', label: 'Mês anterior' },
  { value: 'LAST_3_MONTHS', label: 'Últimos 3 meses' },
  { value: 'LAST_6_MONTHS', label: 'Últimos 6 meses' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

interface PeriodSelectorProps {
  period: PeriodPreset;
  startDate?: string;
  endDate?: string;
  onChange: (next: {
    period: PeriodPreset;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export function PeriodSelector({
  period,
  startDate = '',
  endDate = '',
  onChange,
}: PeriodSelectorProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/90">
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = period === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({
                    period: opt.value,
                    startDate: opt.value === 'CUSTOM' ? startDate : undefined,
                    endDate: opt.value === 'CUSTOM' ? endDate : undefined,
                  })
                }
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-amber-400 text-slate-900 dark:text-zinc-950 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {period === 'CUSTOM' && (
        <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
            <CalendarRange className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
            <span>Intervalo personalizado:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Data inicial"
              value={startDate}
              onChange={(e) =>
                onChange({
                  period: 'CUSTOM',
                  startDate: e.target.value,
                  endDate,
                })
              }
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono-tabular text-slate-900 dark:text-zinc-100"
            />
            <span className="text-xs text-slate-400">até</span>
            <input
              type="date"
              aria-label="Data final"
              value={endDate}
              onChange={(e) =>
                onChange({
                  period: 'CUSTOM',
                  startDate,
                  endDate: e.target.value,
                })
              }
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono-tabular text-slate-900 dark:text-zinc-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
