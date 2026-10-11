import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import type { DashboardData } from '#/domains/dashboard/calculations.ts';
import {
  formatCurrencyFromCents,
  formatPercentage,
  formatShortDateBR,
} from '#/lib/formatters/index.ts';

export function InsightsAndAboveAverageSection({
  insights,
  aboveAverageAnalysis,
  averageBasisLabel,
}: {
  insights: DashboardData['insights'];
  aboveAverageAnalysis: DashboardData['aboveAverageAnalysis'];
  averageBasisLabel: string;
}) {
  const [expandedCatId, setExpandedCatId] = useState<string | null>(
    aboveAverageAnalysis[0]?.categoryId || null,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Insights Automáticos */}
      <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Insights financeiros
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Análise automática calculada a partir dos seus lançamentos
              </p>
            </div>
          </div>

          {insights.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-zinc-400 py-6 text-center">
              Registre mais lançamentos para gerar comparativos automáticos.
            </p>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => {
                const isWarning = insight.type === 'WARNING';
                const isPositive = insight.type === 'POSITIVE';

                return (
                  <div
                    key={insight.id}
                    className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/90"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 shrink-0 ${
                          isWarning
                            ? 'text-red-600 dark:text-amber-400'
                            : isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-sky-600 dark:text-sky-400'
                        }`}
                      >
                        {isWarning ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : isPositive ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Info className="w-4 h-4" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                            {insight.title}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                          {insight.description}
                        </p>
                        {insight.metricLabel && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] font-mono-tabular text-slate-500 dark:text-zinc-400">
                            {insight.categoryName && (
                              <>
                                <span>{insight.categoryName}</span>
                                <span aria-hidden="true">·</span>
                              </>
                            )}
                            <span
                              className={`font-semibold ${
                                isWarning
                                  ? 'text-red-600 dark:text-red-400'
                                  : isPositive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-700 dark:text-zinc-300'
                              }`}
                            >
                              {insight.metricLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Análise de Gastos Acima da Média (Categorias e Itens responsáveis) */}
      <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Gastos acima da média histórica
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Categorias e itens que puxaram os gastos para cima ({averageBasisLabel})
            </p>
          </div>
        </div>

        {aboveAverageAnalysis.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/70">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Nenhuma categoria acima da sua média histórica neste período!
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Seus gastos por categoria estão dentro ou abaixo do padrão dos meses anteriores.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {aboveAverageAnalysis.map((item) => {
              const isExpanded = expandedCatId === item.categoryId;
              return (
                <div
                  key={item.categoryId}
                  className="rounded-xl border border-slate-200/90 dark:border-zinc-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCatId(isExpanded ? null : item.categoryId)
                    }
                    className="w-full p-3.5 bg-slate-50/70 dark:bg-zinc-900/60 hover:bg-slate-100/80 dark:hover:bg-zinc-900 flex items-center justify-between gap-3 text-left transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-red-600 dark:text-amber-400 shrink-0" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {item.headline}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono-tabular text-slate-500 dark:text-zinc-400">
                        <span>
                          Média:{' '}
                          <strong className="text-slate-700 dark:text-zinc-300">
                            {formatCurrencyFromCents(item.historicalAvgInCents)}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Atual:{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {formatCurrencyFromCents(item.currentAmountInCents)}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          +{formatCurrencyFromCents(item.excessAmountInCents)} (
                          {formatPercentage(item.excessPercent, {
                            showSign: true,
                          })}
                          )
                        </span>
                      </div>
                    </div>

                    <span className="text-slate-400 dark:text-zinc-500 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>

                  {isExpanded && item.contributingItems.length > 0 && (
                    <div className="px-3.5 py-3 bg-white dark:bg-[#12141a] border-t border-slate-200/70 dark:border-zinc-800/80">
                      <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-2">
                        Itens e lançamentos responsáveis pelo aumento em{' '}
                        {item.categoryName}:
                      </p>
                      <div className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                        {item.contributingItems.map((tx) => (
                          <div
                            key={tx.id}
                            className="py-2 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                                {tx.description}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-mono-tabular">
                                <span>{formatShortDateBR(tx.date)}</span>
                                {tx.itemExcessInCents !== null &&
                                  tx.itemExcessInCents > 0 && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="text-red-600 dark:text-amber-400">
                                        +{formatCurrencyFromCents(tx.itemExcessInCents)} vs média do item
                                      </span>
                                    </>
                                  )}
                              </div>
                            </div>
                            <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white shrink-0">
                              {formatCurrencyFromCents(tx.amountInCents)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
