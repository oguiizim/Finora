import { Link } from '@tanstack/react-router';
import { ArrowRight, Pencil } from 'lucide-react';
import { useAppUI } from '#/components/ui/theme-provider.tsx';
import type { DashboardData } from '#/domains/dashboard/calculations.ts';
import type { TransactionWithCategory } from '#/domains/transactions/queries.ts';
import {
  formatCurrencyFromCents,
  formatPercentage,
  formatShortDateBR,
} from '#/lib/formatters/index.ts';

export function TopExpensesAndRecentSection({
  topExpenses,
  recentTransactions,
}: {
  topExpenses: DashboardData['topExpenses'];
  recentTransactions: TransactionWithCategory[];
}) {
  const { openQuickTransaction } = useAppUI();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Maiores Gastos do Período */}
      <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Maiores gastos do período
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Ranking das despesas de maior impacto no orçamento
            </p>
          </div>
        </div>

        {topExpenses.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400 py-8 text-center">
            Nenhuma despesa registrada neste período.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {topExpenses.map((item, idx) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-mono-tabular font-semibold text-slate-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-zinc-100 truncate">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                      <span>{item.categoryName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {formatShortDateBR(item.date)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {formatPercentage(item.shareOfPeriodPercent)} do total
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-sm font-mono-tabular font-bold text-red-600 dark:text-red-400 shrink-0">
                  {formatCurrencyFromCents(item.amountInCents)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Últimos Lançamentos do Período */}
      <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-zinc-800/90 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Últimos lançamentos
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Toque em qualquer item para editar rapidamente
              </p>
            </div>
            <Link
              to="/lancamentos"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-amber-400 hover:underline whitespace-nowrap"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-zinc-400 py-8 text-center">
              Nenhum lançamento no período selecionado.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {recentTransactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.id}
                  className="py-2.5 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-zinc-100 truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                      <span>{tx.categoryName || 'Receita'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {formatShortDateBR(tx.date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-sm font-mono-tabular font-bold ${
                        tx.type === 'INCOME'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-zinc-100'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatCurrencyFromCents(tx.amountInCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openQuickTransaction(tx.type, tx)}
                      className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      aria-label={`Editar ${tx.description}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
