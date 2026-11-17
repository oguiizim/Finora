import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CategoryIcon } from '#/components/ui/category-icon.tsx'
import { useAppUI } from '#/components/ui/theme-provider.tsx'
import { listCategories } from '#/domains/categories/queries.ts'
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
  const [searchText, setSearchText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const categoryMenuRef = useRef<HTMLDivElement>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => listTransactions({ data: { period: 'LAST_6_MONTHS', all: true } }),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
  })
  const selectedCategory = categories.find((category) => category.id === categoryId)
  const filteredTransactions = useMemo(() => {
    const search = searchText.trim().toLocaleLowerCase('pt-BR')
    return (data?.items ?? []).filter((transaction) => {
      const matchesText = !search
        || transaction.description.toLocaleLowerCase('pt-BR').includes(search)
      const matchesCategory = !categoryId || transaction.categoryId === categoryId
      return matchesText && matchesCategory
    })
  }, [categoryId, data?.items, searchText])
  useEffect(() => {
    if (!isCategoryMenuOpen) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !categoryMenuRef.current?.contains(event.target)) {
        setIsCategoryMenuOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCategoryMenuOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isCategoryMenuOpen])
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-zinc-300">Nome do lançamento</span>
        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Buscar pelo nome..."
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-amber-400"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-zinc-300">Filtrar por categoria</span>
        <div className="relative" ref={categoryMenuRef}>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isCategoryMenuOpen}
            aria-controls="transaction-category-options"
            onClick={() => setIsCategoryMenuOpen((open) => !open)}
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm text-slate-900 transition-colors hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-amber-400/60 dark:focus:ring-amber-400"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {categoryId ? (
                <>
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: `${selectedCategory?.color ?? '#94a3b8'}20`,
                      color: selectedCategory?.color ?? '#94a3b8',
                    }}
                  >
                    <CategoryIcon
                      name={selectedCategory?.icon ?? 'tag'}
                      className="h-3.5 w-3.5"
                    />
                  </span>
                  <span className="truncate">
                    {selectedCategory?.name ?? 'Categoria'}
                  </span>
                </>
              ) : (
                <span className="text-slate-500 dark:text-zinc-400">Todas as categorias</span>
              )}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform dark:text-zinc-400 ${isCategoryMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isCategoryMenuOpen && (
            <div
              id="transaction-category-options"
              role="listbox"
              aria-label="Filtrar por categoria"
              className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-[#181a20]"
            >
              <button
                type="button"
                role="option"
                aria-selected={!categoryId}
                onClick={() => {
                  setCategoryId('')
                  setIsCategoryMenuOpen(false)
                }}
                className={`flex min-h-10 w-full items-center rounded-lg px-2.5 text-left text-sm transition-colors ${
                  !categoryId
                    ? 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-amber-400/10 dark:text-amber-300'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'
                }`}
              >
                Todas as categorias
              </button>
              {categories.map((category) => {
                const isSelected = categoryId === category.id
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setCategoryId(category.id)
                      setIsCategoryMenuOpen(false)
                    }}
                    className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-amber-400/10 dark:text-amber-300'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                      }}
                    >
                      <CategoryIcon name={category.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate">{category.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </label>
    </div>
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#12141a]">
      {isLoading ? <div className="p-8 text-sm animate-pulse">Carregando lançamentos…</div> : <table className="w-full min-w-[620px] text-left"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-zinc-900"><tr><th className="p-4">Descrição</th><th>Categoria</th><th>Data</th><th className="text-right">Valor</th><th className="p-4 text-right">Ações</th></tr></thead><tbody>{filteredTransactions.map(tx => <tr key={tx.id} className="border-t border-slate-100 text-sm dark:border-zinc-800"><td className="p-4 font-medium whitespace-nowrap">{tx.description}</td><td className="whitespace-nowrap">{tx.categoryName}</td><td className="font-mono-tabular text-xs text-slate-500 whitespace-nowrap">{formatDateBR(tx.date)}</td><td className={tx.type === 'INCOME' ? 'font-mono-tabular text-right text-emerald-600 whitespace-nowrap' : 'font-mono-tabular text-right whitespace-nowrap'}>{tx.type === 'INCOME' ? '+' : '-'}{compactCurrency(tx.amountInCents)}</td><td className="p-2 pr-4 text-right"><div className="inline-flex gap-1"><button type="button" onClick={() => openQuickTransaction(tx.type, tx)} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-white" aria-label={`Editar ${tx.description}`} title="Editar lançamento"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => setDeleting(tx)} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-600" aria-label={`Excluir ${tx.description}`} title="Excluir lançamento"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>}
      {!isLoading && filteredTransactions.length === 0 && (
        <p className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
          Nenhum lançamento encontrado para esses filtros.
        </p>
      )}
    </div>
    {deleting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#12141a]"><h2 className="font-bold">Excluir lançamento?</h2><p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Deseja excluir “{deleting.description}”? Esta ação não pode ser desfeita.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleting(null)} className="min-h-10 px-3 text-xs">Cancelar</button><button type="button" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id)} className="min-h-10 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white disabled:opacity-50">Excluir</button></div></div></div>}
  </div>
}
