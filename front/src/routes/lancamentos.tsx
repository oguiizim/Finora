import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAppUI } from '#/components/ui/theme-provider.tsx'
import { deleteTransaction } from '#/domains/transactions/mutations.ts'
import { type TransactionWithCategory, listTransactions } from '#/domains/transactions/queries.ts'
import { formatCurrencyFromCents, formatDateBR } from '#/lib/formatters/index.ts'

export const Route = createFileRoute('/lancamentos')({ component: Page })

function compactCurrency(value: number) {
  return formatCurrencyFromCents(value).replace('R$\u00a0', 'R$\u2009')
}

function Page() {
  const { openQuickTransaction, showToast } = useAppUI()
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState<TransactionWithCategory | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => listTransactions({ data: { period: 'LAST_6_MONTHS' } }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteTransaction({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleting(null)
      showToast('Lançamento excluído.', 'info')
    },
    onError: (error: Error) => showToast(error.message, 'error'),
  })

  return <div className="space-y-5">
    <div><h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Histórico de lançamentos</h1><p className="mt-1 text-xs text-slate-500">Consulte, edite e acompanhe suas receitas e despesas</p></div>
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#12141a]">
      {isLoading ? <div className="p-8 text-sm animate-pulse">Carregando lançamentos…</div> : <table className="w-full min-w-[620px] text-left"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-zinc-900"><tr><th className="p-4">Descrição</th><th>Categoria</th><th>Data</th><th className="text-right">Valor</th><th className="p-4 text-right">Ações</th></tr></thead><tbody>{data?.items.map(tx => <tr key={tx.id} className="border-t border-slate-100 text-sm dark:border-zinc-800"><td className="p-4 font-medium whitespace-nowrap">{tx.description}</td><td className="whitespace-nowrap">{tx.categoryName}</td><td className="font-mono-tabular text-xs text-slate-500 whitespace-nowrap">{formatDateBR(tx.date)}</td><td className={tx.type === 'INCOME' ? 'font-mono-tabular text-right text-emerald-600 whitespace-nowrap' : 'font-mono-tabular text-right whitespace-nowrap'}>{tx.type === 'INCOME' ? '+' : '-'}{compactCurrency(tx.amountInCents)}</td><td className="p-2 pr-4 text-right"><div className="inline-flex gap-1"><button type="button" onClick={() => openQuickTransaction(tx.type, tx)} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-white" aria-label={`Editar ${tx.description}`} title="Editar lançamento"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => setDeleting(tx)} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-600" aria-label={`Excluir ${tx.description}`} title="Excluir lançamento"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>}
    </div>
    {deleting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#12141a]"><h2 className="font-bold">Excluir lançamento?</h2><p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Deseja excluir “{deleting.description}”? Esta ação não pode ser desfeita.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleting(null)} className="min-h-10 px-3 text-xs">Cancelar</button><button type="button" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id)} className="min-h-10 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white disabled:opacity-50">Excluir</button></div></div></div>}
  </div>
}
