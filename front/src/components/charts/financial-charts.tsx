import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CategoryIcon } from '#/components/ui/category-icon.tsx';
import { useAppUI } from '#/components/ui/theme-provider.tsx';
import type { DashboardData } from '#/domains/dashboard/calculations.ts';
import {
  formatCompactCurrencyFromCents,
  formatCurrencyFromCents,
  formatPercentage,
} from '#/lib/formatters/index.ts';

export function WeeklySpendingChart({
  weeklyChart,
}: {
  weeklyChart: DashboardData['weeklyChart'];
}) {
  const { resolvedTheme } = useAppUI();
  const [viewMode, setViewMode] = useState<'daily' | 'weeks'>('daily');

  const isDark = resolvedTheme === 'dark';
  const primaryBarColor = isDark ? '#facc15' : '#16a34a';
  const secondaryBarColor = isDark ? '#3f3f46' : '#cbd5e1';
  const gridColor = isDark ? '#27272a' : '#f1f5f9';
  const axisTextColor = isDark ? '#a1a1aa' : '#64748b';

  const isWeekHigher =
    weeklyChart.currentWeekTotalInCents > weeklyChart.previousWeekTotalInCents;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Gastos semanais
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-mono-tabular font-semibold text-slate-900 dark:text-zinc-100">
              {formatCurrencyFromCents(weeklyChart.currentWeekTotalInCents)}
            </span>
            <span aria-hidden="true">·</span>
            {weeklyChart.weekVariationPercent !== null ? (
              <span
                className={`font-mono-tabular font-medium ${
                  isWeekHigher
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isWeekHigher ? '↑' : '↓'}{' '}
                {formatPercentage(weeklyChart.weekVariationPercent)} vs semana
                anterior
              </span>
            ) : (
              <span>
                Semana ant:{' '}
                {formatCurrencyFromCents(weeklyChart.previousWeekTotalInCents)}
              </span>
            )}
          </div>
        </div>

        {/* Interactive Segmented Toggle */}
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 self-start">
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            Dias da semana
          </button>
          <button
            type="button"
            onClick={() => setViewMode('weeks')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              viewMode === 'weeks'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            Últimas 6 semanas
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        {viewMode === 'daily' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyChart.dailyPoints}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridColor}
              />
              <XAxis
                dataKey="dayLabel"
                tick={{ fill: axisTextColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val: number) =>
                  formatCompactCurrencyFromCents(val)
                }
                tick={{ fill: axisTextColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{
                  fill: isDark
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(15,23,42,0.04)',
                }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const cur = Number(payload[0]?.value || 0);
                  const prev = Number(payload[1]?.value || 0);
                  return (
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg text-xs space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {label}
                      </p>
                      <p className="font-mono-tabular text-emerald-600 dark:text-amber-400">
                        Esta semana: {formatCurrencyFromCents(cur)}
                      </p>
                      <p className="font-mono-tabular text-slate-500 dark:text-zinc-400">
                        Semana anterior: {formatCurrencyFromCents(prev)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="currentWeekInCents"
                name="Esta semana"
                fill={primaryBarColor}
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="previousWeekInCents"
                name="Semana anterior"
                fill={secondaryBarColor}
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyChart.recentWeeks}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridColor}
              />
              <XAxis
                dataKey="weekLabel"
                tick={{ fill: axisTextColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val: number) =>
                  formatCompactCurrencyFromCents(val)
                }
                tick={{ fill: axisTextColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{
                  fill: isDark
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(15,23,42,0.04)',
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const item = payload[0]?.payload as
                    | DashboardData['weeklyChart']['recentWeeks'][number]
                    | undefined;
                  if (!item) return null;
                  return (
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg text-xs space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Semana ({item.weekLabel})
                      </p>
                      <p className="font-mono-tabular text-slate-700 dark:text-zinc-200">
                        Total gasto:{' '}
                        <span className="font-bold">
                          {formatCurrencyFromCents(item.expenseInCents)}
                        </span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="expenseInCents"
                name="Gasto semanal"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              >
                {weeklyChart.recentWeeks.map((entry) => (
                  <Cell
                    key={entry.startDate}
                    fill={
                      entry.isCurrentWeek ? primaryBarColor : secondaryBarColor
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function MonthlyEvolutionChart({
  monthlyChart,
  monthsInterval,
  onMonthsIntervalChange,
}: {
  monthlyChart: DashboardData['monthlyChart'];
  monthsInterval: number;
  onMonthsIntervalChange: (months: number) => void;
}) {
  const { resolvedTheme } = useAppUI();
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#27272a' : '#f1f5f9';
  const axisTextColor = isDark ? '#a1a1aa' : '#64748b';

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Evolução mensal
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-zinc-400">
            <span>Receitas vs Despesas</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              Média:{' '}
              {formatCurrencyFromCents(
                monthlyChart.sixMonthAverageExpenseInCents,
              )}
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 self-start">
          {[6, 12].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMonthsIntervalChange(m)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                monthsInterval === m
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              {m} meses
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyChart.points}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={gridColor}
            />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: axisTextColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(val: number) =>
                formatCompactCurrencyFromCents(val)
              }
              tick={{ fill: axisTextColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{
                fill: isDark
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(15,23,42,0.04)',
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const item = payload[0]?.payload as
                  | DashboardData['monthlyChart']['points'][number]
                  | undefined;
                if (!item) return null;
                return (
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg text-xs space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {label}
                    </p>
                    <p className="font-mono-tabular text-emerald-600 dark:text-emerald-400">
                      Receitas: {formatCurrencyFromCents(item.incomeInCents)}
                    </p>
                    <p className="font-mono-tabular text-red-600 dark:text-red-400">
                      Despesas: {formatCurrencyFromCents(item.expenseInCents)}
                    </p>
                    <p className="font-mono-tabular pt-1 border-t border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold">
                      Saldo: {formatCurrencyFromCents(item.balanceInCents)}
                    </p>
                  </div>
                );
              }}
            />
            {monthlyChart.sixMonthAverageExpenseInCents > 0 && (
              <ReferenceLine
                y={monthlyChart.sixMonthAverageExpenseInCents}
                stroke={isDark ? '#facc15' : '#0f172a'}
                strokeDasharray="4 4"
              />
            )}
            <Bar
              dataKey="incomeInCents"
              name="Receitas"
              fill="#22c55e"
              radius={[6, 6, 0, 0]}
              maxBarSize={26}
            />
            <Bar
              dataKey="expenseInCents"
              name="Despesas"
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
              maxBarSize={26}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategoryBreakdownSection({
  categories,
  totalExpenseInCents,
  comparisonLabel,
}: {
  categories: DashboardData['categoryBreakdown'];
  totalExpenseInCents: number;
  comparisonLabel: string;
}) {
  const activeCategories = categories.filter((c) => c.amountInCents > 0);

  if (activeCategories.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Gastos por categoria
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 py-8 text-center">
          Nenhuma despesa registrada no período selecionado.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Gastos por categoria
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Distribuição sobre{' '}
            <span className="font-mono-tabular font-medium text-slate-700 dark:text-zinc-200">
              {formatCurrencyFromCents(totalExpenseInCents)}
            </span>{' '}
            em despesas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Donut Chart */}
        <div className="lg:col-span-4 h-52 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activeCategories}
                dataKey="amountInCents"
                nameKey="categoryName"
                innerRadius={56}
                outerRadius={82}
                paddingAngle={2}
                stroke="none"
              >
                {activeCategories.map((entry) => (
                  <Cell key={entry.categoryId} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const item = payload[0]?.payload as
                    | DashboardData['categoryBreakdown'][number]
                    | undefined;
                  if (!item) return null;
                  return (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.categoryName}
                      </p>
                      <p className="font-mono-tabular text-slate-700 dark:text-zinc-300 mt-0.5">
                        {formatCurrencyFromCents(item.amountInCents)} (
                        {formatPercentage(item.sharePercent)})
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
              Principal
            </span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white max-w-[95px] truncate">
              {activeCategories[0]?.categoryName}
            </span>
            <span className="text-xs font-mono-tabular font-bold text-emerald-600 dark:text-amber-400">
              {formatPercentage(activeCategories[0]?.sharePercent)}
            </span>
          </div>
        </div>

        {/* Category Ranking List */}
        <div className="lg:col-span-8 space-y-3.5">
          {activeCategories.map((cat) => {
            const isHigherThanPrev = cat.diffFromPreviousInCents > 0;
            const isLowerThanPrev = cat.diffFromPreviousInCents < 0;

            return (
              <div key={cat.categoryId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                      {cat.categoryName}
                    </span>
                    <span className="text-slate-400 dark:text-zinc-500" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono-tabular text-slate-500 dark:text-zinc-400 shrink-0">
                      {formatPercentage(cat.sharePercent)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 font-mono-tabular">
                    {cat.variationFromPreviousPercent !== null && (
                      <span
                        className={`text-[11px] ${
                          isHigherThanPrev
                            ? 'text-red-600 dark:text-red-400'
                            : isLowerThanPrev
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                        }`}
                        title={`Comparação ${comparisonLabel}: ${formatCurrencyFromCents(cat.previousAmountInCents)}`}
                      >
                        {isHigherThanPrev ? '↑' : isLowerThanPrev ? '↓' : '='}{' '}
                        {formatPercentage(cat.variationFromPreviousPercent)}
                      </span>
                    )}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrencyFromCents(cat.amountInCents)}
                    </span>
                  </div>
                </div>

                {/* Horizontal Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800/90 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(4, Math.min(100, cat.sharePercent))}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
