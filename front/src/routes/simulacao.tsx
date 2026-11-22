import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "#/components/ui/calendar.tsx";
import { useAppUI } from "#/components/ui/theme-provider.tsx";
import {
  getProjection,
  simulateRecurring,
  type Frequency,
} from "#/domains/recurring/api.ts";
import {
  formatCurrencyFromCents,
  formatMonthYearBR,
  parseCurrencyInputToCents,
} from "#/lib/formatters/index.ts";

export const Route = createFileRoute("/simulacao")({ component: Page });
const frequencies: Record<Frequency, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  YEARLY: "Anual",
};
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#12141a]">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length <= 2
    ? digits
    : digits.length <= 4
      ? `${digits.slice(0, 2)}/${digits.slice(2)}`
      : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
function parseDateInput(value: string): string | null {
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
function SimulationDateField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState(
    value ? format(parseISO(value), "dd/MM/yyyy") : "",
  );
  const selected = value ? parseISO(value) : undefined;
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  return (
    <label className="block text-xs font-medium">
      <span className="mb-1.5 block">{label}</span>
      <div className="relative" ref={rootRef}>
        <input
          required={required}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          value={input}
          onChange={(event) => {
            const next = formatDateInput(event.target.value);
            setInput(next);
            const parsed = parseDateInput(next);
            if (parsed) onChange(parsed);
            if (!next && !required) onChange("");
          }}
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pr-10 text-left text-sm font-mono-tabular text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-amber-400"
        />
        <button
          type="button"
          aria-label={`Abrir calendário: ${label}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <CalendarDays className="h-3.5 w-3.5" />
        </button>
        {open && (
          <div
            role="dialog"
            className="absolute left-0 top-full z-20 mt-2 w-[17rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white py-3 shadow-xl dark:border-zinc-700 dark:bg-[#181a20]"
          >
            <Calendar
              mode="single"
              locale={ptBR}
              selected={selected}
              onSelect={(day) => {
                if (day) {
                  onChange(format(day, "yyyy-MM-dd"));
                  setInput(format(day, "dd/MM/yyyy"));
                  setOpen(false);
                }
              }}
              onTodayClick={() => {
                const today = new Date();
                onChange(format(today, "yyyy-MM-dd"));
                setInput(format(today, "dd/MM/yyyy"));
                setOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </label>
  );
}
function FrequencyDropdown({
  value,
  onChange,
}: {
  value: Frequency;
  onChange: (value: Frequency) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  return (
    <div className="relative mt-1" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-left text-sm text-slate-900 transition-colors hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-amber-400/60 dark:focus:ring-amber-400"
      >
        <span>{frequencies[value]}</span>
        <ChevronDown
          className={`size-3.5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute top-full z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-[#181a20]">
          {Object.entries(frequencies).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key as Frequency);
                setOpen(false);
              }}
              className={`flex min-h-9 w-full items-center rounded-lg px-2.5 text-left text-xs transition-colors ${key === value ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-amber-400/10 dark:text-amber-300" : "text-slate-600 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Page() {
  const { showToast } = useAppUI();
  const base = useQuery({
    queryKey: ["projection"],
    queryFn: () => getProjection(12),
  });
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof getProjection>
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    frequency: "MONTHLY" as Frequency,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
  });
  const data = result ?? base.data;
  if (base.isLoading) return <p>Carregando simulação...</p>;
  if (base.error)
    return (
      <p className="text-red-600">Não foi possível carregar a simulação.</p>
    );
  if (!data) return null;
  const next = data.months[0];
  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseCurrencyInputToCents(form.amount);
    if (amount <= 0) {
      showToast("Informe um valor maior que R$ 0,00.", "error");
      return;
    }
    setLoading(true);
    try {
      setResult(
        await simulateRecurring({
          ...form,
          name: "Despesa simulada",
          amount,
          end_date: form.end_date || null,
        }),
      );
      showToast("Simulação atualizada.", "success");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Não foi possível executar a simulação.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Planejamento financeiro
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          O restante estimado é a média mensal de receitas menos os compromissos
          recorrentes. Não representa saldo bancário ou renda futura.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Média mensal de receitas"
          value={formatCurrencyFromCents(data.monthly_income_average)}
        />
        <Metric label="Meses usados no cálculo" value={data.months_used} />
        <Metric
          label="Gastos recorrentes ativos"
          value={data.active_recurring_count}
        />
        <Metric
          label="Restante estimado — próximo mês"
          value={formatCurrencyFromCents(next?.remaining_after_recurring ?? 0)}
        />
      </div>
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#12141a]"
        onSubmit={run}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-bold">Simular nova parcela</h2>
            <p className="mt-1 text-xs text-slate-500">
              Este compromisso é temporário e não será salvo.
            </p>
          </div>
          {result && (
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-xs font-semibold text-emerald-700 dark:text-amber-300"
            >
              Limpar simulação
            </button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium">
            Valor
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold font-mono-tabular text-red-600 dark:text-red-400">
                R$
              </span>
              <input
                required
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00"
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm font-mono-tabular text-slate-900 placeholder:font-mono-tabular placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-amber-400"
              />
            </div>
          </label>
          <label className="text-xs font-medium">
            Frequência
            <FrequencyDropdown
              value={form.frequency}
              onChange={(frequency) => setForm({ ...form, frequency })}
            />
          </label>
          <SimulationDateField
            label="Primeira cobrança"
            required
            value={form.start_date}
            onChange={(start_date) => setForm({ ...form, start_date })}
          />
          <SimulationDateField
            label="Última cobrança"
            value={form.end_date}
            onChange={(end_date) => setForm({ ...form, end_date })}
          />
        </div>
        <button
          disabled={loading}
          className="mt-4 min-h-11 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto dark:bg-amber-400 dark:text-zinc-950"
        >
          {loading ? "Calculando..." : "Simular"}
        </button>
      </form>
      {!data.has_income_history && (
        <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Ainda não há receitas pagas no histórico. O restante estimado parte de
          R$ 0,00.
        </p>
      )}
      <div className="hidden">
        {data.months.map((month) => (
          <article
            key={month.month}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#12141a]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{formatMonthYearBR(month.month)}</h2>
              <p
                className={`shrink-0 font-semibold tabular-nums ${month.remaining_after_recurring < 0 ? "text-red-600" : "text-emerald-700 dark:text-emerald-400"}`}
              >
                {formatCurrencyFromCents(month.remaining_after_recurring)}
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-xs dark:border-zinc-800">
              <div>
                <dt className="text-slate-500">Média de receitas</dt>
                <dd className="mt-0.5 font-medium tabular-nums">
                  {formatCurrencyFromCents(month.monthly_income_average)}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-slate-500">Recorrentes</dt>
                <dd className="mt-0.5 font-medium tabular-nums">
                  {formatCurrencyFromCents(month.recurring_total)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#12141a]">
        <table className="w-full text-sm">
          <thead className="dark:bg-zinc-900 text-left text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3">Mês</th>
              <th className="px-5 py-3 text-right">Média de receitas</th>
              <th className="px-5 py-3 text-right">Recorrentes</th>
              <th className="px-5 py-3 text-right">Restante estimado</th>
            </tr>
          </thead>
          <tbody>
            {data.months.map((month) => (
              <tr
                key={month.month}
                className="border-t border-slate-100 dark:border-zinc-800"
              >
                <td className="px-5 py-4 font-medium">
                  {formatMonthYearBR(month.month)}
                </td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {formatCurrencyFromCents(month.monthly_income_average)}
                </td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {formatCurrencyFromCents(month.recurring_total)}
                </td>
                <td
                  className={`px-5 py-4 text-right font-semibold tabular-nums ${month.remaining_after_recurring < 0 ? "text-red-600" : "text-emerald-700 dark:text-emerald-400"}`}
                >
                  {formatCurrencyFromCents(month.remaining_after_recurring)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
