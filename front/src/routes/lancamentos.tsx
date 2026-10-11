import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { useAppUI } from '#/components/ui/theme-provider.tsx'
import { listTransactions } from '#/domains/transactions/queries.ts'
import { formatCurrencyFromCents, formatDateBR } from '#/lib/formatters/index.ts'

export const Route = createFileRoute('/lancamentos')({ component: Page })

function compactCurrency(value: number) {
  return formatCurrencyFromCents(value).replace('R$\u00a0', 'R$\u2009')
}

function Page() {
  const { openQuickTransaction } = useAppUI()
  const { data, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => listTransactions({ data: { period: 'LAST_6_MONTHS' } }),
  })

  return <div className="space-y-5">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Histórico de lançamentos</h1>
      <p className="text-xs text-slate-500 mt-1">Consulte, edite e acompanhe suas receitas e despesas</p>
    </div>
    <div className="rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800 overflow-x-auto">
      {isLoading ? <div className="p-8 animate-pulse text-sm">Carregando lançamentos…</div> :
        <table className="w-full min-w-[620px] text-left">
          <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-zinc-900">
            <tr><th className="p-4">Descrição</th><th>Categoria</th><th>Data</th><th className="text-right">Valor</th><th className="p-4 text-right">Ações</th></tr>
          </thead>
          <tbody>{data?.items.map(tx => <tr key={tx.id} className="border-t border-slate-100 dark:border-zinc-800 text-sm">
            <td className="p-4 font-medium whitespace-nowrap">{tx.description}</td>
            <td className="whitespace-nowrap">{tx.categoryName}</td>
            <td className="whitespace-nowrap font-mono-tabular text-xs text-slate-500">{formatDateBR(tx.date)}</td>
            <td className={tx.type === 'INCOME' ? 'text-right text-emerald-600 font-mono-tabular whitespace-nowrap' : 'text-right font-mono-tabular whitespace-nowrap'}>{tx.type === 'INCOME' ? '+' : '-'}{compactCurrency(tx.amountInCents)}</td>
            <td className="p-2 pr-4 text-right"><button type="button" onClick={() => openQuickTransaction(tx.type, tx)} className="inline-flex min-w-9 min-h-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-white" aria-label={`Editar ${tx.description}`} title="Editar lançamento"><Pencil className="w-4 h-4" /></button></td>
          </tr>)}</tbody>
        </table>}
    </div>
  </div>
}
