import {
  calculatePercentageVariation,
  calculatePeriodBalance,
  type ResolvedPeriodRange,
} from '#/domains/transactions/calculations.ts';
import type { TransactionWithCategory } from '#/domains/transactions/queries.ts';
import {
  formatCurrencyFromCents,
  formatMonthYearBR,
  formatPercentage,
} from '#/lib/formatters/index.ts';

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amountInCents: number;
  transactionCount: number;
  sharePercent: number;
  previousAmountInCents: number;
  diffFromPreviousInCents: number;
  variationFromPreviousPercent: number | null;
  historicalMonthlyAvgInCents: number;
  diffFromAvgInCents: number;
  variationFromAvgPercent: number | null;
}

export interface AboveAverageCategoryAnalysis {
  categoryId: string;
  categoryName: string;
  color: string;
  currentAmountInCents: number;
  historicalAvgInCents: number;
  excessAmountInCents: number;
  excessPercent: number | null;
  headline: string;
  contributingItems: Array<{
    id: string;
    description: string;
    date: string;
    amountInCents: number;
    historicalItemAvgInCents: number | null;
    itemExcessInCents: number | null;
  }>;
}

export interface FinancialInsight {
  id: string;
  type: 'WARNING' | 'POSITIVE' | 'INFO';
  title: string;
  description: string;
  metricLabel?: string;
  categoryName?: string;
  categoryColor?: string;
}

export interface WeeklyDayPoint {
  dayLabel: string; // Seg, Ter, Qua...
  dateISO: string;
  currentWeekInCents: number;
  previousWeekInCents: number;
}

export interface WeeklyHistoryPoint {
  weekLabel: string;
  startDate: string;
  endDate: string;
  expenseInCents: number;
  isCurrentWeek: boolean;
}

export interface MonthlyEvolutionPoint {
  monthKey: string; // YYYY-MM
  monthLabel: string; // Out/26
  incomeInCents: number;
  expenseInCents: number;
  balanceInCents: number;
}

export interface CategoryWeeklyAnalysis {
  categoryId: string;
  categoryName: string;
  color: string;
  totalExpenseInCents: number;
  weeklyPoints: WeeklyHistoryPoint[];
}

export interface DashboardData {
  hasAnyTransactions: boolean;
  periodRange: ResolvedPeriodRange;
  cards: {
    balanceInCents: number;
    balanceStatus: 'POSITIVE' | 'NEGATIVE' | 'ZERO';
    previousBalanceInCents: number;
    balanceVariationPercent: number | null;
    balanceDiffInCents: number;

    incomeInCents: number;
    previousIncomeInCents: number;
    incomeVariationPercent: number | null;
    incomeDiffInCents: number;

    expenseInCents: number;
    previousExpenseInCents: number;
    expenseVariationPercent: number | null;
    expenseDiffInCents: number;

    averageMonthlyExpenseInCents: number;
    averageBasisMonthsCount: number;
    averageBasisLabel: string;
    expenseVsAverageDiffInCents: number;
    expenseVsAveragePercent: number | null;
  };
  weeklyChart: {
    currentWeekTotalInCents: number;
    previousWeekTotalInCents: number;
    weekVariationPercent: number | null;
    dailyPoints: WeeklyDayPoint[];
    recentWeeks: WeeklyHistoryPoint[];
  };
  monthlyChart: {
    points: MonthlyEvolutionPoint[];
    sixMonthAverageExpenseInCents: number;
  };
  categoryWeeklyAnalysis?: CategoryWeeklyAnalysis;
  categoryBreakdown: CategoryBreakdownItem[];
  topExpenses: Array<{
    id: string;
    description: string;
    categoryName: string;
    categoryColor: string;
    date: string;
    amountInCents: number;
    shareOfPeriodPercent: number;
  }>;
  aboveAverageAnalysis: AboveAverageCategoryAnalysis[];
  insights: FinancialInsight[];
  recentTransactions: TransactionWithCategory[];
}

