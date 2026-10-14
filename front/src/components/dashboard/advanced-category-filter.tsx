import { SlidersHorizontal, X } from 'lucide-react'
import type { CategoryWithStats } from '#/domains/categories/queries.ts'
import { CategoryIcon } from '#/components/ui/category-icon.tsx'

interface AdvancedCategoryFilterProps {
  categories: CategoryWithStats[]
  selectedCategoryId?: string
  draftCategoryId?: string
  isOpen: boolean
  onToggle: () => void
  onDraftChange: (categoryId?: string) => void
  onApply: () => void
  onClear: () => void
}

export function AdvancedCategoryFilter({
  categories,
  selectedCategoryId,
  draftCategoryId,
  isOpen,
  onToggle,
  onDraftChange,
  onApply,
  onClear,
}: AdvancedCategoryFilterProps) {
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId)

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`min-h-[38px] px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
          isOpen || selectedCategory
            ? 'bg-emerald-600 dark:bg-amber-400 border-emerald-600 dark:border-amber-400 text-white dark:text-zinc-950'
            : 'bg-white dark:bg-[#12141a] border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-emerald-300 dark:hover:border-amber-400/60'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filtros avançados
        {selectedCategory && !isOpen && (
          <span className="max-w-28 truncate px-1.5 py-0.5 rounded-md bg-white/20 dark:bg-black/10 text-[10px]">
            {selectedCategory.name}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="shrink-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100">Categoria</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Selecione uma categoria</p>
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1" role="radiogroup" aria-label="Categoria do filtro">
            {categories.map((category) => {
              const isSelected = draftCategoryId === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onDraftChange(isSelected ? undefined : category.id)}
                  className={`min-h-[34px] px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-amber-400/10 border-emerald-300 dark:border-amber-400/60 text-emerald-800 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                    <CategoryIcon name={category.icon} className="w-2.5 h-2.5" />
                  </span>
                  {category.name}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onClear} className="min-h-[34px] px-2.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">
              Limpar
            </button>
            <button type="button" disabled={!draftCategoryId} onClick={onApply} className="min-h-[34px] px-3 rounded-lg bg-emerald-600 dark:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold disabled:opacity-45 disabled:cursor-not-allowed">
              Aplicar
            </button>
          </div>
        </div>
      )}

      {selectedCategory && !isOpen && (
        <button type="button" onClick={onClear} className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center gap-1 sm:min-h-[34px] sm:px-2.5 sm:rounded-lg sm:border sm:border-red-200 sm:bg-red-50 sm:text-red-700 sm:hover:bg-red-100 sm:dark:border-red-500/30 sm:dark:bg-red-500/10 sm:dark:text-red-400 sm:dark:hover:bg-red-500/20">
          <X className="w-3 h-3" /> Remover filtro de categoria
        </button>
      )}
    </div>
  )
}
