import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CategoryIcon } from '#/components/ui/category-icon.tsx';
import { useAppUI } from '#/components/ui/theme-provider.tsx';
import { seedDefaultCategories } from '#/domains/categories/mutations.ts';
import { listCategories } from '#/domains/categories/queries.ts';
import {
  createTransaction,
  updateTransaction,
} from '#/domains/transactions/mutations.ts';
import type { TransactionWithCategory } from '#/domains/transactions/queries.ts';
import {
  centsToDecimalInput,
  formatCurrencyFromCents,
  parseCurrencyInputToCents,
} from '#/lib/formatters/index.ts';
import { getTodayISO } from '#/lib/utils/index.ts';

interface TransactionFormProps {
  defaultType?: 'EXPENSE' | 'INCOME';
  editingTransaction?: TransactionWithCategory | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocusAmount?: boolean;
}

const QUICK_AMOUNTS_CENTS = [
  { label: '+R$ 15', cents: 1500 },
  { label: '+R$ 30', cents: 3000 },
  { label: '+R$ 50', cents: 5000 },
  { label: '+R$ 100', cents: 10000 },
];

function formatDateForInput(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${day}/${month}/${year}` : '';
}

function formatDateDigits(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseBrazilianDate(value: string): string | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const isoDate = `${year}-${month}-${day}`;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)
    ? isoDate
    : null;
}

export function TransactionForm({
  defaultType = 'EXPENSE',
  editingTransaction = null,
  onSuccess,
  onCancel,
  autoFocusAmount = true,
}: TransactionFormProps) {
  const queryClient = useQueryClient();
  const { showToast } = useAppUI();
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  const [type, setType] = useState<'EXPENSE' | 'INCOME'>(
    editingTransaction ? editingTransaction.type : defaultType,
  );
  const [amountRaw, setAmountRaw] = useState<string>(
    editingTransaction
      ? centsToDecimalInput(editingTransaction.amountInCents)
      : '',
  );
  const [description, setDescription] = useState<string>(
    editingTransaction ? editingTransaction.description : '',
  );
  const [categoryId, setCategoryId] = useState<string>(
    editingTransaction?.categoryId || '',
  );
  const [date, setDate] = useState<string>(
    editingTransaction ? editingTransaction.date : getTodayISO(),
  );
  const [dateInput, setDateInput] = useState<string>(() =>
    formatDateForInput(editingTransaction ? editingTransaction.date : getTodayISO()),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const { data: allCategories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', { includeArchived: true }],
    queryFn: () =>
      listCategories({ data: { includeArchived: true, type: 'ALL' } }),
  });

  // Filter categories: exclude archived unless it's the currently selected category of an edited transaction
  const availableCategories = useMemo(() => {
    return allCategories.filter((cat) => {
      const matchesType = cat.type === type || cat.type === 'BOTH';
      if (!matchesType) return false;
      if (!cat.isArchived) return true;
      return editingTransaction?.categoryId === cat.id;
    });
  }, [allCategories, type, editingTransaction]);
  const selectedCategory = availableCategories.find((cat) => cat.id === categoryId);

  useEffect(() => {
    if (
      categoryId &&
      availableCategories.length > 0 &&
      !availableCategories.some((c) => c.id === categoryId)
    ) {
      setCategoryId('');
    }
  }, [availableCategories, categoryId]);

  useEffect(() => {
    if (!isCategoryMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !categoryMenuRef.current?.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCategoryMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isCategoryMenuOpen]);

  useEffect(() => {
    if (autoFocusAmount && amountInputRef.current) {
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [autoFocusAmount]);

  const parsedCents = useMemo(
    () => parseCurrencyInputToCents(amountRaw),
    [amountRaw],
  );

  const seedCategoriesMutation = useMutation({
    mutationFn: () => seedDefaultCategories(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast('Categorias padrão carregadas!', 'success');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (parsedCents <= 0) {
        throw new Error('Informe um valor maior que R$ 0,00.');
      }
      if (!description.trim() || description.trim().length < 2) {
        throw new Error('Informe uma descrição curta (ex: Almoço, Uber, Mercado).');
      }
      if (type === 'EXPENSE' && !categoryId) {
        throw new Error('Selecione uma categoria para a despesa.');
      }
      const normalizedDate = parseBrazilianDate(dateInput);
      if (!normalizedDate) {
        throw new Error('Informe uma data válida no formato DD/MM/AAAA.');
      }

      if (editingTransaction) {
        return updateTransaction({
          data: {
            id: editingTransaction.id,
            type,
            description: description.trim(),
            amountInCents: parsedCents,
            date: normalizedDate,
            categoryId: categoryId || null,
          },
        });
      }

      return createTransaction({
        data: {
          type,
          description: description.trim(),
          amountInCents: parsedCents,
          date: normalizedDate,
          categoryId: categoryId || null,
        },
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
      ]);

      showToast(
        editingTransaction
          ? 'Lançamento atualizado com sucesso!'
          : type === 'EXPENSE'
            ? `Gasto de ${formatCurrencyFromCents(parsedCents)} registrado!`
            : `Receita de ${formatCurrencyFromCents(parsedCents)} registrada!`,
        'success',
      );

      if (!editingTransaction) {
        setAmountRaw('');
        setDescription('');
      }

      onSuccess?.();
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
    },
  });

  const handleQuickAddCents = (centsToAdd: number) => {
    const nextCents = parsedCents + centsToAdd;
    setAmountRaw(centsToDecimalInput(nextCents));
  };

  const setQuickDate = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    setDate(isoDate);
    setDateInput(formatDateForInput(isoDate));
  };

  const todayISO = getTodayISO();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayISO = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Segmented Type Selector (Despesa vs Receita) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setType('EXPENSE')}
          className={`min-h-[44px] flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            type === 'EXPENSE'
              ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-xs border border-slate-200/80 dark:border-zinc-700'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Despesa</span>
        </button>
        <button
          type="button"
          onClick={() => setType('INCOME')}
          className={`min-h-[44px] flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            type === 'INCOME'
              ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-zinc-700'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Receita</span>
        </button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs font-medium"
        >
          {errorMessage}
        </div>
      )}

      {/* Numeric Amount Input (Mobile-first large touch target) */}
      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800/90">
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="tx-amount-input"
            className="text-xs font-medium text-slate-500 dark:text-zinc-400"
          >
            Valor do lançamento
          </label>
          <span className="text-xs font-mono-tabular text-slate-500 dark:text-zinc-400">
            {parsedCents > 0
              ? formatCurrencyFromCents(parsedCents)
              : 'R$ 0,00'}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={`text-xl font-bold font-mono-tabular ${
              type === 'EXPENSE'
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            R$
          </span>
          <input
            ref={amountInputRef}
            id="tx-amount-input"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amountRaw}
            onChange={(e) => setAmountRaw(e.target.value)}
            required
            className="w-full bg-transparent text-3xl font-bold font-mono-tabular text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-700 focus:outline-none"
          />
        </div>

        {/* Fast Tap Increments for Mobile */}
        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/70 dark:border-zinc-800/80 overflow-x-auto">
          {QUICK_AMOUNTS_CENTS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleQuickAddCents(chip.cents)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono-tabular font-medium bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-amber-400/60 active:scale-95 transition-all whitespace-nowrap"
            >
              {chip.label}
            </button>
          ))}
          {parsedCents > 0 && (
            <button
              type="button"
              onClick={() => setAmountRaw('')}
              className="ml-auto px-2 py-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 whitespace-nowrap"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Description / Item Input */}
      <div>
        <label
          htmlFor="tx-description-input"
          className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5"
        >
          {type === 'EXPENSE'
            ? 'O que você comprou ou pagou?'
            : 'Origem da receita'}
        </label>
        <input
          id="tx-description-input"
          type="text"
          placeholder={
            type === 'EXPENSE'
              ? 'Ex: Supermercado, Almoço, Uber, Conta de Luz...'
              : 'Ex: Salário mensal, Freelance, Reembolso...'
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-amber-400"
        />
      </div>

      {/* Category selector */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">
            Categoria
        </label>

        {isLoadingCategories ? (
          <div className="h-11 rounded-xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />
        ) : availableCategories.length === 0 ? (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Nenhuma categoria cadastrada neste banco.
            </span>
            <button
              type="button"
              onClick={() => seedCategoriesMutation.mutate()}
              disabled={seedCategoriesMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 dark:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold whitespace-nowrap"
            >
              Criar categorias padrão
            </button>
          </div>
        ) : (
          <div className="relative" ref={categoryMenuRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isCategoryMenuOpen}
              aria-controls="transaction-form-category-options"
              onClick={() => setIsCategoryMenuOpen((open) => !open)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm text-slate-900 transition-colors hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-amber-400/60 dark:focus:ring-amber-400"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {selectedCategory ? (
                  <>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}>
                      <CategoryIcon name={selectedCategory.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate">{selectedCategory.name}</span>
                  </>
                ) : (
                  <span className="text-slate-500 dark:text-zinc-400">Selecione uma categoria</span>
                )}
              </span>
              <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform dark:text-zinc-400 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isCategoryMenuOpen && (
              <div id="transaction-form-category-options" role="listbox" aria-label="Categoria da transação" className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-[#181a20]">
                {type === 'INCOME' && (
                  <button type="button" role="option" aria-selected={!categoryId} onClick={() => { setCategoryId(''); setIsCategoryMenuOpen(false); }} className={`flex min-h-10 w-full items-center rounded-lg px-2.5 text-left text-sm transition-colors ${!categoryId ? 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-amber-400/10 dark:text-amber-300' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'}`}>
                    Sem categoria
                  </button>
                )}
                {availableCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button key={cat.id} type="button" role="option" aria-selected={isSelected} onClick={() => { setCategoryId(cat.id); setIsCategoryMenuOpen(false); }} className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors ${isSelected ? 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-amber-400/10 dark:text-amber-300' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'}`}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                        <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{cat.name}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-600 dark:text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="tx-date-input"
              className="text-xs font-medium text-slate-700 dark:text-zinc-300"
            >
              Data
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                  date === todayISO
                    ? 'bg-emerald-600 text-white dark:bg-amber-400 dark:text-zinc-950'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(-1)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                  date === yesterdayISO
                    ? 'bg-emerald-600 text-white dark:bg-amber-400 dark:text-zinc-950'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                Ontem
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              id="tx-date-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={dateInput}
              onChange={(e) => {
                const formattedDate = formatDateDigits(e.target.value);
                setDateInput(formattedDate);
                const parsedDate = parseBrazilianDate(formattedDate);
                if (parsedDate) setDate(parsedDate);
              }}
              required
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm font-mono-tabular text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-amber-400"
            />
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors whitespace-nowrap"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="flex-1 min-h-[48px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : editingTransaction ? (
            <span>Salvar alterações</span>
          ) : type === 'EXPENSE' ? (
            <span>Confirmar gasto</span>
          ) : (
            <span>Confirmar receita</span>
          )}
        </button>
      </div>
    </form>
  );
}
