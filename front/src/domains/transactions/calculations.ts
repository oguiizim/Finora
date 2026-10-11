import type { PeriodPreset } from './schemas.ts';

export type BalanceStatus = 'POSITIVE' | 'NEGATIVE' | 'ZERO';

export interface ResolvedPeriodRange {
  preset: PeriodPreset;
  label: string;
  comparisonLabel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  prevStartDate: string; // YYYY-MM-DD
  prevEndDate: string; // YYYY-MM-DD
  daysCount: number;
}

function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function resolvePeriodRange(
  preset: PeriodPreset = 'THIS_MONTH',
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date(),
): ResolvedPeriodRange {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  if (preset === 'TODAY') {
    const yesterday = addDays(today, -1);
    return {
      preset,
      label: 'Hoje',
      comparisonLabel: 'vs ontem',
      startDate: toISODate(today),
      endDate: toISODate(today),
      prevStartDate: toISODate(yesterday),
      prevEndDate: toISODate(yesterday),
      daysCount: 1,
    };
  }

  if (preset === 'THIS_WEEK') {
    // Monday-based week (padrão de semana útil/financeira) ou Domingo
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = addDays(today, diffToMonday);
    const weekEnd = addDays(weekStart, 6);
    const prevWeekStart = addDays(weekStart, -7);
    const prevWeekEnd = addDays(weekStart, -1);
    return {
      preset,
      label: 'Esta semana',
      comparisonLabel: 'vs semana anterior',
      startDate: toISODate(weekStart),
      endDate: toISODate(weekEnd),
      prevStartDate: toISODate(prevWeekStart),
      prevEndDate: toISODate(prevWeekEnd),
      daysCount: 7,
    };
  }

  if (preset === 'LAST_MONTH') {
    const firstDayLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const firstDayTwoMonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 2,
      1,
    );
    const lastDayTwoMonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      0,
    );
    const daysCount = lastDayLastMonth.getDate();

    return {
      preset,
      label: 'Mês anterior',
      comparisonLabel: 'vs 2 meses atrás',
      startDate: toISODate(firstDayLastMonth),
      endDate: toISODate(lastDayLastMonth),
      prevStartDate: toISODate(firstDayTwoMonthsAgo),
      prevEndDate: toISODate(lastDayTwoMonthsAgo),
      daysCount,
    };
  }

  if (preset === 'LAST_3_MONTHS') {
    const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const prevStart = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const prevEnd = new Date(today.getFullYear(), today.getMonth() - 2, 0);
    const daysCount = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86400000) + 1,
    );
    return {
      preset,
      label: 'Últimos 3 meses',
      comparisonLabel: 'vs trimestre anterior',
      startDate: toISODate(start),
      endDate: toISODate(end),
      prevStartDate: toISODate(prevStart),
      prevEndDate: toISODate(prevEnd),
      daysCount,
    };
  }

  if (preset === 'LAST_6_MONTHS') {
    const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const prevStart = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const prevEnd = new Date(today.getFullYear(), today.getMonth() - 5, 0);
    const daysCount = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86400000) + 1,
    );
    return {
      preset,
      label: 'Últimos 6 meses',
      comparisonLabel: 'vs semestre anterior',
      startDate: toISODate(start),
      endDate: toISODate(end),
      prevStartDate: toISODate(prevStart),
      prevEndDate: toISODate(prevEnd),
      daysCount,
    };
  }

  if (preset === 'CUSTOM' && customStart && customEnd) {
    const start = parseISODate(customStart);
    const end = parseISODate(customEnd);
    const orderedStart = start <= end ? start : end;
    const orderedEnd = start <= end ? end : start;
    const daysCount = Math.max(
      1,
      Math.round((orderedEnd.getTime() - orderedStart.getTime()) / 86400000) + 1,
    );
    const prevEnd = addDays(orderedStart, -1);
    const prevStart = addDays(prevEnd, -(daysCount - 1));
    return {
      preset: 'CUSTOM',
      label: 'Período personalizado',
      comparisonLabel: 'vs período anterior equivalente',
      startDate: toISODate(orderedStart),
      endDate: toISODate(orderedEnd),
      prevStartDate: toISODate(prevStart),
      prevEndDate: toISODate(prevEnd),
      daysCount,
    };
  }

  // Default: THIS_MONTH
  const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayThisMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  );
  const firstDayLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1,
  );
  const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  return {
    preset: 'THIS_MONTH',
    label: 'Este mês',
    comparisonLabel: 'vs mês anterior',
    startDate: toISODate(firstDayThisMonth),
    endDate: toISODate(lastDayThisMonth),
    prevStartDate: toISODate(firstDayLastMonth),
    prevEndDate: toISODate(lastDayLastMonth),
    daysCount: lastDayThisMonth.getDate(),
  };
}

/**
 * Regra 5.1: saldo = receitas - despesas
 */
export function calculatePeriodBalance(
  incomeInCents: number,
  expenseInCents: number,
): {
  balanceInCents: number;
  status: BalanceStatus;
} {
  const balanceInCents = incomeInCents - expenseInCents;
  const status: BalanceStatus =
    balanceInCents > 0 ? 'POSITIVE' : balanceInCents < 0 ? 'NEGATIVE' : 'ZERO';
  return { balanceInCents, status };
}

/**
 * Regra 5.4: ((atual - anterior) / anterior) * 100
 * Trata corretamente o caso em que o período anterior seja zero.
 */
export function calculatePercentageVariation(
  currentInCents: number,
  previousInCents: number,
): {
  percentage: number | null;
  absoluteDiffInCents: number;
  hasBaseline: boolean;
} {
  const absoluteDiffInCents = currentInCents - previousInCents;

  if (previousInCents === 0) {
    if (currentInCents === 0) {
      return {
        percentage: 0,
        absoluteDiffInCents: 0,
        hasBaseline: true,
      };
    }
    return {
      percentage: null,
      absoluteDiffInCents,
      hasBaseline: false,
    };
  }

  const percentage =
    ((currentInCents - previousInCents) / Math.abs(previousInCents)) * 100;

  return {
    percentage: Number(percentage.toFixed(2)),
    absoluteDiffInCents,
    hasBaseline: true,
  };
}
