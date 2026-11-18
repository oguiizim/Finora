import { CalendarDays, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '#/components/ui/calendar.tsx';
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

function formatSelectedDate(value: string): string {
  return value ? format(parseISO(value), 'dd/MM/yyyy') : 'dd/mm/aaaa';
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDateInput(value: string): string | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year)
    || date.getMonth() !== Number(month) - 1
    || date.getDate() !== Number(day)
  ) return null;
  return `${year}-${month}-${day}`;
}

export function PeriodSelector({
  period,
  startDate = '',
  endDate = '',
  onChange,
}: PeriodSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTrigger, setCalendarTrigger] = useState<'start' | 'end'>('start');
  const calendarPopoverRef = useRef<HTMLDivElement | null>(null);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const [draftStartInput, setDraftStartInput] = useState(startDate ? formatSelectedDate(startDate) : '');
  const [draftEndInput, setDraftEndInput] = useState(endDate ? formatSelectedDate(endDate) : '');
  const selectedRange: DateRange | undefined = draftStartDate
    ? { from: parseISO(draftStartDate), to: draftEndDate ? parseISO(draftEndDate) : undefined }
    : undefined;

  useEffect(() => {
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setDraftStartInput(startDate ? formatSelectedDate(startDate) : '');
    setDraftEndInput(endDate ? formatSelectedDate(endDate) : '');
  }, [startDate, endDate]);

  useEffect(() => {
    if (!isCalendarOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !calendarPopoverRef.current?.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCalendarOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isCalendarOpen]);

  const setDraftRange = (nextStartDate: string, nextEndDate: string) => {
    setDraftStartDate(nextStartDate);
    setDraftEndDate(nextEndDate);
    setDraftStartInput(nextStartDate ? formatSelectedDate(nextStartDate) : '');
    setDraftEndInput(nextEndDate ? formatSelectedDate(nextEndDate) : '');
    if (nextStartDate && nextEndDate) {
      onChange({
        period: 'CUSTOM',
        startDate: nextStartDate,
        endDate: nextEndDate,
      });
    }
  };

  const handleManualDateChange = (field: 'start' | 'end', value: string) => {
    const formattedValue = formatDateInput(value);
    const parsedDate = parseDateInput(formattedValue);
    if (field === 'start') {
      setDraftStartInput(formattedValue);
      if (parsedDate) setDraftRange(parsedDate, draftEndDate);
    } else {
      setDraftEndInput(formattedValue);
      if (parsedDate) setDraftRange(draftStartDate, parsedDate);
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      setDraftRange('', '');
      return;
    }

    const nextStartDate = format(range.from, 'yyyy-MM-dd');
    const nextEndDate = range.to ? format(range.to, 'yyyy-MM-dd') : '';
    setDraftRange(nextStartDate, nextEndDate);
    if (nextEndDate) setIsCalendarOpen(false);
  };

  const calendarPopover = (alignment: 'left-0' | 'right-0') => (
    <div
      role="dialog"
      aria-label="Selecionar intervalo de datas"
      ref={calendarPopoverRef}
      className={`absolute ${alignment} top-full z-50 mt-2 w-[17rem] rounded-2xl border border-slate-200 bg-white py-3 shadow-xl dark:border-zinc-700 dark:bg-[#181a20]`}
    >
      <Calendar
        mode="range"
        locale={ptBR}
        selected={selectedRange}
        onSelect={handleRangeSelect}
        onTodayClick={() => {
          const today = format(new Date(), 'yyyy-MM-dd');
          const nextStartDate = calendarTrigger === 'start' ? today : draftStartDate;
          const nextEndDate = calendarTrigger === 'end' ? today : draftEndDate;
          setDraftRange(nextStartDate, nextEndDate);
          if (nextStartDate && nextEndDate) setIsCalendarOpen(false);
        }}
        numberOfMonths={1}
      />
    </div>
  );

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
        <div className="w-full rounded-xl border border-slate-200 bg-white p-5 sm:max-w-[calc((100%-0.875rem)/2)] lg:max-w-[calc((100%-1.75rem)/3)] dark:border-zinc-800 dark:bg-[#12141a]">
          <div className="mb-3 text-xs font-semibold text-slate-700 dark:text-zinc-300">Intervalo de pesquisa</div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs font-medium text-slate-600 dark:text-zinc-400">Início:</span>
              <div className="relative min-w-0 flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="Data inicial"
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  value={draftStartInput}
                  onChange={(event) => handleManualDateChange('start', event.target.value)}
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 pr-9 text-left text-xs font-mono-tabular text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-amber-400"
                />
                <button
                  type="button"
                  aria-label="Abrir calendário da data inicial"
                  tabIndex={-1}
                  aria-haspopup="dialog"
                  aria-expanded={isCalendarOpen && calendarTrigger === 'start'}
                  onClick={() => {
                    setCalendarTrigger('start');
                    setIsCalendarOpen(true);
                  }}
                  className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                </button>
              {isCalendarOpen && calendarTrigger === 'start' && calendarPopover('left-0')}
              </div>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setDraftRange('', draftEndDate)}
                disabled={!draftStartDate}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Limpar data inicial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs font-medium text-slate-600 dark:text-zinc-400">Fim:</span>
              <div className="relative min-w-0 flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="Data final"
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  value={draftEndInput}
                  onChange={(event) => handleManualDateChange('end', event.target.value)}
                  className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 pr-9 text-left text-xs font-mono-tabular text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-amber-400"
                />
                <button
                  type="button"
                  aria-label="Abrir calendário da data final"
                  tabIndex={-1}
                  aria-haspopup="dialog"
                  aria-expanded={isCalendarOpen && calendarTrigger === 'end'}
                  onClick={() => {
                    setCalendarTrigger('end');
                    setIsCalendarOpen(true);
                  }}
                  className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                </button>
              {isCalendarOpen && calendarTrigger === 'end' && calendarPopover('left-0')}
              </div>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setDraftRange(draftStartDate, '')}
                disabled={!draftEndDate}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Limpar data final"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
