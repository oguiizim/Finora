import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  listRecurring,
  removeRecurring,
  saveRecurring,
  type Frequency,
  type RecurringExpense,
} from "#/domains/recurring/api.ts";
import { listCategories } from "#/domains/categories/queries.ts";
import {
  formatCurrencyFromCents,
  parseCurrencyInputToCents,
  centsToDecimalInput,
} from "#/lib/formatters/index.ts";
import { useAppUI } from "#/components/ui/theme-provider.tsx";
import { CategoryIcon } from "#/components/ui/category-icon.tsx";
export const Route = createFileRoute("/recorrentes")({ component: Page });
const labels: Record<Frequency, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  YEARLY: "Anual",
};
type Draft = {
  id?: string;
  name: string;
  amount: string;
  category_id: string;
  frequency: Frequency;
  start_date: string;
  end_date: string;
  status: "ACTIVE" | "INACTIVE";
};
const blank = (): Draft => ({
  name: "",
  amount: "",
  category_id: "",
  frequency: "MONTHLY",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  status: "ACTIVE",
});

function formatDateForInput(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return year && month && day ? `${day}/${month}/${year}` : "";
}
function formatDateDigits(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
function parseBrazilianDate(value: string): string | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
    ? `${year}-${month}-${day}`
    : null;
}
function getISODate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function DateField({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  const [input, setInput] = useState(() => formatDateForInput(value));
  useEffect(() => setInput(formatDateForInput(value)), [value]);
  const setQuickDate = (offset: number) => onChange(getISODate(offset));
  return (
    <div className="block text-xs font-medium">
      <div className="mb-1.5 flex items-center justify-between">
        <span>{label}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuickDate(0)}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${value === getISODate(0) ? "bg-emerald-600 text-white dark:bg-amber-400 dark:text-zinc-950" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setQuickDate(-1)}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${value === getISODate(-1) ? "bg-emerald-600 text-white dark:bg-amber-400 dark:text-zinc-950" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
          >
            Ontem
          </button>
        </div>
      </div>
      <div>
        <input
          required={!optional}
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          value={input}
          placeholder={optional ? "Sem término" : "dd/mm/aaaa"}
          className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-mono-tabular text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-amber-400"
          onChange={(event) => {
            const next = formatDateDigits(event.target.value);
            setInput(next);
            const parsed = parseBrazilianDate(next);
            if (parsed) onChange(parsed);
            if (!next && optional) onChange("");
          }}
        />
      </div>
    </div>
  );
}

function Dropdown({
  value,
  options,
  onChange,
  openUp = false,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  openUp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.value === value);
  return (
    <div className="relative mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm text-slate-900 transition-colors hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-amber-400/60 dark:focus:ring-amber-400"
      >
        <span className="truncate">{selected?.label ?? "Selecione"}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-500 transition-transform dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className={`absolute z-20 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-[#181a20] ${openUp ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex min-h-10 w-full items-center rounded-lg px-2.5 text-left text-sm transition-colors ${option.value === value ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-amber-400/10 dark:text-amber-300" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryDropdown({
  value,
  categories,
  onChange,
}: {
  value: string;
  categories: { id: string; name: string; icon: string; color: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((category) => category.id === value);
  return (
    <div className="relative mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm text-slate-900 transition-colors hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-amber-400/60 dark:focus:ring-amber-400"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {selected ? (
            <>
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-md"
                style={{
                  backgroundColor: `${selected.color}20`,
                  color: selected.color,
                }}
              >
                <CategoryIcon name={selected.icon} className="size-3.5" />
              </span>
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-slate-500 dark:text-zinc-400">
              Selecione uma categoria
            </span>
          )}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-500 transition-transform dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute bottom-full z-20 mb-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-[#181a20]">
          {categories.map((category) => {
            const active = category.id === value;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onChange(category.id);
                  setOpen(false);
                }}
                className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs transition-colors ${active ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-amber-400/10 dark:text-amber-300" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"}`}
              >
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                  }}
                >
                  <CategoryIcon name={category.icon} className="size-3.5" />
                </span>
                <span className="truncate">{category.name}</span>
                {active && (
                  <Check className="ml-auto size-4 shrink-0 text-emerald-600 dark:text-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
function Page() {
  const query = useQueryClient();
  const { showToast } = useAppUI();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<RecurringExpense | null>(null);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["recurring-expenses"],
    queryFn: listRecurring,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });
  const save = useMutation({
    mutationFn: (d: Draft) => {
      if (!d.category_id) throw new Error("Selecione uma categoria.");
      return saveRecurring({
        id: d.id,
        name: d.name,
        amount: parseCurrencyInputToCents(d.amount),
        category_id: d.category_id ? Number(d.category_id) : null,
        frequency: d.frequency,
        start_date: d.start_date,
        end_date: d.end_date || null,
        status: d.status,
      });
    },
    onSuccess: () => {
      query.invalidateQueries({ queryKey: ["recurring-expenses"] });
      setDraft(null);
      showToast("Gasto recorrente salvo.", "success");
    },
    onError: (e: Error) => showToast(e.message, "error"),
  });
  const remove = useMutation({
    mutationFn: removeRecurring,
    onSuccess: () => {
      query.invalidateQueries({ queryKey: ["recurring-expenses"] });
      setDeleting(null);
      showToast("Gasto recorrente excluído.", "info");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });
  const edit = (x: RecurringExpense) =>
    setDraft({
      id: x.id,
      name: x.name,
      amount: centsToDecimalInput(x.amount),
      category_id: x.category_id ? String(x.category_id) : "",
      frequency: x.frequency,
      start_date: x.start_date,
      end_date: x.end_date ?? "",
      status: x.status,
    });
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Gastos recorrentes
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Registre compromissos futuros sem criar lançamentos duplicados.
          </p>
        </div>
        <button
          onClick={() => setDraft(blank())}
          className="shrink-0 min-h-10 rounded-xl bg-emerald-600 px-3 sm:px-4 text-sm font-semibold text-white dark:bg-amber-400 dark:text-zinc-950"
        >
          <Plus className="mr-1 inline size-4" />
          Novo gasto
        </button>
      </div>
      <div className="space-y-2 md:hidden">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm dark:border-zinc-800 dark:bg-[#12141a]">
            Carregando...
          </div>
        ) : (
          items.map((x) => (
            <article
              key={x.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#12141a]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{x.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">{labels[x.frequency]}</p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {formatCurrencyFromCents(x.amount)}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
                <span
                  className={`text-xs font-medium ${
                    x.status === "ACTIVE"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-slate-500"
                  }`}
                >
                  {x.status === "ACTIVE" ? "Ativo" : "Inativo"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => edit(x)}
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    aria-label={`Editar ${x.name}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(x)}
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    aria-label={`Excluir ${x.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#12141a] md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-900 text-left text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3">Gasto</th>
              <th className="px-5 py-3">Frequência</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Valor</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">
                  Carregando...
                </td>
              </tr>
            ) : (
              items.map((x) => (
                <tr
                  key={x.id}
                  className="border-t border-slate-100 dark:border-zinc-800"
                >
                  <td className="px-5 py-4 font-medium">{x.name}</td>
                  <td className="px-5 py-4">{labels[x.frequency]}</td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        x.status === "ACTIVE"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-slate-500"
                      }
                    >
                      {x.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatCurrencyFromCents(x.amount)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => edit(x)} className="p-2">
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(x)}
                      className="p-2 text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {draft && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recurring-modal-title"
        >
          <button
            type="button"
            className="fixed inset-0 cursor-default"
            onClick={() => setDraft(null)}
            aria-label="Fechar modal"
          />
          <form
            className="transaction-modal-scroll relative z-10 max-h-[92vh] w-full space-y-4 overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-[#12141a] sm:max-w-lg sm:rounded-2xl sm:border sm:p-6"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(draft);
            }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-zinc-700 sm:hidden" />
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="recurring-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {draft.id ? "Editar gasto recorrente" : "Novo gasto recorrente"}
              </h2>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="flex min-h-10 min-w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-white"
                aria-label="Fechar modal"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/90">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Valor do compromisso
                </label>
                <span className="text-xs font-mono-tabular text-slate-500 dark:text-zinc-400">
                  {formatCurrencyFromCents(
                    parseCurrencyInputToCents(draft.amount),
                  )}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono-tabular text-red-600 dark:text-red-400">
                  R$
                </span>
                <input
                  required
                  autoFocus
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft({ ...draft, amount: e.target.value })
                  }
                  inputMode="decimal"
                  placeholder="0,00"
                  className="w-full bg-transparent text-3xl font-bold font-mono-tabular text-slate-900 placeholder:text-slate-300 focus:outline-none dark:text-white dark:placeholder:text-zinc-700"
                />
              </div>
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto border-t border-slate-200/70 pt-2.5 dark:border-zinc-800/80">
                {[1500, 5000, 10000].map((cents) => (
                  <button
                    key={cents}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        amount: centsToDecimalInput(
                          parseCurrencyInputToCents(draft.amount) + cents,
                        ),
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono-tabular font-medium text-slate-700 transition-colors hover:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-amber-400/60"
                  >
                    {cents === 1500
                      ? "+R$ 15"
                      : cents === 5000
                        ? "+R$ 50"
                        : "+R$ 100"}
                  </button>
                ))}
                {draft.amount && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, amount: "" })}
                    className="ml-auto px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
              O que você paga?
              <input
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Mercado"
                className="mt-1.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-amber-400"
              />
            </label>
            <label className="block text-xs font-medium">
              Frequência
              <Dropdown
                value={draft.frequency}
                options={Object.entries(labels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(frequency) =>
                  setDraft({ ...draft, frequency: frequency as Frequency })
                }
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DateField
                label="Início"
                value={draft.start_date}
                onChange={(start_date) => setDraft({ ...draft, start_date })}
              />
              <DateField
                label="Término"
                optional
                value={draft.end_date}
                onChange={(end_date) => setDraft({ ...draft, end_date })}
              />
            </div>
            <label className="block text-xs font-medium">
              Categoria
              <CategoryDropdown
                value={draft.category_id}
                categories={categories}
                onChange={(category_id) => setDraft({ ...draft, category_id })}
              />
            </label>
            <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={draft.status === "ACTIVE"}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.checked ? "ACTIVE" : "INACTIVE",
                  })
                }
                className="size-[1.15rem] shrink-0 appearance-none rounded-md border border-slate-400 bg-slate-100 transition-colors checked:border-emerald-600 checked:bg-emerald-600 checked:shadow-[inset_0_0_0_3px_white] focus:outline-none focus:ring-2 focus:ring-emerald-600/35 dark:border-zinc-600 dark:bg-zinc-800 dark:checked:border-amber-400 dark:checked:bg-amber-400 dark:checked:shadow-[inset_0_0_0_3px_#18181b] dark:focus:ring-amber-400/35"
              />
              Ativo para projeções
            </label>
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="min-h-12 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:w-auto"
              >
                Cancelar
              </button>
              <button
                disabled={save.isPending}
                className="min-h-12 w-full flex-1 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 disabled:opacity-50 dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300"
              >
                {save.isPending ? "Salvando..." : "Salvar gasto recorrente"}
              </button>
            </div>
          </form>
        </div>
      )}
      {deleting && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-recurring-title"
        >
          <button
            type="button"
            className="fixed inset-0 cursor-default"
            onClick={() => !remove.isPending && setDeleting(null)}
            aria-label="Cancelar exclusão"
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-[#12141a]">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-5" />
            </div>
            <h2
              id="delete-recurring-title"
              className="mt-4 text-lg font-bold text-slate-900 dark:text-white"
            >
              Excluir gasto recorrente?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">
              Você está prestes a excluir{" "}
              <span className="font-semibold text-slate-700 dark:text-zinc-200">
                “{deleting.name}”
              </span>
              . Esta ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => setDeleting(null)}
                className="min-h-11 rounded-xl px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleting.id)}
                className="min-h-11 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:opacity-50"
              >
                {remove.isPending ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
