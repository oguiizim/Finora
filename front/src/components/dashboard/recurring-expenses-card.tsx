import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listRecurring } from "#/domains/recurring/api.ts";
import { formatCurrencyFromCents } from "#/lib/formatters/index.ts";
export function RecurringExpensesCard() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["recurring-expenses"],
    queryFn: listRecurring,
  });
  const items = data
    .filter((x) => x.status === "ACTIVE")
    .sort((a, b) => b.amount - a.amount);
  const total = items.reduce((sum, x) => sum + x.amount, 0);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#12141a]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h2 className="font-bold">Gastos recorrentes</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            Compromissos ativos
          </p>
        </div>
        <Link
          to="/recorrentes"
          className="text-xs font-semibold text-emerald-700 dark:text-amber-300"
        >
          Gerenciar
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3 font-medium">Gasto</th>
              <th className="px-5 py-3 text-right font-medium">Custo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-5 py-5 text-center text-slate-500"
                >
                  Carregando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-5 py-5 text-center text-slate-500"
                >
                  Nenhum gasto recorrente ativo.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-100 dark:border-zinc-800"
                >
                  <td className="px-5 py-3.5 font-medium">{item.name}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {formatCurrencyFromCents(item.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 dark:border-zinc-700 font-bold">
              <td className="px-5 py-4">Total</td>
              <td className="px-5 py-4 text-right tabular-nums">
                {formatCurrencyFromCents(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
