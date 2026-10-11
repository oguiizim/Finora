import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { DashboardData } from '#/domains/dashboard/calculations.ts';
import {
  formatCurrencyFromCents,
  formatDateBR,
  formatPercentage,
} from '#/lib/formatters/index.ts';

interface KpiCardsProps {
  data: DashboardData;
}

export function KpiCards({ data }: KpiCardsProps) {
  const { cards, periodRange } = data;

  const isExpenseHigher = cards.expenseDiffInCents > 0;
  const isExpenseLower = cards.expenseDiffInCents < 0;

  const isAboveAverage = cards.expenseVsAverageDiffInCents > 0;
  const isBelowAverage = cards.expenseVsAverageDiffInCents < 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Saldo do Período */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-medium">Saldo do período</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium">
              {cards.balanceStatus === 'POSITIVE'
                ? 'Positivo'
                : cards.balanceStatus === 'NEGATIVE'
                  ? 'Negativo'
                  : 'Zerado'}
            </span>
          </div>

          <p
            className={`mt-2 text-2xl sm:text-[26px] font-bold font-mono-tabular tracking-tight ${
              cards.balanceStatus === 'POSITIVE'
                ? 'text-emerald-600 dark:text-emerald-400'
                : cards.balanceStatus === 'NEGATIVE'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatCurrencyFromCents(cards.balanceInCents)}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          {cards.balanceVariationPercent !== null ? (
            <span
              className={`inline-flex items-center gap-1 font-mono-tabular font-medium ${
                cards.balanceDiffInCents >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {cards.balanceDiffInCents >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {formatPercentage(cards.balanceVariationPercent, {
                showSign: true,
              })}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-zinc-500">
              Sem base anterior
            </span>
          )}
          <span className="text-slate-500 dark:text-zinc-400 truncate ml-2">
            {periodRange.comparisonLabel}
          </span>
        </div>
      </div>

      {/* 2. Total de Receitas */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-medium">Total de receitas</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <p className="mt-2 text-2xl sm:text-[26px] font-bold font-mono-tabular tracking-tight text-slate-900 dark:text-white">
            {formatCurrencyFromCents(cards.incomeInCents)}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          {cards.incomeVariationPercent !== null ? (
            <span
              className={`inline-flex items-center gap-1 font-mono-tabular font-medium ${
                cards.incomeDiffInCents >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {cards.incomeDiffInCents >= 0 ? '↑' : '↓'}{' '}
              {formatPercentage(cards.incomeVariationPercent)}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-zinc-500">
              Sem base anterior
            </span>
          )}
          <span className="text-slate-500 dark:text-zinc-400 truncate ml-2">
            Ant: {formatCurrencyFromCents(cards.previousIncomeInCents)}
          </span>
        </div>
      </div>

      {/* 3. Total de Despesas (Gastar mais = Negativo/Vermelho; Gastar menos = Positivo/Verde) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-medium">Total de despesas</span>
            <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          </div>
          <p className="mt-2 text-2xl sm:text-[26px] font-bold font-mono-tabular tracking-tight text-slate-900 dark:text-white">
            {formatCurrencyFromCents(cards.expenseInCents)}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          {cards.expenseVariationPercent !== null ? (
            <span
              className={`inline-flex items-center gap-1 font-mono-tabular font-medium ${
                isExpenseHigher
                  ? 'text-red-600 dark:text-red-400'
                  : isExpenseLower
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              {isExpenseHigher ? '↑' : isExpenseLower ? '↓' : '='}{' '}
              {formatPercentage(cards.expenseVariationPercent)}{' '}
              {periodRange.comparisonLabel}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-zinc-500">
              Sem base anterior
            </span>
          )}
        </div>
      </div>

      {/* 4. Variação dos Gastos */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-medium">Variação dos gastos</span>
            {isExpenseHigher ? (
              <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            ) : isExpenseLower ? (
              <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </div>

          <p
            className={`mt-2 text-2xl sm:text-[26px] font-bold font-mono-tabular tracking-tight ${
              isExpenseHigher
                ? 'text-red-600 dark:text-red-400'
                : isExpenseLower
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-900 dark:text-white'
            }`}
          >
            {cards.expenseVariationPercent !== null
              ? formatPercentage(cards.expenseVariationPercent, {
                  showSign: true,
                })
              : 'Sem base'}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono-tabular text-slate-500 dark:text-zinc-400">
          <span>
            {cards.expenseDiffInCents > 0 ? '+' : ''}
            {formatCurrencyFromCents(cards.expenseDiffInCents)}
          </span>
          <span className="truncate ml-2">
            Ant: {formatCurrencyFromCents(cards.previousExpenseInCents)}
          </span>
        </div>
      </div>

      {/* 5. Média de Gastos */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-medium">Média de gastos</span>
            <Scale className="w-4 h-4 text-emerald-600 dark:text-amber-400 shrink-0" />
          </div>

          <p className="mt-2 text-2xl sm:text-[26px] font-bold font-mono-tabular tracking-tight text-slate-900 dark:text-white">
            {formatCurrencyFromCents(cards.averageMonthlyExpenseInCents)}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          {cards.expenseVsAveragePercent !== null ? (
            <span
              className={`font-mono-tabular font-medium ${
                isAboveAverage
                  ? 'text-red-600 dark:text-red-400'
                  : isBelowAverage
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              {isAboveAverage ? '↑' : isBelowAverage ? '↓' : '='}{' '}
              {formatPercentage(cards.expenseVsAveragePercent)} vs média
            </span>
          ) : (
            <span className="text-slate-400 dark:text-zinc-500">
              {cards.averageBasisLabel}
            </span>
          )}
          <span
            className="text-slate-400 dark:text-zinc-500 truncate ml-2"
            title={`${cards.averageBasisLabel} (${formatDateBR(periodRange.startDate)} a ${formatDateBR(periodRange.endDate)})`}
          >
            {cards.averageBasisMonthsCount > 0
              ? `${cards.averageBasisMonthsCount}m base`
              : 'Atual'}
          </span>
        </div>
      </div>
    </div>
  );
}
