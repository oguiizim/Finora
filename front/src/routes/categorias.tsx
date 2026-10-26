import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useAppUI } from '#/components/ui/theme-provider.tsx'
import { createCategory, deleteCategory, updateCategory } from '#/domains/categories/mutations.ts'
import { type CategoryWithStats, listCategories } from '#/domains/categories/queries.ts'

export const Route = createFileRoute('/categorias')({ component: CategoriesPage })

function CategoriesPage() {
  const queryClient = useQueryClient()
  const { showToast } = useAppUI()
  const { data = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => listCategories() })
  const [editing, setEditing] = useState<CategoryWithStats | null>(null)
  const [name, setName] = useState('')
  const [deleting, setDeleting] = useState<CategoryWithStats | null>(null)
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  const save = useMutation({ mutationFn: () => editing ? updateCategory({ data: { id: editing.id, name } }) : createCategory({ data: { name } }), onSuccess: () => { refresh(); setEditing(null); setName(''); showToast(editing ? 'Categoria atualizada.' : 'Categoria criada.') }, onError: (error: Error) => showToast(error.message, 'error') })
  const remove = useMutation({ mutationFn: (id: string) => deleteCategory({ data: { id } }), onSuccess: () => { refresh(); setDeleting(null); showToast('Categoria excluída.', 'info') }, onError: (error: Error) => showToast(error.message, 'error') })
  const openCreate = () => { setEditing(null); setName('') }
  const openEdit = (category: CategoryWithStats) => { setEditing(category); setName(category.name) }

  return <div className="space-y-5">
    <div><h1 className="text-2xl sm:text-3xl font-bold">Categorias</h1><p className="text-xs text-slate-500 mt-1">Organize seus lançamentos</p></div>
    <form onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; save.mutate() }} className="p-4 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
      <input value={name} onChange={event => setName(event.target.value)} placeholder={editing ? 'Novo nome da categoria' : 'Nome da nova categoria'} className="flex-1 min-h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm" />
      <div className="flex gap-2"><button type="submit" disabled={save.isPending} className="min-h-11 px-4 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white text-xs font-semibold">{editing ? 'Salvar alterações' : 'Adicionar'}</button>{editing && <button type="button" onClick={openCreate} className="min-h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs" aria-label="Cancelar edição"><X className="w-4 h-4" /></button>}</div>
    </form>
    {isLoading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">{[1, 2, 3].map(item => <div key={item} className="h-24 rounded-2xl bg-white dark:bg-[#12141a] animate-pulse" />)}</div> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">{data.map(category => <div key={category.id} className="p-4 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-semibold truncate">{category.name}</p><p className="mt-1 text-xs text-slate-500">{category.transactionCount} lançamentos</p></div><div className="flex gap-1 shrink-0"><button type="button" onClick={() => openEdit(category)} className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800" aria-label={`Editar ${category.name}`}><Pencil className="w-4 h-4" /></button><button type="button" onClick={() => setDeleting(category)} className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-slate-400 hover:bg-red-500/10 hover:text-red-600" aria-label={`Excluir ${category.name}`}><Trash2 className="w-4 h-4" /></button></div></div>)}</div>}
    {deleting && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800 p-5"><h2 className="font-bold">Excluir categoria?</h2><p className="mt-2 text-sm text-slate-500">Deseja excluir “{deleting.name}”? Categorias com lançamentos não podem ser excluídas.</p><div className="flex justify-end gap-2 mt-5"><button type="button" onClick={() => setDeleting(null)} className="min-h-10 px-3 rounded-xl text-xs">Cancelar</button><button type="button" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id)} className="min-h-10 px-4 rounded-xl bg-red-600 text-white text-xs font-semibold">Excluir</button></div></div></div>}
  </div>
}
