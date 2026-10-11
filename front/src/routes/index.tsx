import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertCircle, ArrowUpRight, Plus, RefreshCw, Wallet } from 'lucide-react'
import { CategoryBreakdownSection, MonthlyEvolutionChart, WeeklySpendingChart } from '#/components/charts/financial-charts.tsx'
import { KpiCards } from '#/components/dashboard/kpi-cards.tsx'
import { PeriodSelector } from '#/components/dashboard/period-selector.tsx'
import { TopExpensesAndRecentSection } from '#/components/dashboard/top-expenses-card.tsx'
import { useAppUI } from '#/components/ui/theme-provider.tsx'
import { getDashboardData } from '#/domains/dashboard/queries.ts'
import type { PeriodPreset } from '#/domains/transactions/schemas.ts'
import { formatDateBR } from '#/lib/formatters/index.ts'

export const Route = createFileRoute('/')({ component: Home })
function Home() {
  const { openQuickTransaction } = useAppUI()
  const [period, setPeriod] = useState<{period:PeriodPreset;startDate?:string;endDate?:string}>({period:'THIS_MONTH'})
  const [months, setMonths] = useState(6)
  const {data,isLoading,isError,error,refetch}=useQuery({queryKey:['dashboard',period,months],queryFn:()=>getDashboardData({data:{...period,monthsInterval:months}})})
  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Visão financeira</h1>{data&&<p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{data.periodRange.label} · {formatDateBR(data.periodRange.startDate)} até {formatDateBR(data.periodRange.endDate)}</p>}</div><div className="flex gap-2.5"><button onClick={()=>openQuickTransaction('INCOME')} className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold flex gap-1.5 items-center"><ArrowUpRight className="w-4 h-4 text-emerald-600"/>Nova receita</button><button onClick={()=>openQuickTransaction('EXPENSE')} className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 dark:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold flex gap-1.5 items-center"><Plus className="w-4 h-4"/>Novo gasto</button></div></div>
    <PeriodSelector {...period} onChange={setPeriod}/>
    {isLoading&&<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">{[1,2,3,4,5].map(x=><div key={x} className="h-32 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800 animate-pulse"/>)}</div>}
    {isError&&<div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center"><AlertCircle className="w-8 h-8 text-red-600 mx-auto"/><p className="mt-2 text-sm">{error instanceof Error?error.message:'Erro ao carregar'}</p><button onClick={()=>refetch()} className="mt-3 text-xs font-semibold flex gap-2 mx-auto items-center"><RefreshCw className="w-4 h-4"/>Tentar novamente</button></div>}
    {data&&!data.hasAnyTransactions&&<div className="p-10 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800 text-center"><Wallet className="w-7 h-7 text-emerald-600 mx-auto"/><h2 className="mt-3 font-bold">Comece registrando seu primeiro gasto.</h2></div>}
    {data&&data.hasAnyTransactions&&<div className="space-y-6"><KpiCards data={data}/><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><WeeklySpendingChart weeklyChart={data.weeklyChart}/><MonthlyEvolutionChart monthlyChart={data.monthlyChart} monthsInterval={months} onMonthsIntervalChange={setMonths}/></div><CategoryBreakdownSection categories={data.categoryBreakdown} totalExpenseInCents={data.cards.expenseInCents} comparisonLabel={data.periodRange.comparisonLabel}/><TopExpensesAndRecentSection topExpenses={data.topExpenses} recentTransactions={data.recentTransactions}/></div>}
  </div>
}
