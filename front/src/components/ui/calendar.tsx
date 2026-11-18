import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
  DayPicker,
  type DayPickerProps,
  type NavProps,
  type RootProps,
  useDayPicker,
} from 'react-day-picker';

function CalendarNavigation({
  previousMonth,
  nextMonth,
  onPreviousClick,
  onNextClick,
}: NavProps) {
  const { months } = useDayPicker();
  const monthLabel = months[0]
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
        .format(months[0].date)
        .replace(/^./, (letter) => letter.toUpperCase())
    : '';

  return (
    <nav className="absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap" aria-label="Navegação do calendário">
      <button
        type="button"
        onClick={onPreviousClick}
        disabled={!previousMonth}
        aria-label="Mês anterior"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-28 text-center text-sm font-semibold text-slate-900 dark:text-white">
        {monthLabel}
      </span>
      <button
        type="button"
        onClick={onNextClick}
        disabled={!nextMonth}
        aria-label="Próximo mês"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

function CalendarRoot({ children, rootRef, ...props }: RootProps) {
  const { goToMonth, months } = useDayPicker();
  const rootElementRef = useRef<HTMLDivElement | null>(null);
  const wheelAccumulator = useRef(0);

  useEffect(() => {
    const rootElement = rootElementRef.current;
    if (!rootElement) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      wheelAccumulator.current += event.deltaY;
      if (Math.abs(wheelAccumulator.current) < 40) return;

      const currentMonth = months[0]?.date;
      if (!currentMonth) return;
      const direction = wheelAccumulator.current > 0 ? 1 : -1;
      wheelAccumulator.current = 0;
      goToMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
    };

    rootElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => rootElement.removeEventListener('wheel', handleWheel);
  }, [goToMonth, months]);

  return (
    <div
      {...props}
      ref={(node) => {
        rootElementRef.current = node;
        if (typeof rootRef === 'function') rootRef(node);
        else if (rootRef) rootRef.current = node;
      }}
    >
      {children}
    </div>
  );
}

type CalendarProps = DayPickerProps & { onTodayClick?: () => void };

export function Calendar({
  className = '',
  classNames,
  showOutsideDays = true,
  onTodayClick,
  ...props
}: CalendarProps) {
  const Navigation = (navProps: NavProps) => <CalendarNavigation {...navProps} />;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={`relative w-full overscroll-contain p-1 pt-11 ${className}`}
      components={{ Nav: Navigation, Root: CalendarRoot }}
      footer={onTodayClick ? (
        <button
          type="button"
          onClick={onTodayClick}
          className="min-h-8 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Hoje
        </button>
      ) : undefined}
      classNames={{
        root: 'text-sm select-none',
        months: 'flex flex-col items-center justify-center gap-4',
        month: 'flex flex-col items-center space-y-3',
        month_caption: 'hidden',
        caption_label: 'text-sm font-semibold text-slate-900 dark:text-white capitalize',
        month_grid: 'mx-auto w-auto border-collapse',
        weekdays: 'flex',
        weekday: 'w-9 rounded-md text-center text-[11px] font-medium text-slate-500 dark:text-zinc-400',
        week: 'mt-1 flex w-full',
        day: 'relative h-9 w-9 p-0.5 text-center',
        day_button: 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-normal text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:text-zinc-200 dark:hover:bg-amber-400/10 dark:hover:text-amber-300 dark:focus:ring-amber-400/30',
        today: 'font-bold text-emerald-700 dark:text-amber-300',
        outside: '[&>button]:text-slate-400 [&>button]:opacity-60 dark:[&>button]:text-zinc-500',
        selected: '',
        range_start: '[&>button]:rounded-xl [&>button]:bg-emerald-600 [&>button]:font-semibold [&>button]:text-white dark:[&>button]:bg-amber-400 dark:[&>button]:text-zinc-950',
        range_end: '[&>button]:rounded-xl [&>button]:bg-emerald-600 [&>button]:font-semibold [&>button]:text-white dark:[&>button]:bg-amber-400 dark:[&>button]:text-zinc-950',
        range_middle: 'text-slate-700 dark:text-zinc-200',
        footer: 'flex justify-center pt-2',
        ...classNames,
      }}
      {...props}
    />
  );
}