function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function buildDashboardAnalytics(params: {
  allTransactions: TransactionWithCategory[];
  periodRange: ResolvedPeriodRange;
  monthsIntervalCount: number;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  referenceDate?: Date;
}): DashboardData {
  const {
    allTransactions,
    periodRange,
    monthsIntervalCount = 6,
    categoryId,
    categoryName: selectedCategoryName,
    categoryColor: selectedCategoryColor,
    referenceDate = new Date(),
  } = params;

  const hasAnyTransactions = allTransactions.length > 0;

  // 1. Filter current and previous period transactions
  const currentPeriodTxs = allTransactions.filter(
    (t) => t.date >= periodRange.startDate && t.date <= periodRange.endDate,
  );
  const previousPeriodTxs = allTransactions.filter(
    (t) =>
      t.date >= periodRange.prevStartDate && t.date <= periodRange.prevEndDate,
  );

  let incomeInCents = 0;
  let expenseInCents = 0;
  for (const t of currentPeriodTxs) {
    if (t.type === 'INCOME') incomeInCents += t.amountInCents;
    else expenseInCents += t.amountInCents;
  }

  let previousIncomeInCents = 0;
  let previousExpenseInCents = 0;
  for (const t of previousPeriodTxs) {
    if (t.type === 'INCOME') previousIncomeInCents += t.amountInCents;
    else previousExpenseInCents += t.amountInCents;
  }

  const { balanceInCents, status: balanceStatus } = calculatePeriodBalance(
    incomeInCents,
    expenseInCents,
  );
  const { balanceInCents: previousBalanceInCents } = calculatePeriodBalance(
    previousIncomeInCents,
    previousExpenseInCents,
  );

  const balanceVar = calculatePercentageVariation(
    balanceInCents,
    previousBalanceInCents,
  );
  const incomeVar = calculatePercentageVariation(
    incomeInCents,
    previousIncomeInCents,
  );
  const expenseVar = calculatePercentageVariation(
    expenseInCents,
    previousExpenseInCents,
  );

  // 2. Monthly Evolution & Historical Monthly Baseline (last N months before current month)
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  const monthlyPoints: MonthlyEvolutionPoint[] = [];
  for (let i = monthsIntervalCount - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    let mInc = 0;
    let mExp = 0;
    for (const t of allTransactions) {
      if (t.date.startsWith(ym)) {
        if (t.type === 'INCOME') mInc += t.amountInCents;
        else mExp += t.amountInCents;
      }
    }
    monthlyPoints.push({
      monthKey: ym,
      monthLabel: formatMonthYearBR(ym),
      incomeInCents: mInc,
      expenseInCents: mExp,
      balanceInCents: mInc - mExp,
    });
  }

  // Historical months (up to last 6 completed months that had expenses)
  const historicalMonthsKeys: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const hasExp = allTransactions.some(
      (t) => t.type === 'EXPENSE' && t.date.startsWith(ym),
    );
    if (hasExp) {
      historicalMonthsKeys.push(ym);
    }
  }

  let totalHistoricalExpenseInCents = 0;
  for (const ym of historicalMonthsKeys) {
    for (const t of allTransactions) {
      if (t.type === 'EXPENSE' && t.date.startsWith(ym)) {
        totalHistoricalExpenseInCents += t.amountInCents;
      }
    }
  }

  const averageBasisMonthsCount = historicalMonthsKeys.length;
  const averageMonthlyExpenseInCents =
    averageBasisMonthsCount > 0
      ? Math.round(totalHistoricalExpenseInCents / averageBasisMonthsCount)
      : expenseInCents;

  // Scale the monthly average to the selected period length when comparing multi-month or single-month periods
  const periodMonthMultiplier =
    periodRange.preset === 'LAST_3_MONTHS'
      ? 3
      : periodRange.preset === 'LAST_6_MONTHS'
        ? 6
        : periodRange.preset === 'THIS_WEEK'
          ? 7 / 30
          : periodRange.preset === 'TODAY'
            ? 1 / 30
            : 1;

  const scaledPeriodAverageInCents = Math.round(
    averageMonthlyExpenseInCents * periodMonthMultiplier,
  );

  const expenseVsAvgVar =
    averageBasisMonthsCount > 0
      ? calculatePercentageVariation(expenseInCents, scaledPeriodAverageInCents)
      : {
          percentage: null,
          absoluteDiffInCents: 0,
          hasBaseline: false,
        };

  const averageBasisLabel =
    averageBasisMonthsCount > 0
      ? `Média mensal dos últimos ${averageBasisMonthsCount} ${averageBasisMonthsCount === 1 ? 'mês' : 'meses'}`
      : 'Sem histórico de meses anteriores';

  // 3. Weekly Chart (Current Week Mon-Sun vs Previous Week + Last 6 Weeks evolution)
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const currentWeekMonday = addDays(today, diffToMonday);
  const prevWeekMonday = addDays(currentWeekMonday, -7);
  const weekDayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const dailyPoints: WeeklyDayPoint[] = [];
  let currentWeekTotalInCents = 0;
  let previousWeekTotalInCents = 0;

  for (let i = 0; i < 7; i++) {
    const curDayISO = toISODate(addDays(currentWeekMonday, i));
    const prevDayISO = toISODate(addDays(prevWeekMonday, i));

    const curDaySpend = allTransactions
      .filter((t) => t.type === 'EXPENSE' && t.date === curDayISO)
      .reduce((acc, t) => acc + t.amountInCents, 0);

    const prevDaySpend = allTransactions
      .filter((t) => t.type === 'EXPENSE' && t.date === prevDayISO)
      .reduce((acc, t) => acc + t.amountInCents, 0);

    currentWeekTotalInCents += curDaySpend;
    previousWeekTotalInCents += prevDaySpend;

    dailyPoints.push({
      dayLabel: weekDayNames[i],
      dateISO: curDayISO,
      currentWeekInCents: curDaySpend,
      previousWeekInCents: prevDaySpend,
    });
  }

  const weekVar = calculatePercentageVariation(
    currentWeekTotalInCents,
    previousWeekTotalInCents,
  );

  const recentWeeks: WeeklyHistoryPoint[] = [];
  for (let w = 5; w >= 0; w--) {
    const wStart = addDays(currentWeekMonday, -w * 7);
    const wEnd = addDays(wStart, 6);
    const wStartISO = toISODate(wStart);
    const wEndISO = toISODate(wEnd);
    const wSpend = allTransactions
      .filter(
        (t) =>
          t.type === 'EXPENSE' && t.date >= wStartISO && t.date <= wEndISO,
      )
      .reduce((acc, t) => acc + t.amountInCents, 0);

    const startParts = wStartISO.split('-');
    const label =
      w === 0 ? 'Atual' : `${startParts[2]}/${startParts[1]}`;

    recentWeeks.push({
      weekLabel: label,
      startDate: wStartISO,
      endDate: wEndISO,
      expenseInCents: wSpend,
      isCurrentWeek: w === 0,
    });
  }

  // 4. Category Breakdown & Historical Category Averages
  const categoryMap = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      color: string;
      icon: string;
      currentInCents: number;
      txCount: number;
      previousInCents: number;
      historicalTotalInCents: number;
    }
  >();

  const ensureCategoryEntry = (t: TransactionWithCategory) => {
    const id = t.categoryId || 'uncategorized';
    if (!categoryMap.has(id)) {
      categoryMap.set(id, {
        categoryId: id,
        categoryName: t.categoryName || 'Sem categoria',
        color: t.categoryColor || '#94a3b8',
        icon: t.categoryIcon || 'tag',
        currentInCents: 0,
        txCount: 0,
        previousInCents: 0,
        historicalTotalInCents: 0,
      });
    }
    return categoryMap.get(id)!;
  };

  for (const t of currentPeriodTxs) {
    if (t.type !== 'EXPENSE') continue;
    const entry = ensureCategoryEntry(t);
    entry.currentInCents += t.amountInCents;
    entry.txCount += 1;
  }

  for (const t of previousPeriodTxs) {
    if (t.type !== 'EXPENSE') continue;
    const entry = ensureCategoryEntry(t);
    entry.previousInCents += t.amountInCents;
  }

  for (const ym of historicalMonthsKeys) {
    for (const t of allTransactions) {
      if (t.type === 'EXPENSE' && t.date.startsWith(ym)) {
        const entry = ensureCategoryEntry(t);
        entry.historicalTotalInCents += t.amountInCents;
      }
    }
  }

  const categoryBreakdown: CategoryBreakdownItem[] = Array.from(
    categoryMap.values(),
  )
    .filter((c) => c.currentInCents > 0 || c.previousInCents > 0)
    .map((c) => {
      const sharePercent =
        expenseInCents > 0
          ? Number(((c.currentInCents / expenseInCents) * 100).toFixed(1))
          : 0;

      const prevVar = calculatePercentageVariation(
        c.currentInCents,
        c.previousInCents,
      );

      const rawMonthlyAvg =
        averageBasisMonthsCount > 0
          ? Math.round(c.historicalTotalInCents / averageBasisMonthsCount)
          : 0;
      const scaledCatAvg = Math.round(rawMonthlyAvg * periodMonthMultiplier);

      const avgVar =
        scaledCatAvg > 0
          ? calculatePercentageVariation(c.currentInCents, scaledCatAvg)
          : {
              percentage: null,
              absoluteDiffInCents: c.currentInCents,
              hasBaseline: false,
            };

      return {
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        color: c.color,
        icon: c.icon,
        amountInCents: c.currentInCents,
        transactionCount: c.txCount,
        sharePercent,
        previousAmountInCents: c.previousInCents,
        diffFromPreviousInCents: prevVar.absoluteDiffInCents,
        variationFromPreviousPercent: prevVar.percentage,
        historicalMonthlyAvgInCents: scaledCatAvg,
        diffFromAvgInCents: avgVar.absoluteDiffInCents,
        variationFromAvgPercent: avgVar.percentage,
      };
    })
    .sort((a, b) => b.amountInCents - a.amountInCents);

  // 5. Top Expenses in the Period
  const currentExpenseTxs = currentPeriodTxs
    .filter((t) => t.type === 'EXPENSE')
    .sort((a, b) => b.amountInCents - a.amountInCents);

  const topExpenses = currentExpenseTxs.slice(0, 6).map((t) => ({
    id: t.id,
    description: t.description,
    categoryName: t.categoryName || 'Outros',
    categoryColor: t.categoryColor || '#94a3b8',
    date: t.date,
    amountInCents: t.amountInCents,
    shareOfPeriodPercent:
      expenseInCents > 0
        ? Number(((t.amountInCents / expenseInCents) * 100).toFixed(1))
        : 0,
  }));

  // 6. Historical Item Average Map (by normalized description) for item-level detection
  const historicalDescTotals = new Map<
    string,
    { totalCents: number; count: number }
  >();
  for (const ym of historicalMonthsKeys) {
    for (const t of allTransactions) {
      if (t.type === 'EXPENSE' && t.date.startsWith(ym)) {
        const key = t.description.trim().toLowerCase();
        const prev = historicalDescTotals.get(key) || {
          totalCents: 0,
          count: 0,
        };
        prev.totalCents += t.amountInCents;
        prev.count += 1;
        historicalDescTotals.set(key, prev);
      }
    }
  }

  // 7. Above-Average Category & Item Analysis (Regra 5.6)
  const aboveAverageAnalysis: AboveAverageCategoryAnalysis[] = categoryBreakdown
    .filter(
      (cat) =>
        cat.historicalMonthlyAvgInCents > 0 &&
        cat.diffFromAvgInCents > 1000, // At least R$ 10,00 above historical average
    )
    .sort((a, b) => b.diffFromAvgInCents - a.diffFromAvgInCents)
    .map((cat) => {
      const catTxs = currentExpenseTxs
        .filter(
          (t) => (t.categoryId || 'uncategorized') === cat.categoryId,
        )
        .sort((a, b) => b.amountInCents - a.amountInCents)
        .slice(0, 4)
        .map((t) => {
          const normKey = t.description.trim().toLowerCase();
          const histItem = historicalDescTotals.get(normKey);
          const historicalItemAvgInCents =
            histItem && histItem.count > 0
              ? Math.round(histItem.totalCents / histItem.count)
              : null;
          const itemExcessInCents =
            historicalItemAvgInCents !== null
              ? t.amountInCents - historicalItemAvgInCents
              : null;

          return {
            id: t.id,
            description: t.description,
            date: t.date,
            amountInCents: t.amountInCents,
            historicalItemAvgInCents,
            itemExcessInCents,
          };
        });

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        color: cat.color,
        currentAmountInCents: cat.amountInCents,
        historicalAvgInCents: cat.historicalMonthlyAvgInCents,
        excessAmountInCents: cat.diffFromAvgInCents,
        excessPercent: cat.variationFromAvgPercent,
        headline: `${cat.categoryName} ficou ${formatCurrencyFromCents(cat.diffFromAvgInCents)} acima da sua média.`,
        contributingItems: catTxs,
      };
    });

  // 8. Data-Driven Automatic Financial Insights (Regra 6.6)
  const insights: FinancialInsight[] = [];

  // Insight 1: Top category above average
  if (aboveAverageAnalysis.length > 0) {
    const topAbove = aboveAverageAnalysis[0];
    const pctText =
      topAbove.excessPercent !== null
        ? ` (${formatPercentage(topAbove.excessPercent, { showSign: true })})`
        : '';
    const mainDriver = topAbove.contributingItems[0];
    const driverText = mainDriver
      ? ` O maior impacto veio de "${mainDriver.description}" (${formatCurrencyFromCents(mainDriver.amountInCents)}).`
      : '';

    insights.push({
      id: `insight-above-avg-${topAbove.categoryId}`,
      type: 'WARNING',
      title: `${topAbove.categoryName} está ${formatCurrencyFromCents(topAbove.excessAmountInCents)} acima da sua média`,
      description: `Você gastou ${formatCurrencyFromCents(topAbove.currentAmountInCents)} neste período contra uma média histórica de ${formatCurrencyFromCents(topAbove.historicalAvgInCents)}${pctText}.${driverText}`,
      metricLabel: `+${formatCurrencyFromCents(topAbove.excessAmountInCents)} vs média`,
      categoryName: topAbove.categoryName,
      categoryColor: topAbove.color,
    });
  }

  // Insight 2: Second category above average or period-over-period category spike
  if (aboveAverageAnalysis.length > 1) {
    const secondAbove = aboveAverageAnalysis[1];
    insights.push({
      id: `insight-above-avg-${secondAbove.categoryId}`,
      type: 'WARNING',
      title: `Você gastou ${formatPercentage(secondAbove.excessPercent)} a mais em ${secondAbove.categoryName}`,
      description: `O gasto com ${secondAbove.categoryName} aumentou ${formatCurrencyFromCents(secondAbove.excessAmountInCents)} em relação à sua média histórica (${formatCurrencyFromCents(secondAbove.historicalAvgInCents)}).`,
      metricLabel: formatPercentage(secondAbove.excessPercent, {
        showSign: true,
      }),
      categoryName: secondAbove.categoryName,
      categoryColor: secondAbove.color,
    });
  }

  // Insight 3: Recurring item that increased compared to previous months
  for (const t of currentExpenseTxs) {
    const normKey = t.description.trim().toLowerCase();
    const hist = historicalDescTotals.get(normKey);
    if (hist && hist.count >= 2) {
      const avgItem = Math.round(hist.totalCents / hist.count);
      const diff = t.amountInCents - avgItem;
      if (diff >= 1000) {
        insights.push({
          id: `insight-item-increase-${t.id}`,
          type: 'INFO',
          title: `Sua despesa com "${t.description}" foi maior que nos meses anteriores`,
          description: `Registrada em ${formatCurrencyFromCents(t.amountInCents)}, ficou ${formatCurrencyFromCents(diff)} acima da média histórica desse mesmo item (${formatCurrencyFromCents(avgItem)}).`,
          metricLabel: `+${formatCurrencyFromCents(diff)}`,
          categoryName: t.categoryName || 'Despesa',
          categoryColor: t.categoryColor || '#eab308',
        });
        break;
      }
    }
  }

  // Insight 4: Biggest expense of the period
  if (topExpenses.length > 0) {
    const biggest = topExpenses[0];
    insights.push({
      id: `insight-biggest-${biggest.id}`,
      type: 'INFO',
      title: `"${biggest.description}" foi o maior gasto do período`,
      description: `Representou ${formatPercentage(biggest.shareOfPeriodPercent)} de todas as suas despesas no período (${formatCurrencyFromCents(biggest.amountInCents)} na categoria ${biggest.categoryName}).`,
      metricLabel: formatCurrencyFromCents(biggest.amountInCents),
      categoryName: biggest.categoryName,
      categoryColor: biggest.categoryColor,
    });
  }

  // Insight 5: Category with positive reduction or positive savings rate
  const reducedCat = categoryBreakdown.find(
    (c) =>
      c.previousAmountInCents > 0 &&
      c.diffFromPreviousInCents < -2000 &&
      c.variationFromPreviousPercent !== null,
  );
  if (reducedCat) {
    insights.push({
      id: `insight-reduction-${reducedCat.categoryId}`,
      type: 'POSITIVE',
      title: `Economia de ${formatCurrencyFromCents(Math.abs(reducedCat.diffFromPreviousInCents))} em ${reducedCat.categoryName}`,
      description: `Seus gastos em ${reducedCat.categoryName} caíram ${formatPercentage(Math.abs(reducedCat.variationFromPreviousPercent || 0))} ${periodRange.comparisonLabel}.`,
      metricLabel: formatPercentage(reducedCat.variationFromPreviousPercent, {
        showSign: true,
      }),
      categoryName: reducedCat.categoryName,
      categoryColor: reducedCat.color,
    });
  } else if (incomeInCents > 0 && balanceInCents > 0) {
    const savingsRate = ((balanceInCents / incomeInCents) * 100).toFixed(1);
    insights.push({
      id: 'insight-positive-balance',
      type: 'POSITIVE',
      title: `Saldo positivo de ${formatCurrencyFromCents(balanceInCents)} no período`,
      description: `Você preservou ${savingsRate.replace('.', ',')}% das receitas recebidas no período selecionado.`,
      metricLabel: `+${savingsRate.replace('.', ',')}% poupado`,
    });
  }

  const sixMonthAverageExpenseInCents =
    monthlyPoints.length > 0
      ? Math.round(
          monthlyPoints.reduce((acc, m) => acc + m.expenseInCents, 0) /
            monthlyPoints.length,
        )
      : 0;

  let categoryWeeklyAnalysis: CategoryWeeklyAnalysis | undefined;
  if (categoryId) {
    const categoryTransactions = allTransactions.filter(
      (transaction) =>
        transaction.type === 'EXPENSE' &&
        (transaction.categoryId || 'uncategorized') === categoryId,
    );
    const categorySample = categoryTransactions[0];
    const [endYear, endMonth, endDay] = periodRange.endDate
      .split('-')
      .map(Number);
    const rangeEnd = new Date(endYear, endMonth - 1, endDay);
    const chartEnd = rangeEnd > today ? today : rangeEnd;
    const chartEndDay = chartEnd.getDay();
    const latestMonday = addDays(chartEnd, chartEndDay === 0 ? -6 : 1 - chartEndDay);
    const weeklyPoints: WeeklyHistoryPoint[] = [];

    for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
      const start = addDays(latestMonday, -weekOffset * 7);
      const end = addDays(start, 6);
      const startDate = toISODate(start);
      const endDate = toISODate(end);
      const expenseInCents = categoryTransactions
        .filter(
          (transaction) =>
            transaction.date >= periodRange.startDate &&
            transaction.date <= periodRange.endDate &&
            transaction.date >= startDate &&
            transaction.date <= endDate,
        )
        .reduce((sum, transaction) => sum + transaction.amountInCents, 0);

      weeklyPoints.push({
        weekLabel: `Semana a/p ${start.getDate()}`,
        startDate,
        endDate,
        expenseInCents,
        isCurrentWeek: weekOffset === 0,
      });
    }

    categoryWeeklyAnalysis = {
      categoryId,
      categoryName: categorySample?.categoryName || selectedCategoryName || 'Categoria selecionada',
      color: categorySample?.categoryColor || selectedCategoryColor || '#16a34a',
      totalExpenseInCents: categoryTransactions
        .filter(
          (transaction) =>
            transaction.date >= periodRange.startDate && transaction.date <= periodRange.endDate,
        )
        .reduce((sum, transaction) => sum + transaction.amountInCents, 0),
      weeklyPoints,
    };
  }

  return {
    hasAnyTransactions,
    periodRange,
    cards: {
      balanceInCents,
      balanceStatus,
      previousBalanceInCents,
      balanceVariationPercent: balanceVar.percentage,
      balanceDiffInCents: balanceVar.absoluteDiffInCents,

      incomeInCents,
      previousIncomeInCents,
      incomeVariationPercent: incomeVar.percentage,
      incomeDiffInCents: incomeVar.absoluteDiffInCents,

      expenseInCents,
      previousExpenseInCents,
      expenseVariationPercent: expenseVar.percentage,
      expenseDiffInCents: expenseVar.absoluteDiffInCents,

      averageMonthlyExpenseInCents: scaledPeriodAverageInCents,
      averageBasisMonthsCount,
      averageBasisLabel,
      expenseVsAverageDiffInCents: expenseVsAvgVar.absoluteDiffInCents,
      expenseVsAveragePercent: expenseVsAvgVar.percentage,
    },
    weeklyChart: {
      currentWeekTotalInCents,
      previousWeekTotalInCents,
      weekVariationPercent: weekVar.percentage,
      dailyPoints,
      recentWeeks,
    },
    monthlyChart: {
      points: monthlyPoints,
      sixMonthAverageExpenseInCents,
    },
    categoryWeeklyAnalysis,
    categoryBreakdown,
    topExpenses,
    aboveAverageAnalysis,
    insights,
    recentTransactions: currentPeriodTxs.slice(0, 8),
  };
}
